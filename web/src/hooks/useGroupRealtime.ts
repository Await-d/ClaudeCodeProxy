import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  ApiKeyGroup, 
  GroupRealtimeUpdate, 
  GroupStatistics,
  GroupHealthCheckResponse 
} from '@/types/apiKeyGroups';

// 实时分组状态Hook
export function useGroupRealtime(groupId?: string) {
  const [groups, setGroups] = useState<ApiKeyGroup[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 轮询间隔（毫秒）
  const POLLING_INTERVAL = 30000; // 30秒
  const HEALTH_CHECK_INTERVAL = 60000; // 1分钟

  // 获取分组数据
  const fetchGroupData = useCallback(async () => {
    try {
      // 这里应该调用实际的API
      // const response = await apiService.getGroups();
      // setGroups(response);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    }
  }, []);

  // 获取分组健康状态
  const checkGroupHealth = useCallback(async (targetGroupId?: string) => {
    try {
      const checkId = targetGroupId || groupId;
      if (!checkId) return null;

      // 这里应该调用实际的健康检查API
      // const response = await apiService.checkGroupHealth(checkId);
      const mockResponse: GroupHealthCheckResponse = {
        groupId: checkId,
        isHealthy: true,
        healthyKeysCount: 3,
        totalKeysCount: 5,
        apiKeyHealths: {},
        lastCheckAt: new Date().toISOString()
      };
      
      return mockResponse;
    } catch (error) {
      console.error('Failed to check group health:', error);
      return null;
    }
  }, [groupId]);

  // WebSocket连接（如果后端支持）
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/groups/realtime`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected for group updates');
        
        // 订阅特定分组（如果指定）
        if (groupId) {
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe',
            groupId: groupId
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const update: GroupRealtimeUpdate = JSON.parse(event.data);
          handleRealtimeUpdate(update);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        
        // 重连逻辑
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, [groupId]);

  // 处理实时更新
  const handleRealtimeUpdate = useCallback((update: GroupRealtimeUpdate) => {
    setGroups(prevGroups => {
      const updatedGroups = [...prevGroups];
      const groupIndex = updatedGroups.findIndex(g => g.id === update.groupId);
      
      if (groupIndex !== -1) {
        const group = { ...updatedGroups[groupIndex] };
        
        switch (update.type) {
          case 'health_check':
            group.healthStatus = (update.data.healthStatus as "healthy" | "unhealthy" | "warning" | "unknown") || 'unknown';
            group.healthyApiKeyCount = (update.data.healthyKeysCount as number) || 0;
            group.lastHealthCheckAt = update.timestamp;
            break;
            
          case 'statistics':
            group.statistics = { 
              totalRequests: (update.data.totalRequests as number) || 0,
              successfulRequests: (update.data.successfulRequests as number) || 0,
              failedRequests: (update.data.failedRequests as number) || 0,
              totalCost: (update.data.totalCost as number) || 0,
              averageResponseTime: (update.data.averageResponseTime as number) || 0,
              currentConcurrentConnections: (update.data.currentConcurrentConnections as number) || 0,
              lastUsedAt: (update.data.lastUsedAt as string) || new Date().toISOString(),
              ...group.statistics
            } as GroupStatistics;
            break;
            
          case 'status_change':
            group.isEnabled = (update.data.isEnabled as boolean) || false;
            break;
            
          case 'mapping_change':
            group.apiKeyCount = (update.data.apiKeyCount as number) || 0;
            group.healthyApiKeyCount = (update.data.healthyApiKeyCount as number) || 0;
            break;
        }
        
        updatedGroups[groupIndex] = group;
      }
      
      return updatedGroups;
    });
    
    setLastUpdate(new Date());
  }, []);

  // 手动刷新
  const refresh = useCallback(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // 手动健康检查
  const triggerHealthCheck = useCallback(async (targetGroupId?: string) => {
    const result = await checkGroupHealth(targetGroupId);
    if (result) {
      handleRealtimeUpdate({
        type: 'health_check',
        groupId: result.groupId,
        data: {
          healthStatus: result.isHealthy ? 'healthy' : 'unhealthy',
          healthyKeysCount: result.healthyKeysCount,
          totalKeysCount: result.totalKeysCount
        },
        timestamp: new Date().toISOString()
      });
    }
    return result;
  }, [checkGroupHealth, handleRealtimeUpdate]);

  // 启动实时更新
  useEffect(() => {
    // 初始数据加载
    fetchGroupData();
    
    // 尝试建立WebSocket连接
    connectWebSocket();
    
    // 设置轮询作为后备方案
    intervalRef.current = setInterval(() => {
      if (!isConnected) {
        fetchGroupData();
      }
    }, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchGroupData, connectWebSocket, isConnected]);

  // 定期健康检查
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      if (groupId) {
        triggerHealthCheck(groupId);
      } else {
        // 检查所有分组的健康状态
        groups.forEach(group => {
          triggerHealthCheck(group.id);
        });
      }
    }, HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [groupId, groups, triggerHealthCheck]);

  return {
    groups,
    isConnected,
    lastUpdate,
    refresh,
    triggerHealthCheck
  };
}

// 分组统计实时更新Hook
export function useGroupStatistics(groupId: string, refreshInterval = 60000) {
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    setError(null);

    try {
      // 这里应该调用实际的API
      // const stats = await apiService.getGroupStatistics(groupId);
      const mockStats: GroupStatistics = {
        totalRequests: Math.floor(Math.random() * 10000),
        successfulRequests: Math.floor(Math.random() * 8000),
        failedRequests: Math.floor(Math.random() * 2000),
        totalCost: Math.random() * 1000,
        averageResponseTime: Math.random() * 2000,
        currentConcurrentConnections: Math.floor(Math.random() * 50),
        lastUsedAt: new Date().toISOString()
      };
      
      setStatistics(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    // 立即获取一次数据
    fetchStatistics();

    // 设置定时刷新
    intervalRef.current = setInterval(fetchStatistics, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [groupId, refreshInterval, fetchStatistics]);

  const refresh = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh
  };
}

// 批量操作状态Hook
export function useBatchOperation<T = any>() {
  const [isOperating, setIsOperating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  const executeBatchOperation = useCallback(async (
    items: string[],
    operation: (item: string, index: number) => Promise<T>,
    onProgress?: (current: number, total: number) => void
  ) => {
    if (isOperating) return;

    setIsOperating(true);
    setProgress(0);
    setResults({ success: 0, failed: 0, errors: [] });

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < items.length; i++) {
      try {
        await operation(items[i], i);
        results.success++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`${items[i]}: ${errorMessage}`);
      }

      const currentProgress = Math.round(((i + 1) / items.length) * 100);
      setProgress(currentProgress);
      setResults({ ...results });
      
      onProgress?.(i + 1, items.length);

      // 添加小延迟以避免过快的请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsOperating(false);
    return results;
  }, [isOperating]);

  const reset = useCallback(() => {
    setIsOperating(false);
    setProgress(0);
    setResults({ success: 0, failed: 0, errors: [] });
  }, []);

  return {
    isOperating,
    progress,
    results,
    executeBatchOperation,
    reset
  };
}

// 自动保存Hook
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay = 2000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(data);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await saveFunction(data);
      setLastSaved(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [data, saveFunction]);

  useEffect(() => {
    // 检查数据是否发生变化
    if (JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    lastDataRef.current = data;

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, save]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  return {
    isSaving,
    lastSaved,
    error,
    forceSave
  };
}

// 防抖Hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 节流Hook
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// 网络状态Hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
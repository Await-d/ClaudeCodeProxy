import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Shield
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { GroupHealthCheck, GroupStatistics, ApiKeyGroupMapping } from '@/services/api';
import { showToast } from '@/utils/toast';

interface GroupHealthMonitorProps {
  groupId: string;
  groupName: string;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
}

interface HealthSummary {
  totalChecks: number;
  healthyCount: number;
  unhealthyCount: number;
  unknownCount: number;
  avgResponseTime: number;
  successRate: number;
}

export default function GroupHealthMonitor({ 
  groupId, 
  groupName, 
  autoRefresh = true, 
  refreshIntervalMs = 30000 
}: GroupHealthMonitorProps) {
  const [healthChecks, setHealthChecks] = useState<GroupHealthCheck[]>([]);
  const [mappings, setMappings] = useState<ApiKeyGroupMapping[]>([]);
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealthData = useCallback(async () => {
    try {
      const [checksData, mappingsData, statsData] = await Promise.all([
        apiService.performGroupHealthCheck(groupId),
        apiService.getApiKeyGroupMappings(groupId),
        apiService.getGroupStatistics(groupId)
      ]);

      setHealthChecks(checksData);
      setMappings(mappingsData);
      setStatistics(statsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      showToast('获取健康状态数据失败', 'error');
    }
  }, [groupId]);

  const refreshHealthData = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchHealthData();
      setLoading(false);
    };

    loadData();
  }, [fetchHealthData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthData, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalMs, fetchHealthData]);

  const getHealthSummary = (): HealthSummary => {
    const totalChecks = mappings.length;
    const healthyCount = mappings.filter(m => m.healthStatus === 'healthy').length;
    const unhealthyCount = mappings.filter(m => m.healthStatus === 'unhealthy').length;
    const unknownCount = mappings.filter(m => m.healthStatus === 'unknown').length;
    
    const avgResponseTime = mappings.reduce((sum, m) => sum + m.responseTime, 0) / (totalChecks || 1);
    const successRate = totalChecks > 0 ? (healthyCount / totalChecks) * 100 : 0;

    return {
      totalChecks,
      healthyCount,
      unhealthyCount,
      unknownCount,
      avgResponseTime,
      successRate
    };
  };

  const getHealthStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bgColor: 'bg-green-100 dark:bg-green-900',
          label: '健康',
          variant: 'default' as const
        };
      case 'failed':
      case 'unhealthy':
        return { 
          icon: XCircle, 
          color: 'text-red-600', 
          bgColor: 'bg-red-100 dark:bg-red-900',
          label: '异常',
          variant: 'destructive' as const
        };
      case 'timeout':
        return { 
          icon: Clock, 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-100 dark:bg-orange-900',
          label: '超时',
          variant: 'secondary' as const
        };
      default:
        return { 
          icon: AlertTriangle, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          label: '未知',
          variant: 'outline' as const
        };
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getResponseTimeTrend = (responseTime: number) => {
    const avgTime = getHealthSummary().avgResponseTime;
    if (responseTime < avgTime * 0.8) {
      return { icon: TrendingDown, color: 'text-green-600', label: '优秀' };
    } else if (responseTime > avgTime * 1.2) {
      return { icon: TrendingUp, color: 'text-red-600', label: '较慢' };
    } else {
      return { icon: Minus, color: 'text-yellow-600', label: '正常' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-border"></div>
      </div>
    );
  }

  const healthSummary = getHealthSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5" />
            健康状态监控
          </h2>
          <p className="text-sm text-muted-foreground">分组 "{groupName}" 的实时健康状态</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              最后更新: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshHealthData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 健康状态总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{healthSummary.healthyCount}</p>
                <p className="text-xs text-muted-foreground">健康</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{healthSummary.unhealthyCount}</p>
                <p className="text-xs text-muted-foreground">异常</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{healthSummary.successRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">成功率</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{Math.round(healthSummary.avgResponseTime)}</p>
                <p className="text-xs text-muted-foreground">平均响应(ms)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细的API Key健康状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            API Key 详细状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mappings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-8 h-8 mx-auto mb-2" />
                <p>分组中没有API Key</p>
              </div>
            ) : (
              mappings.map(mapping => {
                const healthConfig = getHealthStatusConfig(mapping.healthStatus);
                const HealthIcon = healthConfig.icon;
                const responseTrend = getResponseTimeTrend(mapping.responseTime);
                const TrendIcon = responseTrend.icon;
                
                return (
                  <Card key={mapping.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${healthConfig.bgColor} rounded-full flex items-center justify-center`}>
                          <HealthIcon className={`w-5 h-5 ${healthConfig.color}`} />
                        </div>
                        <div>
                          <div className="font-medium">API Key {mapping.apiKeyId.slice(-8)}</div>
                          <div className="text-sm text-muted-foreground">
                            权重: {mapping.weight}% | 优先级: {mapping.priority}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <TrendIcon className={`w-4 h-4 ${responseTrend.color}`} />
                            <span className="text-sm font-medium">{mapping.responseTime}ms</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{responseTrend.label}</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {((mapping.errorRate ?? 0) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">错误率</div>
                        </div>
                        
                        <Badge variant={healthConfig.variant}>
                          {healthConfig.label}
                        </Badge>
                      </div>
                    </div>
                    
                    {mapping.lastHealthCheck && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        最后检查: {new Date(mapping.lastHealthCheck).toLocaleString()}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 最近的健康检查记录 */}
      {healthChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              最近的健康检查记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {healthChecks.slice(0, 20).map(check => {
                const statusConfig = getHealthStatusConfig(check.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div key={check.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                      <div>
                        <span className="text-sm font-medium">
                          API Key {check.apiKeyId.slice(-8)}
                        </span>
                        {check.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">
                            {check.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(check.responseTimeMs)}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(check.checkedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计概览 */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              分组统计概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{statistics.totalRequests}</div>
                <div className="text-xs text-muted-foreground">总请求数</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{statistics.successfulRequests}</div>
                <div className="text-xs text-muted-foreground">成功请求</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">${statistics.totalCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">总费用</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{statistics.peakRPM}</div>
                <div className="text-xs text-muted-foreground">峰值 RPM</div>
              </div>
            </div>
            
            <div className="mt-4 text-center text-xs text-muted-foreground">
              数据更新时间: {new Date(statistics.lastUpdated).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 监控说明 */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">💡 健康监控说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong>健康状态：</strong>
              <ul className="mt-1 space-y-1">
                <li>• <span className="text-green-600">健康</span>：API Key正常工作</li>
                <li>• <span className="text-red-600">异常</span>：API Key请求失败</li>
                <li>• <span className="text-orange-600">超时</span>：请求响应超时</li>
                <li>• <span className="text-yellow-600">未知</span>：尚未进行健康检查</li>
              </ul>
            </div>
            <div>
              <strong>性能指标：</strong>
              <ul className="mt-1 space-y-1">
                <li>• <strong>响应时间</strong>：API请求的平均响应时间</li>
                <li>• <strong>错误率</strong>：失败请求占总请求的比例</li>
                <li>• <strong>成功率</strong>：健康API Key占总数的比例</li>
                <li>• 自动刷新间隔：{refreshIntervalMs / 1000}秒</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers() {
    // 监控渲染性能
    if ('PerformanceObserver' in window) {
      const renderObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.recordMetric('render', entry.duration);
          }
        });
      });

      try {
        renderObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('render', renderObserver);
      } catch (error) {
        console.warn('Performance measurement not supported:', error);
      }
    }
  }

  public recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const metrics = this.metrics.get(name)!;
    metrics.push(value);
    
    // 保持最近的100个记录
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  public getMetricStats(name: string) {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      min: sorted[0],
      max: sorted[len - 1],
      avg: sorted.reduce((sum, val) => sum + val, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      count: len
    };
  }

  public measureRender<T>(name: string, fn: () => T): T {
    performance.mark(`${name}-start`);
    const result = fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }

  public clearMetrics() {
    this.metrics.clear();
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// 内存泄漏防护Hook
export function useMemoryLeakPrevention() {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  useEffect(() => {
    return () => {
      // 组件卸载时执行所有清理函数
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  return addCleanup;
}

// 安全的事件监听器Hook
export function useSafeEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
  target: EventTarget = window
) {
  const addCleanup = useMemoryLeakPrevention();

  useEffect(() => {
    const safeListener = (event: Event) => {
      try {
        listener.call(window, event as WindowEventMap[K]);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    };

    target.addEventListener(type, safeListener, options);
    
    const cleanup = () => {
      target.removeEventListener(type, safeListener, options);
    };
    
    addCleanup(cleanup);
    return cleanup;
  }, [type, listener, options, target, addCleanup]);
}

// 防抖Hook（防止内存泄漏版本）
export function useSafeDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addCleanup = useMemoryLeakPrevention();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  // 清理定时器
  addCleanup(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  });

  return debouncedCallback;
}

// 性能优化的状态管理
interface PerformanceState {
  renderTimes: Map<string, number>;
  memoryUsage: number;
  componentCounts: Map<string, number>;
}

const usePerformanceStore = create<PerformanceState>()(
  subscribeWithSelector(() => ({
    renderTimes: new Map(),
    memoryUsage: 0,
    componentCounts: new Map(),
  }))
);

// 组件性能监控Hook
export function useComponentPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const addCleanup = useMemoryLeakPrevention();

  const recordRenderStart = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const recordRenderEnd = useCallback(() => {
    if (renderStartTime.current > 0) {
      const duration = performance.now() - renderStartTime.current;
      usePerformanceStore.setState((state) => {
        const newRenderTimes = new Map(state.renderTimes);
        newRenderTimes.set(componentName, duration);
        return { renderTimes: newRenderTimes };
      });
      
      PerformanceMonitor.getInstance().recordMetric(`component:${componentName}`, duration);
    }
  }, [componentName]);

  // 记录组件挂载和卸载
  useEffect(() => {
    usePerformanceStore.setState((state) => {
      const newCounts = new Map(state.componentCounts);
      newCounts.set(componentName, (newCounts.get(componentName) || 0) + 1);
      return { componentCounts: newCounts };
    });

    addCleanup(() => {
      usePerformanceStore.setState((state) => {
        const newCounts = new Map(state.componentCounts);
        const currentCount = newCounts.get(componentName) || 0;
        if (currentCount <= 1) {
          newCounts.delete(componentName);
        } else {
          newCounts.set(componentName, currentCount - 1);
        }
        return { componentCounts: newCounts };
      });
    });
  }, [componentName, addCleanup]);

  return {
    recordRenderStart,
    recordRenderEnd,
  };
}

// 内存使用监控Hook
export function useMemoryMonitoring(interval = 10000) {
  const addCleanup = useMemoryLeakPrevention();

  useEffect(() => {
    if (!('memory' in performance)) {
      return;
    }

    const updateMemoryUsage = () => {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      
      usePerformanceStore.setState({ memoryUsage: usage });
      
      // 内存使用率过高时发出警告
      if (usage > 0.9) {
        console.warn('High memory usage detected:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          percentage: Math.round(usage * 100)
        });
      }
    };

    // 立即执行一次
    updateMemoryUsage();
    
    // 设置定时器
    const intervalId = setInterval(updateMemoryUsage, interval);
    
    addCleanup(() => {
      clearInterval(intervalId);
    });
  }, [interval, addCleanup]);
}

// 大列表虚拟化优化Hook
export function useVirtualization<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// 图片懒加载Hook
export function useLazyLoading(threshold = 0.1) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const addCleanup = useMemoryLeakPrevention();

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                setLoadedImages(prev => new Set(prev).add(src));
                observerRef.current?.unobserve(img);
              }
            }
          });
        },
        { threshold }
      );
    }

    addCleanup(() => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    });
  }, [threshold, addCleanup]);

  const observeImage = useCallback((element: HTMLImageElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return {
    observeImage,
    loadedImages,
  };
}

// 数据缓存Hook
interface CacheOptions {
  ttl?: number; // 生存时间（毫秒）
  maxSize?: number; // 最大缓存条目数
}

export function useDataCache<K, V>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const cacheRef = useRef<Map<K, { value: V; timestamp: number }>>(new Map());
  const addCleanup = useMemoryLeakPrevention();

  const get = useCallback((key: K): V | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.value;
  }, [ttl]);

  const set = useCallback((key: K, value: V) => {
    const cache = cacheRef.current;
    
    // 检查缓存大小限制
    if (cache.size >= maxSize && !cache.has(key)) {
      // 删除最旧的条目
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { value, timestamp: Date.now() });
  }, [maxSize]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const cleanup = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
  }, [ttl]);

  // 定期清理过期缓存
  useEffect(() => {
    const intervalId = setInterval(cleanup, ttl);
    addCleanup(() => clearInterval(intervalId));
    
    return () => clearInterval(intervalId);
  }, [cleanup, ttl, addCleanup]);

  // 组件卸载时清理缓存
  addCleanup(clear);

  return {
    get,
    set,
    clear,
    cleanup,
  };
}

// 批量DOM更新Hook
export function useBatchedUpdates() {
  const updatesRef = useRef<(() => void)[]>([]);
  const frameRef = useRef<number | null>(null);
  const addCleanup = useMemoryLeakPrevention();

  const schedule = useCallback((update: () => void) => {
    updatesRef.current.push(update);

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        const updates = updatesRef.current.splice(0);
        updates.forEach(update => {
          try {
            update();
          } catch (error) {
            console.error('Error in batched update:', error);
          }
        });
        frameRef.current = null;
      });
    }
  }, []);

  addCleanup(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    updatesRef.current = [];
  });

  return schedule;
}

// 初始化性能监控
export function initializePerformanceMonitoring() {
  // 初始化性能监控器
  const monitor = PerformanceMonitor.getInstance();

  // 监控页面性能
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // 记录首次内容绘制时间
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        monitor.recordMetric(`paint:${entry.name}`, entry.startTime);
      });
    });
  }

  // 监控导航性能
  window.addEventListener('load', () => {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0] as PerformanceNavigationTiming;
      monitor.recordMetric('navigation:domContentLoaded', nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart);
      monitor.recordMetric('navigation:load', nav.loadEventEnd - nav.loadEventStart);
    }
  });

  return monitor;
}

// 导出性能报告
export function generatePerformanceReport(): {
  renderTimes: Record<string, number>;
  memoryUsage: number;
  componentCounts: Record<string, number>;
  metrics: Record<string, unknown>;
  timestamp: string;
} {
  const state = usePerformanceStore.getState();

  return {
    renderTimes: Object.fromEntries(state.renderTimes),
    memoryUsage: state.memoryUsage,
    componentCounts: Object.fromEntries(state.componentCounts),
    metrics: {
      // 可以添加更多性能指标
    },
    timestamp: new Date().toISOString(),
  };
}

// React.memo 的智能包装器
export function smartMemo<P extends object>(
  Component: React.ComponentType<P>,
  compare?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, compare);
  
  // 在开发环境中添加性能监控
  if (process.env.NODE_ENV === 'development') {
    const ComponentWithMonitoring = (props: P) => {
      const { recordRenderStart, recordRenderEnd } = useComponentPerformance(Component.displayName || Component.name || 'Unknown');
      
      recordRenderStart();
      const result = React.createElement(MemoizedComponent, props);
      recordRenderEnd();
      
      return result;
    };
    
    ComponentWithMonitoring.displayName = `SmartMemo(${Component.displayName || Component.name})`;
    return ComponentWithMonitoring as React.ComponentType<P>;
  }
  
  return MemoizedComponent;
}


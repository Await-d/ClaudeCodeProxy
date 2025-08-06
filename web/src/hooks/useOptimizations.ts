import { useEffect } from 'react';
import React from 'react';
import { ErrorBoundary, initializeErrorHandling } from '@/components/errors/ErrorBoundary';
import { 
  initializePerformanceMonitoring,
  useMemoryLeakPrevention,
  useMemoryMonitoring,
  smartMemo
} from '@/utils/performance';

// 性能和错误监控的整合Hook
export function useApplicationMonitoring() {
  const addCleanup = useMemoryLeakPrevention();

  useEffect(() => {
    // 初始化错误处理
    const errorHandler = initializeErrorHandling();
    
    // 初始化性能监控
    const performanceMonitor = initializePerformanceMonitoring();
    
    // 添加清理函数
    addCleanup(() => {
      performanceMonitor.destroy();
    });

    // 监控内存使用
    useMemoryMonitoring();
    
    return () => {
      // 组件卸载时的清理将由useMemoryLeakPrevention处理
    };
  }, [addCleanup]);
}

// 高阶组件：为组件添加错误边界和性能监控
export function withPerformanceAndErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    errorFallback?: React.ReactNode;
    enablePerformanceMonitoring?: boolean;
  } = {}
): React.ComponentType<P> {
  const { errorFallback, enablePerformanceMonitoring = true } = options;
  
  // 应用性能优化
  const OptimizedComponent = enablePerformanceMonitoring 
    ? smartMemo(Component)
    : Component;

  const WrappedComponent = React.forwardRef<any, P>((props: P, ref) => {
    return React.createElement(ErrorBoundary, 
      { fallback: errorFallback },
      React.createElement(OptimizedComponent, { ...props, ref })
    );
  }) as React.ComponentType<P>;

  WrappedComponent.displayName = `WithPerformanceAndErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// 导出所有优化工具
export * from '@/components/errors/ErrorBoundary';
export * from '@/utils/performance';
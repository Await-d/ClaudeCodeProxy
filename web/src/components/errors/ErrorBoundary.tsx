import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home,
  Clipboard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

// 错误边界类组件
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理回调
    this.props.onError?.(error, errorInfo);

    // 在生产环境中，可以将错误发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // 发送错误报告到监控服务
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      }).catch(reportingError => {
        console.error('Failed to report error:', reportingError);
      });
    } catch (reportingError) {
      console.error('Error in error reporting:', reportingError);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private copyErrorToClipboard = async () => {
    if (!this.state.error) return;

    const errorText = `
Error: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      // 可以显示复制成功的提示
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err);
    }
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义错误UI，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <span>出现了错误</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                很抱歉，应用程序遇到了一个意外错误。我们已经记录了这个问题，请尝试刷新页面或返回首页。
              </p>

              {this.state.error && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Bug className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">错误详情</span>
                        <Badge variant="destructive" className="text-xs">
                          {this.state.error.name}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={this.toggleDetails}
                        className="text-red-600"
                      >
                        {this.state.showDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-sm text-red-700 mb-2">
                      {this.state.error.message}
                    </p>

                    {this.state.showDetails && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-medium text-red-800 mb-1">错误堆栈:</h4>
                          <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                        
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <h4 className="text-xs font-medium text-red-800 mb-1">组件堆栈:</h4>
                            <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={this.copyErrorToClipboard}
                          className="text-red-600 border-red-300"
                        >
                          <Clipboard className="h-4 w-4 mr-2" />
                          复制错误信息
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新页面
                </Button>
                <Button variant="outline" onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 异步错误处理Hook
import { useState } from 'react';

interface AsyncError {
  error: Error;
  timestamp: Date;
  source: string;
}

export function useAsyncErrorHandler() {
  const [errors, setErrors] = useState<AsyncError[]>([]);

  const reportAsyncError = (error: Error, source = 'unknown') => {
    console.error('Async error:', error);
    
    const asyncError: AsyncError = {
      error,
      timestamp: new Date(),
      source,
    };

    setErrors(prev => [...prev.slice(-9), asyncError]); // 保留最近的10个错误

    // 在生产环境中报告错误
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          source,
          timestamp: asyncError.timestamp.toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(reportingError => {
        console.error('Failed to report async error:', reportingError);
      });
    }
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    reportAsyncError,
    clearErrors,
  };
}

// Promise错误处理工具
export class PromiseErrorHandler {
  private static instance: PromiseErrorHandler;
  private errorCallbacks: ((error: Error) => void)[] = [];

  private constructor() {
    // 监听未捕获的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));

      this.notifyCallbacks(error);
      
      // 防止默认的错误处理
      event.preventDefault();
    });
  }

  public static getInstance(): PromiseErrorHandler {
    if (!PromiseErrorHandler.instance) {
      PromiseErrorHandler.instance = new PromiseErrorHandler();
    }
    return PromiseErrorHandler.instance;
  }

  public addErrorCallback(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // 返回清理函数
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  private notifyCallbacks(error: Error) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }
}

// API错误处理装饰器
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    onError?: (error: Error) => void;
    retries?: number;
    retryDelay?: number;
    fallbackValue?: any;
  } = {}
): T {
  const { onError, retries = 0, retryDelay = 1000, fallbackValue } = options;

  return (async (...args: any[]) => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retries) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // 所有重试都失败了
        console.error(`Function failed after ${retries + 1} attempts:`, lastError);
        onError?.(lastError);
        
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        
        throw lastError;
      }
    }
  }) as T;
}

// 网络错误重试Hook
export function useRetryableRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    retryCondition?: (error: Error) => boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = (error) => {
      // 默认重试网络错误和5xx错误
      return error.name === 'NetworkError' ||
             error.message.includes('fetch') ||
             error.message.includes('5');
    }
  } = options;

  const execute = async (forceRetry = false) => {
    setLoading(true);
    setError(null);
    
    if (forceRetry) {
      setRetryCount(0);
    }

    let currentRetry = forceRetry ? 0 : retryCount;
    let lastError: Error;

    while (currentRetry <= maxRetries) {
      try {
        const result = await requestFn();
        setData(result);
        setRetryCount(0);
        setLoading(false);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        
        if (currentRetry < maxRetries && retryCondition(lastError)) {
          currentRetry++;
          setRetryCount(currentRetry);
          await new Promise(resolve => setTimeout(resolve, retryDelay * currentRetry));
          continue;
        }
        
        break;
      }
    }

    setError(lastError!);
    setLoading(false);
    throw lastError!;
  };

  const retry = () => execute(true);

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    retry,
  };
}

// 错误恢复组件
interface ErrorRecoveryProps {
  error: Error;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
}

export function ErrorRecovery({ error, onRetry, onReset, className = '' }: ErrorRecoveryProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium mb-2">操作失败</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
        {error.message}
      </p>
      <div className="flex space-x-2">
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        )}
        {onReset && (
          <Button variant="outline" onClick={onReset} size="sm">
            重置
          </Button>
        )}
      </div>
    </div>
  );
}

// 初始化全局错误处理
export function initializeErrorHandling() {
  // 初始化Promise错误处理器
  const errorHandler = PromiseErrorHandler.getInstance();
  
  // 监听全局错误
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  return errorHandler;
}
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Users,
  Shield,
  ChevronRight
} from 'lucide-react';
import type { PermissionOverview } from '@/types/permissions';

interface ApiKeyPermissionOverviewProps {
  data: PermissionOverview[];
  isLoading: boolean;
  onApiKeySelect: (apiKeyId: string) => void;
  onRefresh: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

/**
 * API Key 权限概览组件
 * 
 * 功能特性:
 * - 展示每个API Key的权限配置概览
 * - 权限使用统计和成本分析
 * - 平台和账号池分布可视化
 * - 权限健康状态监控
 * - 快速权限配置入口
 */
export const ApiKeyPermissionOverview: React.FC<ApiKeyPermissionOverviewProps> = ({
  data,
  isLoading,
  onApiKeySelect,
  onRefresh,
  getStatusBadge
}) => {

  // 计算总体统计
  const overallStats = useMemo(() => {
    return data.reduce((acc, item) => ({
      totalRequests: acc.totalRequests + item.usage.requestCount,
      totalCost: acc.totalCost + item.usage.totalCost,
      avgSuccessRate: acc.avgSuccessRate + item.usage.successRate,
      avgResponseTime: acc.avgResponseTime + item.usage.averageResponseTime
    }), {
      totalRequests: 0,
      totalCost: 0,
      avgSuccessRate: 0,
      avgResponseTime: 0
    });
  }, [data]);

  const avgSuccessRate = data.length > 0 ? overallStats.avgSuccessRate / data.length : 0;
  const avgResponseTime = data.length > 0 ? overallStats.avgResponseTime / data.length : 0;

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无权限配置</h3>
            <p className="text-muted-foreground mb-4">
              还没有为任何API Key配置权限规则
            </p>
            <Button onClick={onRefresh}>
              刷新数据
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总体统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总请求量</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overallStats.totalRequests)}</div>
            <p className="text-xs text-muted-foreground">
              所有API Key的请求总和
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成本</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              权限范围内的消费总额
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均成功率</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
            <Progress value={avgSuccessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">
              平均API响应时间
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Key 详细列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card 
            key={item.apiKeyId} 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => onApiKeySelect(item.apiKeyId)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base truncate">{item.apiKeyName}</CardTitle>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {item.enabledRules}/{item.totalRules} 规则
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {item.accessiblePools} 池
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* 使用统计 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">请求量</p>
                  <p className="text-sm font-medium">{formatNumber(item.usage.requestCount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">成功率</p>
                  <p className="text-sm font-medium">{item.usage.successRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">总成本</p>
                  <p className="text-sm font-medium">{formatCurrency(item.usage.totalCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">响应时间</p>
                  <p className="text-sm font-medium">{Math.round(item.usage.averageResponseTime)}ms</p>
                </div>
              </div>

              {/* 平台分布 */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">平台分布</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(item.platformDistribution).map(([platform, count]) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 账号池分布 */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">账号池分布</p>
                <div className="space-y-1">
                  {Object.entries(item.poolDistribution).slice(0, 2).map(([pool, count]) => (
                    <div key={pool} className="flex justify-between text-xs">
                      <span className="truncate">{pool}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(item.poolDistribution).length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{Object.keys(item.poolDistribution).length - 2} 更多...
                    </p>
                  )}
                </div>
              </div>

              {/* 最后使用时间 */}
              {item.lastUsedAt && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>最后使用</span>
                  <span>{new Date(item.lastUsedAt).toLocaleString('zh-CN')}</span>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 可以添加查看详情的逻辑
                  }}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  查看详情
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApiKeySelect(item.apiKeyId);
                  }}
                >
                  配置权限
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
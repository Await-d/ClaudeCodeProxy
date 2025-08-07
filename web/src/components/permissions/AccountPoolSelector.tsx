import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Server, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import type { AccountPool } from '@/types/permissions';

interface AccountPoolSelectorProps {
  pools: AccountPool[];
  isLoading: boolean;
  onRefresh: () => void;
  onPoolSelect?: (pool: AccountPool) => void;
  selectedPools?: string[];
}

/**
 * 账号池选择器组件
 * 
 * 功能特性:
 * - 账号池列表展示
 * - 池状态和健康度监控
 * - 使用统计和性能指标
 * - 平台分类和筛选
 * - 快速搜索和排序
 * - 池详情查看和配置
 */
export const AccountPoolSelector: React.FC<AccountPoolSelectorProps> = ({
  pools,
  isLoading,
  onRefresh,
  onPoolSelect,
  selectedPools = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'accounts' | 'health' | 'usage'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 获取所有平台
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(pools.map(pool => pool.platform));
    return Array.from(platforms);
  }, [pools]);

  // 过滤和排序
  const filteredAndSortedPools = useMemo(() => {
    const filtered = pools.filter(pool => {
      const matchesSearch = !searchTerm || 
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pool.description && pool.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPlatform = filterPlatform === 'all' || pool.platform === filterPlatform;
      
      return matchesSearch && matchesPlatform;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'accounts':
          comparison = a.totalAccounts - b.totalAccounts;
          break;
        case 'health':
          comparison = (a.healthyAccounts / a.totalAccounts) - (b.healthyAccounts / b.totalAccounts);
          break;
        case 'usage':
          comparison = (a.usage?.requestCount || 0) - (b.usage?.requestCount || 0);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [pools, searchTerm, filterPlatform, sortBy, sortOrder]);

  // 获取池的健康状态
  const getPoolHealthStatus = (pool: AccountPool) => {
    const healthRatio = pool.healthyAccounts / pool.totalAccounts;
    if (healthRatio >= 0.9) return { status: 'healthy', color: 'text-green-600', icon: CheckCircle2 };
    if (healthRatio >= 0.7) return { status: 'warning', color: 'text-yellow-600', icon: AlertCircle };
    return { status: 'unhealthy', color: 'text-red-600', icon: AlertCircle };
  };

  // 获取平台徽章颜色
  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      claude: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'claude-console': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      gemini: 'bg-green-100 text-green-800 hover:bg-green-200',
      openai: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      all: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };
    return colors[platform] || colors.all;
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  // 处理排序
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">账号池管理</h2>
          <p className="text-sm text-muted-foreground">
            管理和配置API访问的账号池
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 搜索和筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索账号池名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 平台筛选 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterPlatform === 'all' ? '所有平台' : filterPlatform}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>筛选平台</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterPlatform('all')}>
                  所有平台
                </DropdownMenuItem>
                {availablePlatforms.map((platform) => (
                  <DropdownMenuItem 
                    key={platform} 
                    onClick={() => setFilterPlatform(platform)}
                  >
                    {platform}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 排序选项 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  排序
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>排序方式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  按名称 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('accounts')}>
                  按账户数 {sortBy === 'accounts' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('health')}>
                  按健康度 {sortBy === 'health' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('usage')}>
                  按使用量 {sortBy === 'usage' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* 池列表 */}
      {filteredAndSortedPools.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">没有找到账号池</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterPlatform !== 'all' 
                  ? '请调整搜索条件或筛选器'
                  : '还没有配置任何账号池'
                }
              </p>
              {(searchTerm || filterPlatform !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPlatform('all');
                  }}
                >
                  清除筛选
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedPools.map((pool) => {
            const healthStatus = getPoolHealthStatus(pool);
            const HealthIcon = healthStatus.icon;
            const healthRatio = (pool.healthyAccounts / pool.totalAccounts) * 100;
            const activeRatio = (pool.activeAccounts / pool.totalAccounts) * 100;
            const isSelected = selectedPools.includes(pool.id);

            return (
              <Card 
                key={pool.id} 
                className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onPoolSelect?.(pool)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate flex items-center gap-2">
                        <Server className="h-4 w-4 flex-shrink-0" />
                        {pool.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {pool.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge 
                        variant="secondary" 
                        className={getPlatformBadgeColor(pool.platform)}
                      >
                        {pool.platform}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            配置
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* 账户统计 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {pool.totalAccounts}
                      </div>
                      <div className="text-xs text-muted-foreground">总账户</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {pool.activeAccounts}
                      </div>
                      <div className="text-xs text-muted-foreground">活跃账户</div>
                    </div>
                  </div>

                  {/* 健康状态 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <HealthIcon className={`h-3 w-3 ${healthStatus.color}`} />
                        健康状态
                      </span>
                      <span className={`font-medium ${healthStatus.color}`}>
                        {pool.healthyAccounts}/{pool.totalAccounts}
                      </span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Progress value={healthRatio} className="h-2" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>健康度: {healthRatio.toFixed(1)}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* 活跃状态 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-blue-600" />
                        活跃状态
                      </span>
                      <span className="font-medium text-blue-600">
                        {activeRatio.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={activeRatio} className="h-2" />
                  </div>

                  {/* 使用统计 */}
                  {pool.usage && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span>请求: {formatNumber(pool.usage.requestCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-blue-600" />
                          <span>成功率: {pool.usage.successRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-600" />
                          <span>响应: {pool.usage.averageResponseTime}ms</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-600" />
                          <span>
                            {pool.usage.lastUsedAt 
                              ? new Date(pool.usage.lastUsedAt).toLocaleDateString('zh-CN')
                              : '未使用'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 标签 */}
                  {pool.tags && pool.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t">
                      {pool.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {pool.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{pool.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 总计信息 */}
      {filteredAndSortedPools.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredAndSortedPools.length}
                </div>
                <div className="text-sm text-muted-foreground">账号池</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredAndSortedPools.reduce((sum, pool) => sum + pool.totalAccounts, 0)}
                </div>
                <div className="text-sm text-muted-foreground">总账户数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredAndSortedPools.reduce((sum, pool) => sum + pool.activeAccounts, 0)}
                </div>
                <div className="text-sm text-muted-foreground">活跃账户</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredAndSortedPools.reduce((sum, pool) => sum + pool.healthyAccounts, 0)}
                </div>
                <div className="text-sm text-muted-foreground">健康账户</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
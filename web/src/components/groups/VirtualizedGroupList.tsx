import { memo, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Activity, 
  Users, 
  DollarSign,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import type { ApiKeyGroup } from '@/types/apiKeyGroups';

interface VirtualizedGroupListProps {
  groups: ApiKeyGroup[];
  onGroupClick?: (group: ApiKeyGroup) => void;
  onGroupSettings?: (group: ApiKeyGroup) => void;
  loading?: boolean;
  height?: number;
  itemHeight?: number;
  className?: string;
  searchTerm?: string;
}

// 分组项组件（使用memo优化渲染）
const GroupItem = memo(({ 
  group, 
  onGroupClick, 
  onGroupSettings 
}: {
  group: ApiKeyGroup;
  onGroupClick?: (group: ApiKeyGroup) => void;
  onGroupSettings?: (group: ApiKeyGroup) => void;
}) => {
  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'unhealthy':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLoadBalanceStrategyText = (strategy: string) => {
    const strategies: { [key: string]: string } = {
      'round_robin': '轮询',
      'weighted': '加权',
      'least_connections': '最少连接',
      'random': '随机'
    };
    return strategies[strategy] || strategy;
  };

  const getGroupTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      'system': '系统',
      'custom': '自定义',
      'template': '模板'
    };
    return types[type] || type;
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        !group.isEnabled ? 'opacity-60' : ''
      }`}
      onClick={() => onGroupClick?.(group)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 分组状态指示器 */}
            <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(group.healthStatus)}`} />
            
            {/* 分组名称和基本信息 */}
            <div>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>{group.name}</span>
                {!group.isEnabled && (
                  <Badge variant="secondary" className="text-xs">已禁用</Badge>
                )}
              </CardTitle>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {getHealthStatusIcon(group.healthStatus)}
              <span className="text-xs text-muted-foreground">
                {group.healthyApiKeyCount}/{group.apiKeyCount}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onGroupSettings?.(group);
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* 分组基本信息 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground">类型:</span>
              <Badge variant="outline" className="text-xs">
                {getGroupTypeText(group.groupType)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground">优先级:</span>
              <Badge variant={group.priority >= 80 ? 'default' : 'secondary'} className="text-xs">
                {group.priority}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground">策略:</span>
              <Badge variant="outline" className="text-xs">
                {getLoadBalanceStrategyText(group.loadBalanceStrategy)}
              </Badge>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 bg-muted p-3 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">请求数</span>
              </div>
              <p className="text-sm font-semibold">
                {group.statistics?.totalRequests?.toLocaleString() || '0'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">API Keys</span>
              </div>
              <p className="text-sm font-semibold">
                {group.healthyApiKeyCount}/{group.apiKeyCount}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">费用</span>
              </div>
              <p className="text-sm font-semibold">
                ${(group.statistics?.totalCost || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* 标签 */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {group.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 时间信息 */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {group.lastUsedAt && (
              <span>最后使用: {new Date(group.lastUsedAt).toLocaleString()}</span>
            )}
            <span>创建时间: {new Date(group.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GroupItem.displayName = 'GroupItem';

// 骨架屏组件
const SkeletonGroupItem = memo(() => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 bg-muted p-3 rounded-lg">
          <div className="text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-2" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-2" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-12 mx-auto mb-2" />
            <Skeleton className="h-5 w-8 mx-auto" />
          </div>
        </div>
        
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
));

SkeletonGroupItem.displayName = 'SkeletonGroupItem';

// 高亮搜索结果的组件
const HighlightedText = ({ text, searchTerm }: { text: string; searchTerm?: string }) => {
  if (!searchTerm || !text) return <>{text}</>;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// 主虚拟化列表组件
export default function VirtualizedGroupList({
  groups,
  onGroupClick,
  onGroupSettings,
  loading = false,
  height = 600,
  itemHeight = 280,
  className = '',
  searchTerm
}: VirtualizedGroupListProps) {
  const parentRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

  // 过滤分组（如果有搜索词）
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;

    return groups.filter(group =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [groups, searchTerm]);

  const virtualizer = useVirtualizer({
    count: loading ? 10 : filteredGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 3, // 预渲染额外的项目数量
  });

  // 如果正在加载，显示骨架屏
  if (loading) {
    return (
      <div className={`${className} overflow-hidden`} style={{ height }}>
        <div
          ref={parentRef}
          className="overflow-auto w-full h-full"
          style={{ contain: 'strict' }}
        >
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="p-2">
                  <SkeletonGroupItem />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 如果没有分组数据
  if (filteredGroups.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          {searchTerm ? (
            <>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">未找到匹配的分组</h3>
              <p className="text-muted-foreground">
                搜索词 "{searchTerm}" 没有匹配到任何分组
              </p>
            </>
          ) : (
            <>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无分组</h3>
              <p className="text-muted-foreground">
                还没有创建任何API Key分组
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-hidden`} style={{ height }}>
      <div
        ref={parentRef}
        className="overflow-auto w-full h-full"
        style={{ contain: 'strict' }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const group = filteredGroups[virtualRow.index];
            
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="p-2">
                  <GroupItem
                    group={group}
                    onGroupClick={onGroupClick}
                    onGroupSettings={onGroupSettings}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 导出高亮文本组件供其他地方使用
export { HighlightedText };
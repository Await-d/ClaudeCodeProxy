import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Settings, 
  Activity, 
  Users, 
  DollarSign,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import type { ApiKeyGroup } from '@/types/apiKeyGroups';

interface DraggableGroupListProps {
  groups: ApiKeyGroup[];
  onGroupsReorder: (groups: ApiKeyGroup[]) => void;
  onGroupClick?: (group: ApiKeyGroup) => void;
  onGroupSettings?: (group: ApiKeyGroup) => void;
  loading?: boolean;
  className?: string;
}

interface SortableGroupItemProps {
  group: ApiKeyGroup;
  onGroupClick?: (group: ApiKeyGroup) => void;
  onGroupSettings?: (group: ApiKeyGroup) => void;
}

// 可排序的分组项组件
function SortableGroupItem({ group, onGroupClick, onGroupSettings }: SortableGroupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      ref={setNodeRef}
      style={style}
      className={`
        cursor-pointer transition-all duration-200 
        ${isDragging ? 'opacity-50 scale-105 shadow-lg' : 'hover:shadow-md'} 
        ${!group.isEnabled ? 'opacity-60' : ''}
      `}
      onClick={() => onGroupClick?.(group)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 拖拽手柄 */}
            <button
              className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </button>
            
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
}

// 拖拽覆盖层组件
function GroupDragOverlay({ group }: { group: ApiKeyGroup }) {
  return (
    <Card className="opacity-90 shadow-lg scale-105">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <div className={`w-3 h-3 rounded-full bg-${group.healthStatus === 'healthy' ? 'green' : 'red'}-500`} />
          <CardTitle className="text-lg">{group.name}</CardTitle>
        </div>
      </CardHeader>
    </Card>
  );
}

// 主拖拽列表组件
export default function DraggableGroupList({
  groups,
  onGroupsReorder,
  onGroupClick,
  onGroupSettings,
  loading = false,
  className = ''
}: DraggableGroupListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<ApiKeyGroup | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const group = groups.find(g => g.id === active.id);
    setDraggedGroup(group || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex(group => group.id === active.id);
      const newIndex = groups.findIndex(group => group.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedGroups = arrayMove(groups, oldIndex, newIndex);
        // 更新优先级
        const updatedGroups = reorderedGroups.map((group, index) => ({
          ...group,
          priority: 100 - index * 10 // 按新顺序分配优先级
        }));
        onGroupsReorder(updatedGroups);
      }
    }

    setActiveId(null);
    setDraggedGroup(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedGroup(null);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-40"></div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">暂无分组</h3>
        <p className="text-muted-foreground">
          还没有创建任何API Key分组。创建第一个分组来开始管理您的API Keys。
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {groups.map((group) => (
              <SortableGroupItem
                key={group.id}
                group={group}
                onGroupClick={onGroupClick}
                onGroupSettings={onGroupSettings}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && draggedGroup ? (
            <GroupDragOverlay group={draggedGroup} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
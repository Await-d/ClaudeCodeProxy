import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import type { ApiKeyAccountPermission } from '@/types/permissions';

interface PermissionRulesListProps {
  permissions: ApiKeyAccountPermission[];
  selectedApiKeyId: string;
  isLoading: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (permission: ApiKeyAccountPermission) => void;
  onDelete: (permissionId: string) => void;
  onBatchOperation: (operation: string, payload?: any) => void;
  onRefresh: () => void;
}

/**
 * 权限规则列表组件
 * 
 * 功能特性:
 * - 权限规则的列表展示
 * - 规则启用/禁用切换
 * - 批量选择和操作
 * - 规则编辑和删除
 * - 权限状态监控
 * - 规则排序和筛选
 */
export const PermissionRulesList: React.FC<PermissionRulesListProps> = ({
  permissions,
  selectedApiKeyId,
  isLoading,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onBatchOperation,
  onRefresh
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPermissionId, setDeletingPermissionId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'platform' | 'createdAt'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');

  // 排序和过滤权限列表
  const sortedAndFilteredPermissions = useMemo(() => {
    let filtered = permissions;

    // 按启用状态过滤
    if (filterEnabled !== 'all') {
      filtered = filtered.filter(p => 
        filterEnabled === 'enabled' ? p.isEnabled : !p.isEnabled
      );
    }

    // 排序
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'platform':
          comparison = a.allowedPlatforms[0]?.localeCompare(b.allowedPlatforms[0] || '') || 0;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [permissions, sortBy, sortOrder, filterEnabled]);

  // 全选/取消全选
  const isAllSelected = selectedIds.length === sortedAndFilteredPermissions.length && sortedAndFilteredPermissions.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < sortedAndFilteredPermissions.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedAndFilteredPermissions.map(p => p.id));
    }
  };

  const handleSelectOne = (permissionId: string) => {
    if (selectedIds.includes(permissionId)) {
      onSelectionChange(selectedIds.filter(id => id !== permissionId));
    } else {
      onSelectionChange([...selectedIds, permissionId]);
    }
  };

  const handleDeleteClick = (permissionId: string) => {
    setDeletingPermissionId(permissionId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingPermissionId) {
      onDelete(deletingPermissionId);
    }
    setShowDeleteDialog(false);
    setDeletingPermissionId('');
  };

  const handleToggleSort = (field: 'priority' | 'platform' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      claude: 'bg-blue-100 text-blue-800',
      'claude-console': 'bg-indigo-100 text-indigo-800',
      gemini: 'bg-green-100 text-green-800',
      openai: 'bg-purple-100 text-purple-800',
      all: 'bg-gray-100 text-gray-800'
    };
    return colors[platform] || colors.all;
  };

  const getSelectionStrategyText = (strategy: string) => {
    const strategies: Record<string, string> = {
      priority: '优先级',
      round_robin: '轮询',
      random: '随机',
      performance: '性能优先'
    };
    return strategies[strategy] || strategy;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                权限规则
                {selectedApiKeyId && (
                  <Badge variant="secondary">
                    {sortedAndFilteredPermissions.length} 条规则
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                管理API Key的账号池访问权限和选择策略
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </div>

          {/* 批量操作和过滤 */}
          {sortedAndFilteredPermissions.length > 0 && (
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.length > 0 ? `已选择 ${selectedIds.length} 项` : '全选'}
                </span>
                
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBatchOperation('enable')}
                    >
                      批量启用
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBatchOperation('disable')}
                    >
                      批量禁用
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBatchOperation('delete')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      批量删除
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      筛选: {filterEnabled === 'all' ? '全部' : filterEnabled === 'enabled' ? '已启用' : '已禁用'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterEnabled('all')}>
                      全部规则
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterEnabled('enabled')}>
                      仅显示已启用
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterEnabled('disabled')}>
                      仅显示已禁用
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      排序
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleToggleSort('priority')}>
                      按优先级排序 {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleSort('platform')}>
                      按平台排序 {sortBy === 'platform' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleSort('createdAt')}>
                      按创建时间排序 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {!selectedApiKeyId ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">选择API Key</h3>
              <p className="text-muted-foreground">
                请先从权限概览中选择一个API Key来查看其权限规则
              </p>
            </div>
          ) : sortedAndFilteredPermissions.length === 0 ? (
            <div className="text-center py-12">
              <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无权限规则</h3>
              <p className="text-muted-foreground mb-4">
                此API Key还没有配置任何权限规则
              </p>
              <Button onClick={() => {}}>
                <Plus className="mr-2 h-4 w-4" />
                添加权限规则
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAndFilteredPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* 选择框 */}
                  <Checkbox
                    checked={selectedIds.includes(permission.id)}
                    onCheckedChange={() => handleSelectOne(permission.id)}
                  />

                  {/* 权限信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{permission.accountPoolGroup}</h4>
                      <Badge variant="outline" className="text-xs">
                        优先级: {permission.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getSelectionStrategyText(permission.selectionStrategy)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {/* 平台标签 */}
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>平台:</span>
                        <div className="flex gap-1">
                          {permission.allowedPlatforms.map((platform) => (
                            <Badge
                              key={platform}
                              variant="secondary"
                              className={`text-xs ${getPlatformBadgeColor(platform)}`}
                            >
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 账户限制 */}
                      {permission.allowedAccountIds && permission.allowedAccountIds.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>限制账户: {permission.allowedAccountIds.length}个</span>
                        </div>
                      )}

                      {/* 时间限制 */}
                      {(permission.effectiveFrom || permission.effectiveTo) && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>有时间限制</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 状态指示器 */}
                  <div className="flex items-center gap-2">
                    {permission.isEnabled ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">已启用</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">已禁用</span>
                      </div>
                    )}
                  </div>

                  {/* 启用开关 */}
                  <Switch
                    checked={permission.isEnabled}
                    onCheckedChange={() => {
                      // 这里可以添加切换逻辑
                    }}
                  />

                  {/* 操作菜单 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(permission)}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteClick(permission.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除权限规则</DialogTitle>
            <DialogDescription>
              此操作将永久删除该权限规则，删除后无法恢复。你确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button onClick={handleDeleteConfirm} variant="destructive">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
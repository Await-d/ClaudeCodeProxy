import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Plus, Edit2, Trash2, Play, Pause, Activity, Users, Clock, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { showToast } from '@/utils/toast';
import { useConfirm } from '@/hooks/useConfirm';
import { apiService } from '@/services/api';
import ConfirmModal from '@/components/common/ConfirmModal';
import ApiKeyGroupModal from '@/components/ApiKeyGroupModal';
import type { ApiKeyGroupResponse, ApiKeyGroup } from '@/services/api';

export default function ApiKeyGroupsPage() {
  const [groups, setGroups] = useState<ApiKeyGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ApiKeyGroup | null>(null);
  const { showConfirmModal, confirmOptions, showConfirm, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const groupsResponse = await apiService.getApiKeyGroups();
      const responseAsApiKeyGroupResponse: ApiKeyGroupResponse[] = (groupsResponse || []).map(group => ({
        ...group,
        // Ensure all required ApiKeyGroupResponse properties are present
        healthStatus: group.healthStatus || 'unknown',
        loadBalanceStrategy: typeof group.loadBalanceStrategy === 'string' ? group.loadBalanceStrategy : 'RoundRobin',
        failoverStrategy: typeof group.failoverStrategy === 'string' ? group.failoverStrategy : undefined,
        isEnabled: group.isEnabled ?? true,
        totalApiKeys: group.totalApiKeys ?? 0,
        activeApiKeys: group.activeApiKeys ?? 0,
        healthCheckInterval: group.healthCheckIntervalMs ? Math.round(group.healthCheckIntervalMs / 1000) : 60,
        createdAt: group.createdAt || new Date().toISOString(),
        updatedAt: group.updatedAt || new Date().toISOString()
      }));
      setGroups(responseAsApiKeyGroupResponse);
    } catch (error) {
      console.error('Failed to fetch API key groups:', error);
    } finally {
      setLoading(false);
    }
  };

  // 模态框处理函数
  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group: ApiKeyGroupResponse) => {
    setEditingGroup(group as ApiKeyGroup);
    setShowGroupModal(true);
  };

  const handleCloseModal = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const handleGroupSuccess = (group: ApiKeyGroup) => {
    if (editingGroup) {
      // 更新现有分组
      setGroups(prevGroups => prevGroups.map(g => g.id === group.id ? group as ApiKeyGroupResponse : g));
      showToast('分组更新成功', 'success');
    } else {
      // 添加新分组
      setGroups(prevGroups => [group as ApiKeyGroupResponse, ...prevGroups]);
      showToast('分组创建成功', 'success');
    }
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const group = groups.find(g => g.id === id);
    const groupName = group?.name || 'API Key分组';
    
    const confirmed = await showConfirm(
      '删除分组',
      `确定要删除分组 "${groupName}" 吗？\n\n此操作会将该分组中的所有API Key解除分组关系，但不会删除API Key本身。`,
      '删除',
      '取消'
    );
    
    if (confirmed) {
      setDeletingId(id);
      try {
        await apiService.deleteApiKeyGroup(id);
        setGroups(prevGroups => prevGroups.filter(g => g.id !== id));
        showToast('分组删除成功', 'success');
      } catch (error: any) {
        console.error('Failed to delete group:', error);
        showToast(error.message || '删除分组失败', 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const toggleGroupStatus = async (group: ApiKeyGroupResponse) => {
    try {
      await apiService.toggleApiKeyGroupEnabled(group.id);
      await fetchGroups();
      showToast(`分组已${!group.isEnabled ? '启用' : '禁用'}`, 'success');
    } catch (error: any) {
      showToast(error.message || '更新分组状态失败', 'error');
    }
  };

  // 过滤分组
  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'enabled' && group.isEnabled) ||
      (statusFilter === 'disabled' && !group.isEnabled);
    
    const matchesHealth = healthFilter === 'all' || group.healthStatus === healthFilter;
    
    return matchesSearch && matchesStatus && matchesHealth;
  });

  // 获取健康状态显示
  const getHealthStatusDisplay = (status: string) => {
    const statusConfig: Record<string, { text: string; color: string; icon: any }> = {
      'healthy': { text: '健康', color: 'bg-green-500', icon: CheckCircle },
      'warning': { text: '警告', color: 'bg-yellow-500', icon: AlertTriangle },
      'critical': { text: '异常', color: 'bg-red-500', icon: AlertTriangle },
      'unknown': { text: '未知', color: 'bg-gray-500', icon: Activity }
    };
    return statusConfig[status] || statusConfig['unknown'];
  };

  // 获取负载均衡策略显示名称
  const getLoadBalanceStrategyName = (strategy: string) => {
    const strategyNames: Record<string, string> = {
      'RoundRobin': '轮询',
      'Weighted': '加权',
      'LeastConnections': '最少连接',
      'Random': '随机',
      'Hash': '哈希',
      'FastestResponse': '最快响应'
    };
    return strategyNames[strategy] || strategy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-6 w-6" />
          <h1 className="text-2xl font-bold">API Key 分组管理</h1>
          <Badge variant="secondary">
            {filteredGroups.length} / {groups.length}
          </Badge>
        </div>
        <Button onClick={handleCreateGroup}>
          <Plus className="h-4 w-4 mr-2" />
          创建分组
        </Button>
      </div>

      {/* 搜索和过滤栏 */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索分组名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: 'all' | 'enabled' | 'disabled') => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="enabled">已启用</SelectItem>
              <SelectItem value="disabled">已禁用</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={(value: 'all' | string) => setHealthFilter(value)}>
            <SelectTrigger className="w-32">
              <Activity className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部健康状态</SelectItem>
              <SelectItem value="healthy">健康</SelectItem>
              <SelectItem value="warning">警告</SelectItem>
              <SelectItem value="critical">异常</SelectItem>
              <SelectItem value="unknown">未知</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredGroups.map((group) => {
          const healthStatus = getHealthStatusDisplay(group.healthStatus);
          const HealthIcon = healthStatus.icon;
          
          return (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${healthStatus.color}`}></div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <Badge 
                      variant={group.isEnabled ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleGroupStatus(group)}
                    >
                      {group.isEnabled ? '已启用' : '已禁用'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <HealthIcon className="h-3 w-3" />
                      {healthStatus.text}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupStatus(group)}
                    >
                      {group.isEnabled ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditGroup(group)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === group.id}
                      onClick={() => handleDelete(group.id)}
                    >
                      {deletingId === group.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 描述 */}
                  {group.description && (
                    <div>
                      <Label className="text-sm text-muted-foreground">描述</Label>
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    </div>
                  )}

                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">负载均衡策略</Label>
                      <Badge variant="outline" className="mt-1">
                        {getLoadBalanceStrategyName(group.loadBalanceStrategy)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">故障转移</Label>
                      <Badge variant="outline" className="mt-1">
                        {group.failoverStrategy !== 'FailFast' ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="grid grid-cols-4 gap-4 bg-muted p-3 rounded">
                    <div className="text-center">
                      <Label className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" />
                        API Key数量
                      </Label>
                      <p className="text-lg font-semibold">{group.apiKeys?.filter(k => k.isEnabled).length || 0}/{group.apiKeys?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" />
                        总请求
                      </Label>
                      <p className="text-lg font-semibold">{group.statistics?.totalRequests?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        平均响应时间
                      </Label>
                      <p className="text-lg font-semibold">{group.statistics?.averageResponseTime?.toFixed(0) || '0'}ms</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm text-muted-foreground">总费用</Label>
                      <p className="text-lg font-semibold">${group.statistics?.totalCost?.toFixed(4) || '0.0000'}</p>
                    </div>
                  </div>

                  {/* 标签 */}
                  {group.tags && group.tags.length > 0 && (
                    <div>
                      <Label className="text-sm text-muted-foreground">标签</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.tags.map((tag, index) => (
                          <Badge key={`tag-${group.id}-${index}`} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 健康检查配置 */}
                  {(group.healthCheckInterval ?? 0) > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">健康检查间隔</Label>
                        <p className="text-sm mt-1">{group.healthCheckInterval}秒</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">最后健康检查</Label>
                        <p className="text-sm mt-1">
                          {group.lastHealthCheckAt 
                            ? new Date(group.lastHealthCheckAt).toLocaleString()
                            : '从未检查'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 时间信息 */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span>创建: {group.createdAt ? new Date(group.createdAt).toLocaleString() : '未知'}</span>
                    <span>更新: {group.updatedAt ? new Date(group.updatedAt).toLocaleString() : '未知'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && groups.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">未找到匹配的分组</h3>
            <p className="text-muted-foreground text-center mb-4">
              请尝试调整搜索条件或过滤器。
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setHealthFilter('all');
            }}>
              清除过滤器
            </Button>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无API Key分组</h3>
            <p className="text-muted-foreground text-center mb-4">
              还没有创建任何分组。分组可以帮助您更好地管理API Key并实现负载均衡。
            </p>
            <Button onClick={handleCreateGroup}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个分组
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 删除确认模态框 */}
      <ConfirmModal
        show={showConfirmModal}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* API Key 分组模态框 */}
      <ApiKeyGroupModal
        open={showGroupModal}
        onClose={handleCloseModal}
        editingGroup={editingGroup}
        onSuccess={handleGroupSuccess}
      />
    </div>
  );
}
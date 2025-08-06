import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  RefreshCw as Refresh,
  FileText as FileTemplate,
  Grid3X3,
  List,
  Keyboard,
  Activity,
  CheckCircle,
  Users
} from 'lucide-react';
import type { 
  ApiKeyGroup, 
  GroupTemplate,
  BatchOperation,
  GroupFilterParams,
  GroupConfigExport
} from '@/types/apiKeyGroups';
import { showToast } from '@/utils/toast';

// 组件导入
import DraggableGroupList from '@/components/groups/DraggableGroupList';
import VirtualizedGroupList from '@/components/groups/VirtualizedGroupList';
import GroupTemplateManager from '@/components/groups/GroupTemplateManager';
import ConfigImportExport from '@/components/groups/ConfigImportExport';
import BatchOperationDialog, { useBatchOperationDialog } from '@/components/groups/BatchOperationDialog';
import KeyboardShortcutsHelp from '@/components/groups/KeyboardShortcutsHelp';

// Hooks导入
import { useGroupRealtime, useDebounce } from '@/hooks/useGroupRealtime';
import { useKeyboardShortcuts, useShortcutHelp, useSearchShortcut } from '@/hooks/useKeyboardShortcuts';

interface ApiKeyGroupsPageProps {
  className?: string;
}

// 视图模式类型
type ViewMode = 'grid' | 'list' | 'virtual';

// 排序选项
const SORT_OPTIONS = [
  { value: 'priority', label: '优先级' },
  { value: 'name', label: '名称' },
  { value: 'created', label: '创建时间' },
  { value: 'lastUsed', label: '最后使用' },
  { value: 'apiKeyCount', label: 'API Key数量' },
  { value: 'health', label: '健康状态' },
] as const;

// 健康状态过滤选项
const HEALTH_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'healthy', label: '健康' },
  { value: 'unhealthy', label: '不健康' },
  { value: 'warning', label: '警告' },
  { value: 'unknown', label: '未知' },
] as const;

// 分组类型过滤选项  
const GROUP_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: 'system', label: '系统' },
  { value: 'custom', label: '自定义' },
  { value: 'template', label: '模板' },
] as const;

export default function ApiKeyGroupsPage({ className = '' }: ApiKeyGroupsPageProps) {
  // 状态管理
  const [groups, setGroups] = useState<ApiKeyGroup[]>([]);
  const [templates, setTemplates] = useState<GroupTemplate[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState<'groups' | 'templates'>('groups');
  
  // 过滤和搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<GroupFilterParams>({
    search: '',
    healthStatus: 'all',
    groupType: 'all',
    isEnabled: undefined,
    sortBy: 'priority',
    sortOrder: 'desc'
  });

  // 防抖搜索
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 实时数据更新
  const { groups: realtimeGroups, isConnected, lastUpdate, refresh, triggerHealthCheck } = useGroupRealtime();

  // 批量操作
  const { dialogState, showDialog, hideDialog } = useBatchOperationDialog();

  // 快捷键帮助
  const { isHelpVisible, showHelp, hideHelp } = useShortcutHelp();

  // 搜索框引用
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);

  // 搜索快捷键
  useSearchShortcut(() => {
    searchInputRef?.focus();
  });

  // 过滤后的分组数据
  const filteredGroups = useMemo(() => {
    let result = groups;

    // 搜索过滤
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(group => 
        group.name.toLowerCase().includes(searchLower) ||
        group.description?.toLowerCase().includes(searchLower) ||
        group.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 健康状态过滤
    if (filters.healthStatus && filters.healthStatus !== 'all') {
      result = result.filter(group => group.healthStatus === filters.healthStatus);
    }

    // 分组类型过滤
    if (filters.groupType && filters.groupType !== 'all') {
      result = result.filter(group => group.groupType === filters.groupType);
    }

    // 启用状态过滤
    if (filters.isEnabled !== undefined) {
      result = result.filter(group => group.isEnabled === filters.isEnabled);
    }

    // 排序
    if (filters.sortBy) {
      result.sort((a, b) => {
        let aValue: number | string, bValue: number | string;

        switch (filters.sortBy) {
          case 'priority':
            aValue = a.priority ?? 0;
            bValue = b.priority ?? 0;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'created':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'lastUsed':
            aValue = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
            bValue = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
            break;
          case 'apiKeyCount':
            aValue = a.apiKeyCount ?? 0;
            bValue = b.apiKeyCount ?? 0;
            break;
          case 'health': {
            const healthOrder = { healthy: 4, warning: 3, unhealthy: 2, unknown: 1 };
            aValue = healthOrder[a.healthStatus as keyof typeof healthOrder] || 0;
            bValue = healthOrder[b.healthStatus as keyof typeof healthOrder] || 0;
            break;
          }
          default:
            return 0;
        }

        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [groups, debouncedSearchTerm, filters]);

  // 统计信息
  const stats = useMemo(() => {
    const total = groups.length;
    const enabled = groups.filter(g => g.isEnabled).length;
    const healthy = groups.filter(g => g.healthStatus === 'healthy').length;
    const unhealthy = groups.filter(g => g.healthStatus === 'unhealthy').length;
    const totalApiKeys = groups.reduce((sum, g) => sum + g.apiKeyCount, 0);
    const healthyApiKeys = groups.reduce((sum, g) => sum + g.healthyApiKeyCount, 0);

    return {
      total,
      enabled,
      disabled: total - enabled,
      healthy,
      unhealthy,
      warning: groups.filter(g => g.healthStatus === 'warning').length,
      unknown: groups.filter(g => g.healthStatus === 'unknown').length,
      totalApiKeys,
      healthyApiKeys,
      healthRate: totalApiKeys > 0 ? Math.round((healthyApiKeys / totalApiKeys) * 100) : 0
    };
  }, [groups]);

  // 键盘快捷键
  useKeyboardShortcuts({
    onNewGroup: () => handleCreateGroup(),
    onRefresh: () => handleRefresh(),
    onHelp: showHelp,
    onEscape: () => {
      setSelectedGroupIds([]);
      hideHelp();
    },
    onSelectAll: () => setSelectedGroupIds(filteredGroups.map(g => g.id)),
    onSelectNone: () => setSelectedGroupIds([]),
    onInvertSelection: () => {
      const allIds = filteredGroups.map(g => g.id);
      const newSelection = allIds.filter(id => !selectedGroupIds.includes(id));
      setSelectedGroupIds(newSelection);
    },
    onToggleView: () => {
      const modes: ViewMode[] = ['grid', 'list', 'virtual'];
      const currentIndex = modes.indexOf(viewMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setViewMode(modes[nextIndex]);
    },
    enabled: activeTab === 'groups'
  });

  // 数据加载
  useEffect(() => {
    loadGroups();
    loadTemplates();
  }, []);

  // 同步实时数据
  useEffect(() => {
    if (realtimeGroups.length > 0) {
      setGroups(realtimeGroups);
    }
  }, [realtimeGroups]);

  // 搜索词同步
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

  // 数据加载函数
  const loadGroups = async () => {
    setLoading(true);
    try {
      // 这里应该调用实际的API
      // const data = await apiService.getGroups();
      // setGroups(data);
      
      // 模拟数据
      const mockGroups: ApiKeyGroup[] = [
        {
          id: '1',
          name: '生产环境分组',
          description: '用于生产环境的高优先级分组',
          groupType: 'custom',
          priority: 90,
          isEnabled: true,
          loadBalanceStrategy: 'least_connections',
          failoverStrategy: 'failover',
          tags: ['production', 'high-priority'],
          apiKeyCount: 5,
          healthyApiKeyCount: 4,
          healthStatus: 'healthy',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          statistics: {
            totalRequests: 15000,
            successfulRequests: 14500,
            failedRequests: 500,
            totalCost: 150.75,
            averageResponseTime: 250,
            currentConcurrentConnections: 15,
            lastUsedAt: new Date().toISOString()
          }
        },
        {
          id: '2',
          name: '开发测试分组',
          description: '用于开发和测试的分组',
          groupType: 'custom',
          priority: 50,
          isEnabled: true,
          loadBalanceStrategy: 'round_robin',
          failoverStrategy: 'failfast',
          tags: ['development', 'testing'],
          apiKeyCount: 3,
          healthyApiKeyCount: 2,
          healthStatus: 'warning',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
          statistics: {
            totalRequests: 3000,
            successfulRequests: 2800,
            failedRequests: 200,
            totalCost: 25.50,
            averageResponseTime: 400,
            currentConcurrentConnections: 5,
            lastUsedAt: new Date(Date.now() - 3600000).toISOString()
          }
        }
      ];
      
      setGroups(mockGroups);
    } catch (error) {
      showToast('加载分组数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // 这里应该调用实际的API
      // const data = await apiService.getTemplates();
      // setTemplates(data);
      
      // 模拟模板数据
      setTemplates([]);
    } catch (error) {
      showToast('加载模板数据失败', 'error');
    }
  };

  // 操作处理函数
  const handleCreateGroup = () => {
    // 实现创建分组逻辑
    showToast('创建分组功能待实现', 'info');
  };

  const handleGroupClick = (group: ApiKeyGroup) => {
    // 实现分组详情查看
    console.log('Group clicked:', group);
  };

  const handleGroupSettings = (group: ApiKeyGroup) => {
    // 实现分组设置
    console.log('Group settings:', group);
  };

  const handleGroupsReorder = async (reorderedGroups: ApiKeyGroup[]) => {
    try {
      // 这里应该调用实际的API保存新的排序
      setGroups(reorderedGroups);
      showToast('分组排序已更新', 'success');
    } catch (error) {
      showToast('更新分组排序失败', 'error');
    }
  };

  const handleRefresh = () => {
    refresh();
    triggerHealthCheck();
    showToast('数据已刷新', 'success');
  };

  const handleBatchOperation = (operation: BatchOperation) => {
    showDialog(operation, groups, async (op) => {
      // 实现批量操作逻辑
      return {
        success: true,
        processed: op.groupIds.length,
        failed: 0,
        errors: []
      };
    });
  };

  const handleImportConfig = async (config: GroupConfigExport) => {
    try {
      // 实现导入逻辑
      console.log('Importing config:', config);
      showToast('配置导入功能待实现', 'info');
    } catch (error: any) {
      showToast(error?.message || '导入失败', 'error');
    }
  };

  const handleCreateTemplate = async (template: Omit<GroupTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // 实现模板创建逻辑
      const newTemplate: GroupTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplates(prev => [...prev, newTemplate]);
      showToast('模板创建成功', 'success');
    } catch (error: any) {
      throw error;
    }
  };

  const handleUpdateTemplate = async (id: string, template: Partial<GroupTemplate>) => {
    try {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...template, updatedAt: new Date().toISOString() } : t));
      showToast('模板更新成功', 'success');
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast('模板删除成功', 'success');
    } catch (error: any) {
      throw error;
    }
  };

  const handleApplyTemplate = (template: GroupTemplate) => {
    // 实现应用模板逻辑
    console.log('Apply template:', template);
    showToast('模板应用功能待实现', 'info');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>API Key 分组管理</span>
            </h1>
            <p className="text-muted-foreground">
              管理和配置API Key分组，实现负载均衡和故障转移
            </p>
          </div>
          
          {/* 实时状态指示器 */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? '实时同步' : '离线模式'}
            </span>
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                更新于 {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={showHelp}>
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <Refresh className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={handleCreateGroup}>
            <Plus className="h-4 w-4 mr-2" />
            创建分组
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总分组数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.enabled} 已启用 • {stats.disabled} 已禁用
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">健康分组</p>
                <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.unhealthy} 不健康 • {stats.warning} 警告
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="text-2xl font-bold">{stats.totalApiKeys}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.healthyApiKeys} 健康 • {stats.healthRate}% 可用率
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">模板数量</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileTemplate className="h-8 w-8 text-purple-500" />
            </div>
            <div className="text-xs text-muted-foreground">
              可用配置模板
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'groups' | 'templates')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="groups" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>分组管理</span>
              <Badge variant="secondary">{filteredGroups.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <FileTemplate className="h-4 w-4" />
              <span>模板管理</span>
              <Badge variant="secondary">{templates.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'groups' && (
            <div className="flex items-center space-x-2">
              <ConfigImportExport
                groups={groups}
                onImport={handleImportConfig}
              />
              
              {selectedGroupIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleBatchOperation({
                      type: 'enable',
                      groupIds: selectedGroupIds
                    });
                  }}
                >
                  批量操作 ({selectedGroupIds.length})
                </Button>
              )}

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'virtual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('virtual')}
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="groups" className="space-y-4">
          {/* 搜索和过滤栏 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      ref={setSearchInputRef}
                      placeholder="搜索分组名称、描述或标签..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Select 
                    value={filters.healthStatus || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, healthStatus: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HEALTH_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filters.groupType || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, groupType: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filters.sortBy || 'priority'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分组列表 */}
          {viewMode === 'grid' && (
            <DraggableGroupList
              groups={filteredGroups}
              onGroupsReorder={handleGroupsReorder}
              onGroupClick={handleGroupClick}
              onGroupSettings={handleGroupSettings}
              loading={loading}
            />
          )}

          {viewMode === 'virtual' && (
            <VirtualizedGroupList
              groups={filteredGroups}
              onGroupClick={handleGroupClick}
              onGroupSettings={handleGroupSettings}
              loading={loading}
              height={600}
              searchTerm={debouncedSearchTerm}
            />
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredGroups.map(group => (
                <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  {/* 简化的列表视图 */}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          group.healthStatus === 'healthy' ? 'bg-green-500' : 
                          group.healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <h3 className="font-medium">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{group.healthyApiKeyCount}/{group.apiKeyCount} Keys</span>
                        <span>{group.statistics?.totalRequests || 0} 请求</span>
                        <span>${(group.statistics?.totalCost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <GroupTemplateManager
            templates={templates}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onApplyTemplate={handleApplyTemplate}
          />
        </TabsContent>
      </Tabs>

      {/* 批量操作对话框 */}
      {dialogState && (
        <BatchOperationDialog
          isOpen={dialogState.isOpen}
          onClose={hideDialog}
          operation={dialogState.operation}
          groups={dialogState.groups}
          onConfirm={dialogState.onConfirm}
        />
      )}

      {/* 键盘快捷键帮助 */}
      <KeyboardShortcutsHelp
        isOpen={isHelpVisible}
        onClose={hideHelp}
      />
    </div>
  );
}
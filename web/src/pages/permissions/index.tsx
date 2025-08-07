import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';
import { ApiKeyPermissionOverview } from '@/components/permissions/ApiKeyPermissionOverview';
import { PermissionRulesList } from '@/components/permissions/PermissionRulesList';
import { PermissionConfig } from '@/components/permissions/PermissionConfig';
import { AccountPoolSelector } from '@/components/permissions/AccountPoolSelector';
import { useToast } from '@/contexts/ToastContext';
import type { 
  PermissionOverview, 
  ApiKeyAccountPermission, 
  AccountPool 
} from '@/types/permissions';
import { apiService } from '@/services/api';

/**
 * 权限管理主页面组件
 * 
 * 功能特性:
 * - 权限概览展示
 * - API Key权限规则管理
 * - 账号池权限配置
 * - 批量权限操作
 * - 权限统计和分析
 * - 实时权限验证
 * - 权限配置导入/导出
 */
const PermissionManagement: React.FC = () => {
  const { showToast } = useToast();
  
  // State管理
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'pools' | 'config'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<{
    platform?: string;
    status?: string;
    poolGroup?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // 数据状态
  const [permissionOverview, setPermissionOverview] = useState<PermissionOverview[]>([]);
  const [permissions, setPermissions] = useState<ApiKeyAccountPermission[]>([]);
  const [accountPools, setAccountPools] = useState<AccountPool[]>([]);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>('');
  
  // 模态框状态
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showBatchOperationModal, setShowBatchOperationModal] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [editingPermission, setEditingPermission] = useState<ApiKeyAccountPermission | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [overviewData, poolsData] = await Promise.all([
        apiService.getPermissionOverview(),
        apiService.getAccountPools(),
      ]);
      
      setPermissionOverview(overviewData);
      setAccountPools(poolsData);
      
      // 如果有选中的API Key，加载其权限规则
      if (selectedApiKeyId) {
        const permissionsData = await apiService.getApiKeyPermissions(selectedApiKeyId);
        setPermissions(permissionsData);
      }
    } catch (error) {
      console.error('Failed to load permission data:', error);
      showToast('加载权限数据失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedApiKeyId, showToast]);

  // 初始化加载
  React.useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // 处理搜索和过滤
  const filteredOverview = useMemo(() => {
    return permissionOverview.filter(item => {
      const matchesSearch = !searchTerm || 
        item.apiKeyName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !selectedFilters.status || 
        item.status === selectedFilters.status;
        
      return matchesSearch && matchesStatus;
    });
  }, [permissionOverview, searchTerm, selectedFilters]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalApiKeys = permissionOverview.length;
    const activeRules = permissionOverview.reduce((sum, item) => sum + item.enabledRules, 0);
    const totalPools = accountPools.length;
    const healthyPools = accountPools.filter(pool => 
      pool.usage && pool.usage.successRate > 95
    ).length;
    
    return {
      totalApiKeys,
      activeRules,
      totalPools,
      healthyPools,
      totalAccounts: accountPools.reduce((sum, pool) => sum + pool.totalAccounts, 0),
    };
  }, [permissionOverview, accountPools]);

  // 事件处理函数
  const handleCreatePermission = useCallback(() => {
    setEditingPermission(null);
    setShowConfigModal(true);
  }, []);

  const handleEditPermission = useCallback((permission: ApiKeyAccountPermission) => {
    setEditingPermission(permission);
    setShowConfigModal(true);
  }, []);

  const handleDeletePermission = useCallback(async (permissionId: string) => {
    try {
      await apiService.deletePermission(permissionId);
      showToast('权限规则删除成功', 'success');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete permission:', error);
      showToast('删除权限规则失败', 'error');
    }
  }, [showToast]);

  const handleBatchOperation = useCallback(async (operation: string, payload?: any) => {
    if (selectedPermissionIds.length === 0) {
      showToast('请先选择要操作的权限规则', 'warning');
      return;
    }

    try {
      switch (operation) {
        case 'enable':
          await Promise.all(selectedPermissionIds.map(id => 
            apiService.togglePermissionEnabled(id)
          ));
          break;
        case 'delete':
          await apiService.batchDeletePermissions(selectedPermissionIds);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
      
      showToast(`批量${operation}操作成功`, 'success');
      setSelectedPermissionIds([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(`Batch ${operation} failed:`, error);
      showToast(`批量${operation}操作失败`, 'error');
    }
  }, [selectedPermissionIds, showToast]);

  const handleApiKeySelect = useCallback((apiKeyId: string) => {
    setSelectedApiKeyId(apiKeyId);
    setActiveTab('rules');
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', icon: CheckCircle, text: '活跃' },
      inactive: { variant: 'secondary', icon: Clock, text: '未激活' },
      expired: { variant: 'destructive', icon: AlertCircle, text: '已过期' },
      restricted: { variant: 'outline', icon: Ban, text: '受限' }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">权限管理</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            管理API Key的账号池权限配置，控制访问范围和策略
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} size="sm" className="sm:size-default">
            <Shield className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">刷新数据</span>
            <span className="sm:hidden">刷新</span>
          </Button>
          <Button onClick={handleCreatePermission} size="sm" className="sm:size-default">
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">添加权限规则</span>
            <span className="sm:hidden">添加</span>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApiKeys}</div>
            <p className="text-xs text-muted-foreground">
              已配置权限的API Key数量
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃规则</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              当前生效的权限规则数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">账号池</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPools}</div>
            <p className="text-xs text-muted-foreground">
              可用账号池总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">健康池</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.healthyPools}</div>
            <p className="text-xs text-muted-foreground">
              成功率&gt;95%的账号池
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总账户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              所有池中的账户总数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索API Key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button variant="outline" size="sm">
                <Filter className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">筛选</span>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">导出</span>
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">导入</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">权限概览</TabsTrigger>
          <TabsTrigger value="rules">权限规则</TabsTrigger>
          <TabsTrigger value="pools">账号池管理</TabsTrigger>
          <TabsTrigger value="config">批量配置</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ApiKeyPermissionOverview
            data={filteredOverview}
            isLoading={isLoading}
            onApiKeySelect={handleApiKeySelect}
            onRefresh={handleRefresh}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <PermissionRulesList
            permissions={permissions}
            selectedApiKeyId={selectedApiKeyId}
            isLoading={isLoading}
            selectedIds={selectedPermissionIds}
            onSelectionChange={setSelectedPermissionIds}
            onEdit={handleEditPermission}
            onDelete={handleDeletePermission}
            onBatchOperation={handleBatchOperation}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="pools" className="space-y-4">
          <AccountPoolSelector
            pools={accountPools}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>批量权限配置</CardTitle>
              <CardDescription>
                为多个API Key批量配置权限规则
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">批量配置工具</h3>
                <p className="text-muted-foreground mb-4">
                  选择一个或多个API Key来批量设置权限规则
                </p>
                <Button onClick={() => setShowBatchOperationModal(true)}>
                  开始批量配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 权限配置模态框 */}
      {showConfigModal && (
        <PermissionConfig
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          editingPermission={editingPermission}
          accountPools={accountPools}
          onSuccess={() => {
            setRefreshTrigger(prev => prev + 1);
            setShowConfigModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PermissionManagement;
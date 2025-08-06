import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Search, 
  ArrowRight, 
  Key,
  Weight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKey, ApiKeyGroupMapping } from '@/services/api';
import { showToast } from '@/utils/toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useConfirm } from '@/hooks/useConfirm';

interface ApiKeyGroupMappingManagerProps {
  groupId: string;
  groupName: string;
}

interface MappingWithApiKey extends ApiKeyGroupMapping {
  apiKey: ApiKey;
}

export default function ApiKeyGroupMappingManager({ groupId, groupName }: ApiKeyGroupMappingManagerProps) {
  const [mappings, setMappings] = useState<MappingWithApiKey[]>([]);
  const [availableKeys, setAvailableKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingKey, setAddingKey] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<{weight: number, priority: number}>({weight: 50, priority: 1});
  const { showConfirmModal, confirmOptions, showConfirm, handleConfirm, handleCancel } = useConfirm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mappingsData, availableData] = await Promise.all([
        apiService.getApiKeyGroupMappings(groupId),
        apiService.getAvailableApiKeysForGroup(groupId)
      ]);

      // 获取映射关联的API Key信息
      const allKeys = await apiService.getApiKeys();
      const mappingsWithKeys = mappingsData.map(mapping => ({
        ...mapping,
        apiKey: allKeys.find(key => key.id === mapping.apiKeyId)!
      })).filter(mapping => mapping.apiKey);

      setMappings(mappingsWithKeys);
      setAvailableKeys(availableData);
    } catch (error) {
      console.error('Failed to fetch mapping data:', error);
      showToast('获取映射数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [groupId, fetchData]);

  const addApiKeyToGroup = async () => {
    if (!addingKey) return;

    try {
      const newMapping = await apiService.addApiKeyToGroup({
        groupId,
        apiKeyId: addingKey,
        weight: 50,
        priority: 1,
        isEnabled: true
      });

      const apiKey = availableKeys.find(key => key.id === addingKey);
      if (apiKey) {
        setMappings(prev => [...prev, { ...newMapping, apiKey }]);
        setAvailableKeys(prev => prev.filter(key => key.id !== addingKey));
      }
      
      setAddingKey('');
      showToast('API Key添加成功', 'success');
    } catch (error) {
      console.error('Failed to add API key:', error);
      const errorMessage = error instanceof Error ? error.message : '添加API Key失败';
      showToast(errorMessage, 'error');
    }
  };

  const removeApiKeyFromGroup = async (mappingId: string, keyName: string) => {
    const confirmed = await showConfirm(
      '移除 API Key',
      `确定要将 "${keyName}" 从分组 "${groupName}" 中移除吗？\n\n这不会删除API Key本身，只是将其从此分组中移除。`,
      '移除',
      '取消'
    );

    if (confirmed) {
      try {
        await apiService.removeApiKeyFromGroup(mappingId);
        
        const mapping = mappings.find(m => m.id === mappingId);
        if (mapping) {
          setAvailableKeys(prev => [...prev, mapping.apiKey]);
          setMappings(prev => prev.filter(m => m.id !== mappingId));
        }
        
        showToast('API Key移除成功', 'success');
      } catch (error) {
        console.error('Failed to remove API key:', error);
        const errorMessage = error instanceof Error ? error.message : '移除API Key失败';
        showToast(errorMessage, 'error');
      }
    }
  };

  const updateMapping = async (mappingId: string, updates: {weight?: number, priority?: number, isEnabled?: boolean}) => {
    try {
      const updatedMapping = await apiService.updateApiKeyGroupMapping(mappingId, updates);
      
      setMappings(prev => prev.map(m => 
        m.id === mappingId 
          ? { ...m, ...updatedMapping }
          : m
      ));
      
      showToast('映射配置更新成功', 'success');
    } catch (error) {
      console.error('Failed to update mapping:', error);
      const errorMessage = error instanceof Error ? error.message : '更新映射配置失败';
      showToast(errorMessage, 'error');
    }
  };

  const startEditing = (mappingId: string, currentWeight: number, currentPriority: number) => {
    setEditingMapping(mappingId);
    setTempValues({weight: currentWeight, priority: currentPriority});
  };

  const saveEditing = async () => {
    if (!editingMapping) return;

    await updateMapping(editingMapping, {
      weight: tempValues.weight,
      priority: tempValues.priority
    });
    
    setEditingMapping(null);
  };

  const cancelEditing = () => {
    setEditingMapping(null);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string) => {
    if (key?.length <= 8) return key;
    return key?.substring(0, 4) + '••••••••' + key?.substring(key.length - 4);
  };

  const getHealthStatusConfig = (status: 'healthy' | 'unhealthy' | 'unknown') => {
    switch (status) {
      case 'healthy':
        return { 
          icon: CheckCircle, 
          color: 'text-green-500', 
          bgColor: 'bg-green-100 dark:bg-green-900',
          label: '健康' 
        };
      case 'unhealthy':
        return { 
          icon: XCircle, 
          color: 'text-red-500', 
          bgColor: 'bg-red-100 dark:bg-red-900',
          label: '异常' 
        };
      default:
        return { 
          icon: AlertTriangle, 
          color: 'text-yellow-500', 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          label: '未知' 
        };
    }
  };

  const filteredAvailableKeys = availableKeys.filter(key => 
    !searchTerm || 
    key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.keyValue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMappings = [...mappings].sort((a, b) => {
    // 先按优先级排序（数字越小优先级越高）
    const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER;
    const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    // 再按权重排序（数字越大权重越高）
    return b.weight - a.weight;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-border"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">API Key 映射管理</h2>
          <p className="text-sm text-muted-foreground">管理分组 "{groupName}" 中的API Key映射关系</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 可用的API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              可用的 API Keys
              <Badge variant="secondary">{filteredAvailableKeys.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 搜索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索API Key..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 添加API Key */}
              <div className="flex gap-2">
                <Select value={addingKey} onValueChange={setAddingKey}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择要添加的API Key" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAvailableKeys.map(key => (
                      <SelectItem key={key.id} value={key.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{key.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {maskKey(key.keyValue)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={addApiKeyToGroup} 
                  disabled={!addingKey}
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* 可用API Key列表 */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredAvailableKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="w-8 h-8 mx-auto mb-2" />
                    <p>没有可用的API Key</p>
                  </div>
                ) : (
                  filteredAvailableKeys.map(key => (
                    <Card key={key.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{key.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {maskKey(key.keyValue)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {key.service?.toUpperCase() || 'CLAUDE'}
                            </Badge>
                            <Badge variant={key.isEnabled ? 'default' : 'secondary'} className="text-xs">
                              {key.isEnabled ? '启用' : '禁用'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAddingKey(key.id);
                            addApiKeyToGroup();
                          }}
                          disabled={!key.isEnabled}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 已分组的API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="w-5 h-5" />
              分组中的 API Keys
              <Badge variant="secondary">{sortedMappings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedMappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Weight className="w-8 h-8 mx-auto mb-2" />
                  <p>分组中还没有API Key</p>
                  <p className="text-xs">从左侧添加API Key到此分组</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {sortedMappings.map((mapping, index) => {
                    const healthConfig = getHealthStatusConfig(mapping.healthStatus as 'healthy' | 'unhealthy' | 'unknown');
                    const HealthIcon = healthConfig.icon;
                    
                    return (
                      <Card key={mapping.id} className="p-4">
                        <div className="space-y-3">
                          {/* API Key基本信息 */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{mapping.apiKey.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  优先级 {mapping.priority}
                                </Badge>
                                <Badge 
                                  variant={mapping.isEnabled ? 'default' : 'secondary'}
                                  className="text-xs cursor-pointer"
                                  onClick={() => updateMapping(mapping.id, { isEnabled: !mapping.isEnabled })}
                                >
                                  {mapping.isEnabled ? '启用' : '禁用'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-xs">
                                  <Key className="w-3 h-3" />
                                  {visibleKeys.has(mapping.apiKey.id) 
                                    ? mapping.apiKey.keyValue 
                                    : maskKey(mapping.apiKey.keyValue)
                                  }
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleKeyVisibility(mapping.apiKey.id)}
                                  className="h-auto p-1"
                                >
                                  {visibleKeys.has(mapping.apiKey.id) ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${healthConfig.bgColor}`}>
                                <HealthIcon className={`w-full h-full ${healthConfig.color}`} />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeApiKeyFromGroup(mapping.id, mapping.apiKey.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* 权重和优先级配置 */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">权重</Label>
                              {editingMapping === mapping.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={tempValues.weight}
                                    onChange={(e) => setTempValues(prev => ({
                                      ...prev, 
                                      weight: parseInt(e.target.value) || 0
                                    }))}
                                    className="h-7 text-sm"
                                  />
                                  <Button size="sm" variant="ghost" onClick={saveEditing}>
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-primary rounded-full h-2"
                                      style={{width: `${mapping.weight}%`}}
                                    />
                                  </div>
                                  <span 
                                    className="text-sm font-medium cursor-pointer hover:text-primary"
                                    onClick={() => startEditing(mapping.id, mapping.weight, mapping.priority ?? 1)}
                                  >
                                    {mapping.weight}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">优先级</Label>
                              {editingMapping === mapping.id ? (
                                <Input
                                  type="number"
                                  min="1"
                                  value={tempValues.priority}
                                  onChange={(e) => setTempValues(prev => ({
                                    ...prev, 
                                    priority: parseInt(e.target.value) || 1
                                  }))}
                                  className="h-7 text-sm"
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium">{mapping.priority}</span>
                                  {index === 0 && <Badge variant="secondary" className="text-xs">最高</Badge>}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 健康状态和性能指标 */}
                          <div className="grid grid-cols-4 gap-2 bg-muted p-2 rounded text-xs">
                            <div className="text-center">
                              <div className="text-muted-foreground">状态</div>
                              <div className={`font-medium ${healthConfig.color}`}>
                                {healthConfig.label}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">响应时间</div>
                              <div className="font-medium">{mapping.responseTime}ms</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">错误率</div>
                              <div className="font-medium">{((mapping.errorRate ?? 0) * 100).toFixed(1)}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">最后检查</div>
                              <div className="font-medium">
                                {mapping.lastHealthCheck 
                                  ? new Date(mapping.lastHealthCheck).toLocaleTimeString()
                                  : '未检查'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作说明 */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">💡 操作说明</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong>权重配置：</strong>
              <ul className="mt-1 space-y-1">
                <li>• 权重决定了请求分配的比例</li>
                <li>• 权重越高，分配的请求越多</li>
                <li>• 点击权重数值可以编辑</li>
              </ul>
            </div>
            <div>
              <strong>优先级配置：</strong>
              <ul className="mt-1 space-y-1">
                <li>• 优先级决定了故障转移的顺序</li>
                <li>• 数字越小优先级越高</li>
                <li>• 高优先级的API Key会优先使用</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 确认删除模态框 */}
      <ConfirmModal
        show={showConfirmModal}
        title={confirmOptions.title}
        message={confirmOptions.message}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
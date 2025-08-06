import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Layers } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKey } from '@/services/api';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  editingKey?: ApiKey | null;
  onSuccess: (apiKey: ApiKey) => void;
}

interface FormData {
  name: string;
  description: string;
  tags: string[];
  tokenLimit: string;
  rateLimitWindow: string;
  rateLimitRequests: string;
  concurrencyLimit: string;
  dailyCostLimit: string;
  monthlyCostLimit: string;
  totalCostLimit: string;
  expiresAt: string;
  permissions: string;
  claudeAccountId: string;
  claudeConsoleAccountId: string;
  geminiAccountId: string;
  enableModelRestriction: boolean;
  restrictedModels: string[];
  enableClientRestriction: boolean;
  allowedClients: string[];
  isEnabled: boolean;
  model: string;
  service: string;
  // 分组相关字段
  selectedGroups: Array<{
    groupId: string;
    weight: number;
    priority: number;
  }>;
}

const AVAILABLE_SERVICES = [
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'all', label: '全部服务' }
];


export default function ApiKeyModal({ open, onClose, editingKey, onSuccess }: ApiKeyModalProps) {
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [apiKeyGroups, setApiKeyGroups] = useState<{ id: string; name: string; isEnabled: boolean }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupWeight, setGroupWeight] = useState('1');
  const [groupPriority, setGroupPriority] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInitialFormData = (editingKey?: ApiKey | null): FormData => {
    if (editingKey) {
      return {
        name: editingKey.name || '',
        description: editingKey.description || '',
        tags: editingKey.tags || [],
        tokenLimit: editingKey.tokenLimit?.toString() || '',
        rateLimitWindow: editingKey.rateLimitWindow?.toString() || '',
        rateLimitRequests: editingKey.rateLimitRequests?.toString() || '',
        concurrencyLimit: editingKey.concurrencyLimit?.toString() || '0',
        dailyCostLimit: editingKey.dailyCostLimit?.toString() || '0',
        monthlyCostLimit: editingKey.monthlyCostLimit?.toString() || '0',
        totalCostLimit: editingKey.totalCostLimit?.toString() || '0',
        expiresAt: editingKey.expiresAt ? new Date(editingKey.expiresAt).toISOString().slice(0, 16) : '',
        permissions: editingKey.permissions || 'all',
        claudeAccountId: editingKey.claudeAccountId || '',
        claudeConsoleAccountId: editingKey.claudeConsoleAccountId || '',
        geminiAccountId: editingKey.geminiAccountId || '',
        enableModelRestriction: editingKey.enableModelRestriction || false,
        restrictedModels: editingKey.restrictedModels || [],
        enableClientRestriction: editingKey.enableClientRestriction || false,
        allowedClients: editingKey.allowedClients || [],
        isEnabled: editingKey.isEnabled !== undefined ? editingKey.isEnabled : true,
        model: editingKey.model || '',
        service: editingKey.service || 'all',
        selectedGroups: editingKey.groupMappings?.map(mapping => ({
          groupId: mapping.groupId,
          weight: mapping.weight,
          priority: mapping.priority ?? 1
        })) || []
      };
    }
    return {
      name: '',
      description: '',
      tags: [],
      tokenLimit: '',
      rateLimitWindow: '',
      rateLimitRequests: '',
      concurrencyLimit: '0',
      dailyCostLimit: '0',
      monthlyCostLimit: '0',
      totalCostLimit: '0',
      expiresAt: '',
      permissions: 'all',
      claudeAccountId: '',
      claudeConsoleAccountId: '',
      geminiAccountId: '',
      enableModelRestriction: false,
      restrictedModels: [],
      enableClientRestriction: false,
      allowedClients: [],
      isEnabled: true,
      model: '',
      service: 'all',
      selectedGroups: []
    };
  };

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(editingKey));

  // 获取分组列表
  useEffect(() => {
    if (open) {
      fetchApiKeyGroups();
    }
  }, [open]);

  const fetchApiKeyGroups = async () => {
    try {
      const groupsResponse = await apiService.getApiKeyGroups();
      setApiKeyGroups(Array.isArray(groupsResponse) ? groupsResponse : []);
    } catch (error) {
      console.error('Failed to fetch API key groups:', error);
    }
  };

  // 当 editingKey 改变时重新设置表单数据
  useEffect(() => {
    setFormData(getInitialFormData(editingKey));
    setNewTag('');
    setErrors({});
  }, [editingKey, open]);

  const updateFormData = (field: keyof FormData, value: string | number | boolean | string[] | Array<{groupId: string; weight: number; priority: number;}>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    updateFormData('tags', formData.tags.filter((_, i) => i !== index));
  };

  // 分组管理函数
  const addToGroup = () => {
    if (selectedGroupId && !formData.selectedGroups.find(g => g.groupId === selectedGroupId)) {
      const newGroup = {
        groupId: selectedGroupId,
        weight: Number(groupWeight) || 1,
        priority: Number(groupPriority) || 1
      };
      updateFormData('selectedGroups', [...formData.selectedGroups, newGroup]);
      setSelectedGroupId('');
      setGroupWeight('1');
      setGroupPriority('1');
    }
  };

  const removeFromGroup = (groupId: string) => {
    updateFormData('selectedGroups', formData.selectedGroups.filter(g => g.groupId !== groupId));
  };

  const updateGroupMapping = (groupId: string, field: 'weight' | 'priority', value: number) => {
    updateFormData('selectedGroups', formData.selectedGroups.map(g => 
      g.groupId === groupId ? { ...g, [field]: value } : g
    ));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名称不能为空';
    }

    if (formData.tokenLimit && isNaN(Number(formData.tokenLimit))) {
      newErrors.tokenLimit = 'Token限制必须是数字';
    }

    if (formData.rateLimitWindow && isNaN(Number(formData.rateLimitWindow))) {
      newErrors.rateLimitWindow = '时间窗口必须是数字';
    }

    if (formData.rateLimitRequests && isNaN(Number(formData.rateLimitRequests))) {
      newErrors.rateLimitRequests = '请求次数限制必须是数字';
    }

    if (isNaN(Number(formData.concurrencyLimit))) {
      newErrors.concurrencyLimit = '并发限制必须是数字';
    }

    if (isNaN(Number(formData.dailyCostLimit))) {
      newErrors.dailyCostLimit = '每日费用限制必须是数字';
    }

    if (isNaN(Number(formData.monthlyCostLimit))) {
      newErrors.monthlyCostLimit = '月度费用限制必须是数字';
    }

    if (isNaN(Number(formData.totalCostLimit))) {
      newErrors.totalCostLimit = '总费用限制必须是数字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        name: formData.name,
        description: formData.description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        tokenLimit: formData.tokenLimit ? Number(formData.tokenLimit) : undefined,
        rateLimitWindow: formData.rateLimitWindow ? Number(formData.rateLimitWindow) : undefined,
        rateLimitRequests: formData.rateLimitRequests ? Number(formData.rateLimitRequests) : undefined,
        concurrencyLimit: Number(formData.concurrencyLimit),
        dailyCostLimit: Number(formData.dailyCostLimit),
        monthlyCostLimit: Number(formData.monthlyCostLimit),
        totalCostLimit: Number(formData.totalCostLimit),
        expiresAt: formData.expiresAt || undefined,
        permissions: formData.permissions,
        claudeAccountId: formData.claudeAccountId || undefined,
        claudeConsoleAccountId: formData.claudeConsoleAccountId || undefined,
        geminiAccountId: formData.geminiAccountId || undefined,
        enableModelRestriction: formData.enableModelRestriction,
        restrictedModels: formData.restrictedModels.length > 0 ? formData.restrictedModels : undefined,
        enableClientRestriction: formData.enableClientRestriction,
        allowedClients: formData.allowedClients.length > 0 ? formData.allowedClients : undefined,
        isEnabled: formData.isEnabled,
        model: formData.model || undefined,
        service: formData.service,
        // 分组相关数据 - 转换为API需要的格式
        groupIds: formData.selectedGroups.map(g => g.groupId),
        groupMappings: undefined
      };

      const result = editingKey 
        ? await apiService.updateApiKey(editingKey.id, requestData)
        : await apiService.createApiKey(requestData);
      
      onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Failed to save API key:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose}
      title={editingKey ? '编辑 API Key' : '创建新的 API Key'}
      subtitle={editingKey ? '修改您的 API Key 设置和限制' : '配置您的 API Key 设置和限制'}
      size="5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">基本配置</TabsTrigger>
            <TabsTrigger value="groups">分组管理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6 mt-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="为您的 API Key 取一个名称"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">备注描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="为这个 API Key 添加一些描述信息"
                />
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label>标签</Label>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="添加标签"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 服务配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">服务配置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">服务类型</Label>
                <Select value={formData.service} onValueChange={(value) => updateFormData('service', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SERVICES.map(service => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissions">服务权限</Label>
                <Select value={formData.permissions} onValueChange={(value) => updateFormData('permissions', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部服务</SelectItem>
                    <SelectItem value="claude">仅 Claude</SelectItem>
                    <SelectItem value="gemini">仅 Gemini</SelectItem>
                    <SelectItem value="openai">仅 OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.service !== 'all' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="model">指定模型 (可选)</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => updateFormData('model', e.target.value)}
                    placeholder="如果指定，将强制使用此模型"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 费用限制 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">费用限制</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyCostLimit">每日费用限制 (美元)</Label>
                <Input
                  id="dailyCostLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dailyCostLimit}
                  onChange={(e) => updateFormData('dailyCostLimit', e.target.value)}
                  placeholder="0表示无限制"
                  className={errors.dailyCostLimit ? 'border-destructive' : ''}
                />
                {errors.dailyCostLimit && <p className="text-destructive text-xs">{errors.dailyCostLimit}</p>}
                <p className="text-xs text-muted-foreground">设置0表示不限制每日费用</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyCostLimit">月度费用限制 (美元)</Label>
                <Input
                  id="monthlyCostLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyCostLimit}
                  onChange={(e) => updateFormData('monthlyCostLimit', e.target.value)}
                  placeholder="0表示无限制"
                  className={errors.monthlyCostLimit ? 'border-destructive' : ''}
                />
                {errors.monthlyCostLimit && <p className="text-destructive text-xs">{errors.monthlyCostLimit}</p>}
                <p className="text-xs text-muted-foreground">设置0表示不限制月度费用</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCostLimit">总费用限制 (美元)</Label>
                <Input
                  id="totalCostLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalCostLimit}
                  onChange={(e) => updateFormData('totalCostLimit', e.target.value)}
                  placeholder="0表示无限制"
                  className={errors.totalCostLimit ? 'border-destructive' : ''}
                />
                {errors.totalCostLimit && <p className="text-destructive text-xs">{errors.totalCostLimit}</p>}
                <p className="text-xs text-muted-foreground">设置0表示不限制总费用</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">💡 费用限制说明</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 每日费用限制：每天重置，达到限制后当天无法继续使用</li>
                <li>• 月度费用限制：每月重置，达到限制后当月无法继续使用</li>
                <li>• 总费用限制：永不重置，达到限制后永久无法使用（除非修改限制）</li>
                <li>• 费用实时计算，包含输入Token、输出Token和缓存费用</li>
              </ul>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6 mt-6">
            {/* 分组管理 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">分组管理</h3>
              <p className="text-sm text-muted-foreground">
                将此API Key添加到一个或多个分组中，可以实现负载均衡和故障转移。
              </p>

              {/* 添加到分组 */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">添加到分组</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>选择分组</Label>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分组" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiKeyGroups
                          .filter(group => !formData.selectedGroups.find(g => g.groupId === group.id))
                          .map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>权重</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={groupWeight}
                      onChange={(e) => setGroupWeight(e.target.value)}
                      placeholder="1-100"
                    />
                    <p className="text-xs text-muted-foreground">权重越高，分配到的请求越多</p>
                  </div>
                  <div className="space-y-2">
                    <Label>优先级</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={groupPriority}
                      onChange={(e) => setGroupPriority(e.target.value)}
                      placeholder="1-10"
                    />
                    <p className="text-xs text-muted-foreground">优先级越高，故障转移时越优先</p>
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button 
                      type="button" 
                      onClick={addToGroup}
                      disabled={!selectedGroupId}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加
                    </Button>
                  </div>
                </div>
              </div>

              {/* 已选择的分组 */}
              {formData.selectedGroups.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">已加入的分组</h4>
                  <div className="space-y-3">
                    {formData.selectedGroups.map((groupMapping) => {
                      const group = apiKeyGroups.find(g => g.id === groupMapping.groupId);
                      return (
                        <div key={groupMapping.groupId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{group?.name || `分组 ${groupMapping.groupId}`}</p>
                              <p className="text-sm text-muted-foreground">
                                权重: {groupMapping.weight} | 优先级: {groupMapping.priority}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs">权重</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={groupMapping.weight}
                                onChange={(e) => updateGroupMapping(groupMapping.groupId, 'weight', Number(e.target.value))}
                                className="w-16 h-8 text-xs"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs">优先级</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={groupMapping.priority}
                                onChange={(e) => updateGroupMapping(groupMapping.groupId, 'priority', Number(e.target.value))}
                                className="w-16 h-8 text-xs"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromGroup(groupMapping.groupId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 分组说明 */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">💡 分组功能说明</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 权重：决定负载均衡时的请求分配比例，权重越高分配越多</li>
                  <li>• 优先级：故障转移时的优先顺序，优先级越高越优先使用</li>
                  <li>• 一个API Key可以同时属于多个分组</li>
                  <li>• 分组启用负载均衡策略后，会根据权重和策略自动分配请求</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading 
              ? (editingKey ? '更新中...' : '创建中...') 
              : (editingKey ? '更新 API Key' : '创建 API Key')
            }
          </Button>
        </div>
        </form>
    </Modal>
  );
}
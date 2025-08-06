import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Users, Settings, Heart, Shield } from 'lucide-react';
import { apiService } from '@/services/api';
import type { ApiKeyGroup, LoadBalanceStrategy, ApiKeyGroupCreateRequest } from '@/services/api';
import { showToast } from '@/utils/toast';

interface ApiKeyGroupModalProps {
  open: boolean;
  onClose: () => void;
  editingGroup?: ApiKeyGroup | null;
  onSuccess: (group: ApiKeyGroup) => void;
}

interface FormData {
  name: string;
  description: string;
  tags: string[];
  loadBalanceStrategy: LoadBalanceStrategy;
  failoverEnabled: boolean;
  healthCheckEnabled: boolean;
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  healthCheckEndpoint: string;
  isEnabled: boolean;
}

const LoadBalanceStrategies = [
  { value: 0, label: '轮询 (Round Robin)', description: '依次分配请求到每个API Key' },
  { value: 1, label: '加权 (Weighted)', description: '基于权重和性能分配' },
  { value: 2, label: '最少连接 (Least Connections)', description: '分配到最少活跃连接的API Key' },
  { value: 3, label: '随机 (Random)', description: '随机选择API Key' },
  { value: 4, label: '哈希 (Hash)', description: '基于会话哈希分配' },
  { value: 5, label: '最快响应 (Fastest Response)', description: '分配到响应最快的API Key' }
];

export default function ApiKeyGroupModal({ open, onClose, editingGroup, onSuccess }: ApiKeyGroupModalProps) {
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInitialFormData = (editingGroup?: ApiKeyGroup | null): FormData => {
    if (editingGroup) {
      return {
        name: editingGroup.name || '',
        description: editingGroup.description || '',
        tags: editingGroup.tags || [],
        loadBalanceStrategy: typeof editingGroup.loadBalanceStrategy === 'string' ? 
          parseInt(editingGroup.loadBalanceStrategy) || 0 : 
          editingGroup.loadBalanceStrategy || 0,
        failoverEnabled: editingGroup.failoverEnabled || false,
        healthCheckEnabled: editingGroup.healthCheckEnabled || false,
        healthCheckIntervalMs: editingGroup.healthCheckIntervalMs || 60000,
        healthCheckTimeoutMs: editingGroup.healthCheckTimeoutMs || 5000,
        healthCheckEndpoint: editingGroup.healthCheckEndpoint || '/v1/messages',
        isEnabled: editingGroup.isEnabled !== undefined ? editingGroup.isEnabled : true,
      };
    }
    return {
      name: '',
      description: '',
      tags: [],
      loadBalanceStrategy: 0, // Round Robin
      failoverEnabled: true,
      healthCheckEnabled: true,
      healthCheckIntervalMs: 60000, // 1 minute
      healthCheckTimeoutMs: 5000, // 5 seconds
      healthCheckEndpoint: '/v1/messages',
      isEnabled: true,
    };
  };

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(editingGroup));

  // 当 editingGroup 改变时重新设置表单数据
  useEffect(() => {
    setFormData(getInitialFormData(editingGroup));
    setNewTag('');
    setErrors({});
  }, [editingGroup, open]);

  const updateFormData = (field: keyof FormData, value: FormData[keyof FormData]) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '分组名称不能为空';
    }

    if (formData.healthCheckIntervalMs < 10000) {
      newErrors.healthCheckIntervalMs = '健康检查间隔不能少于10秒';
    }

    if (formData.healthCheckTimeoutMs < 1000 || formData.healthCheckTimeoutMs > 30000) {
      newErrors.healthCheckTimeoutMs = '健康检查超时应在1-30秒之间';
    }

    if (formData.healthCheckTimeoutMs >= formData.healthCheckIntervalMs) {
      newErrors.healthCheckTimeoutMs = '健康检查超时不能大于等于检查间隔';
    }

    if (formData.healthCheckEnabled && !formData.healthCheckEndpoint.trim()) {
      newErrors.healthCheckEndpoint = '启用健康检查时，检查端点不能为空';
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
      const requestData: ApiKeyGroupCreateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        loadBalanceStrategy: formData.loadBalanceStrategy,
        failoverEnabled: formData.failoverEnabled,
        healthCheckEnabled: formData.healthCheckEnabled,
        healthCheckIntervalMs: formData.healthCheckIntervalMs,
        healthCheckTimeoutMs: formData.healthCheckTimeoutMs,
        healthCheckEndpoint: formData.healthCheckEndpoint.trim() || undefined,
        isEnabled: formData.isEnabled,
      };

      const result = editingGroup 
        ? await apiService.updateApiKeyGroup(editingGroup.id, { ...requestData, id: editingGroup.id })
        : await apiService.createApiKeyGroup(requestData);
      
      onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Failed to save API key group:', error);
      const errorMessage = error instanceof Error ? error.message : `${editingGroup ? '更新' : '创建'}分组失败`;
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedStrategy = () => {
    return LoadBalanceStrategies.find(s => s.value === formData.loadBalanceStrategy);
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={onClose}
      title={editingGroup ? '编辑 API Key 分组' : '创建新的 API Key 分组'}
      subtitle={editingGroup ? '修改分组配置和负载均衡策略' : '配置分组设置和负载均衡策略'}
      size="5xl"
      icon={<Users className="w-6 h-6 text-white" />}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-semibold">基本信息</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">分组名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="为您的 API Key 分组取一个名称"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">分组描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="为这个分组添加一些描述信息"
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
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
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
              <Button type="button" variant="outline" onClick={addTag} disabled={!newTag.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 启用状态 */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <div className="text-base font-medium">启用分组</div>
              <div className="text-sm text-muted-foreground">
                禁用后，此分组将不会被用于请求分配
              </div>
            </div>
            <Switch
              checked={formData.isEnabled}
              onCheckedChange={(checked) => updateFormData('isEnabled', checked)}
            />
          </div>
        </div>

        {/* 负载均衡策略 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <h3 className="text-lg font-semibold">负载均衡配置</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loadBalanceStrategy">负载均衡策略 *</Label>
              <Select 
                value={formData.loadBalanceStrategy.toString()} 
                onValueChange={(value) => updateFormData('loadBalanceStrategy', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LoadBalanceStrategies.map(strategy => (
                    <SelectItem key={strategy.value} value={strategy.value.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{strategy.label}</span>
                        <span className="text-xs text-muted-foreground">{strategy.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getSelectedStrategy() && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{getSelectedStrategy()?.label}:</strong> {getSelectedStrategy()?.description}
                  </p>
                </div>
              )}
            </div>

            {/* 故障转移 */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <div className="text-base font-medium">启用故障转移</div>
                <div className="text-sm text-muted-foreground">
                  当API Key失败时，自动切换到其他可用的API Key
                </div>
              </div>
              <Switch
                checked={formData.failoverEnabled}
                onCheckedChange={(checked) => updateFormData('failoverEnabled', checked)}
              />
            </div>
          </div>
        </div>

        {/* 健康检查配置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            <h3 className="text-lg font-semibold">健康检查配置</h3>
          </div>

          <div className="space-y-4">
            {/* 启用健康检查 */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <div className="text-base font-medium">启用健康检查</div>
                <div className="text-sm text-muted-foreground">
                  定期检查分组内API Key的健康状态
                </div>
              </div>
              <Switch
                checked={formData.healthCheckEnabled}
                onCheckedChange={(checked) => updateFormData('healthCheckEnabled', checked)}
              />
            </div>

            {formData.healthCheckEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="healthCheckIntervalMs">检查间隔（毫秒）</Label>
                  <Input
                    id="healthCheckIntervalMs"
                    type="number"
                    min="10000"
                    step="1000"
                    value={formData.healthCheckIntervalMs}
                    onChange={(e) => updateFormData('healthCheckIntervalMs', parseInt(e.target.value) || 60000)}
                    className={errors.healthCheckIntervalMs ? 'border-destructive' : ''}
                  />
                  {errors.healthCheckIntervalMs && (
                    <p className="text-destructive text-xs">{errors.healthCheckIntervalMs}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    最少10秒，建议60秒或更长
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="healthCheckTimeoutMs">超时时间（毫秒）</Label>
                  <Input
                    id="healthCheckTimeoutMs"
                    type="number"
                    min="1000"
                    max="30000"
                    step="1000"
                    value={formData.healthCheckTimeoutMs}
                    onChange={(e) => updateFormData('healthCheckTimeoutMs', parseInt(e.target.value) || 5000)}
                    className={errors.healthCheckTimeoutMs ? 'border-destructive' : ''}
                  />
                  {errors.healthCheckTimeoutMs && (
                    <p className="text-destructive text-xs">{errors.healthCheckTimeoutMs}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    建议5-10秒，不超过30秒
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="healthCheckEndpoint">健康检查端点</Label>
                  <Input
                    id="healthCheckEndpoint"
                    value={formData.healthCheckEndpoint}
                    onChange={(e) => updateFormData('healthCheckEndpoint', e.target.value)}
                    placeholder="/v1/messages"
                    className={errors.healthCheckEndpoint ? 'border-destructive' : ''}
                  />
                  {errors.healthCheckEndpoint && (
                    <p className="text-destructive text-xs">{errors.healthCheckEndpoint}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    用于测试API Key可用性的端点路径
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 配置说明 */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 配置说明</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>负载均衡策略</strong>：决定如何在分组内的API Key之间分配请求</li>
            <li>• <strong>故障转移</strong>：API Key失败时自动切换，提高可用性</li>
            <li>• <strong>健康检查</strong>：定期测试API Key可用性，及时发现问题</li>
            <li>• <strong>检查间隔</strong>：太频繁会增加成本，太少可能发现问题较晚</li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading 
              ? (editingGroup ? '更新中...' : '创建中...') 
              : (editingGroup ? '更新分组' : '创建分组')
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}
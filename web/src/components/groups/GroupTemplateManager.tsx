import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  FileTemplate, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  FileText,
  Check,
  X
} from 'lucide-react';
import type { GroupTemplate } from '@/types/apiKeyGroups';
import { showToast } from '@/utils/toast';

interface GroupTemplateManagerProps {
  templates: GroupTemplate[];
  onCreateTemplate: (template: Omit<GroupTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTemplate: (id: string, template: Partial<GroupTemplate>) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onApplyTemplate: (template: GroupTemplate) => void;
  className?: string;
}

interface TemplateFormProps {
  template?: GroupTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<GroupTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

// 预定义模板
const PREDEFINED_TEMPLATES: Omit<GroupTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '高可用生产组',
    description: '适用于生产环境的高可用API Key分组',
    config: {
      groupType: 'custom',
      priority: 90,
      loadBalanceStrategy: 'least_connections',
      failoverStrategy: 'failover',
      tags: ['production', 'high-availability'],
      groupCostLimit: 1000,
      groupRequestLimit: 100000,
    }
  },
  {
    name: '开发测试组',
    description: '适用于开发和测试环境的API Key分组',
    config: {
      groupType: 'custom',
      priority: 50,
      loadBalanceStrategy: 'round_robin',
      failoverStrategy: 'failfast',
      tags: ['development', 'testing'],
      groupCostLimit: 200,
      groupRequestLimit: 20000,
    }
  },
  {
    name: '成本优化组',
    description: '优化成本的API Key分组配置',
    config: {
      groupType: 'custom',
      priority: 30,
      loadBalanceStrategy: 'weighted',
      failoverStrategy: 'circuit_breaker',
      tags: ['cost-optimized', 'budget'],
      groupCostLimit: 100,
      groupRequestLimit: 10000,
    }
  },
  {
    name: '实验性功能组',
    description: '用于测试新功能的实验性分组',
    config: {
      groupType: 'custom',
      priority: 20,
      loadBalanceStrategy: 'random',
      failoverStrategy: 'failfast',
      tags: ['experimental', 'beta'],
      groupCostLimit: 50,
      groupRequestLimit: 5000,
    }
  }
];

// 模板表单组件
function TemplateForm({ template, isOpen, onClose, onSave }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      groupType: 'custom',
      priority: 50,
      loadBalanceStrategy: 'round_robin',
      failoverStrategy: 'failover',
      tags: [] as string[],
      groupCostLimit: undefined as number | undefined,
      groupRequestLimit: undefined as number | undefined,
    }
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        config: { ...template.config }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        config: {
          groupType: 'custom',
          priority: 50,
          loadBalanceStrategy: 'round_robin',
          failoverStrategy: 'failover',
          tags: [],
          groupCostLimit: undefined,
          groupRequestLimit: undefined,
        }
      });
    }
  }, [template]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('请输入模板名称', 'error');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      showToast(template ? '模板更新成功' : '模板创建成功', 'success');
    } catch (error: any) {
      showToast(error.message || '操作失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.config.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          tags: [...(prev.config.tags || []), tagInput.trim()]
        }
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        tags: prev.config.tags?.filter(tag => tag !== tagToRemove) || []
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? '编辑模板' : '创建模板'}
          </DialogTitle>
          <DialogDescription>
            配置API Key分组模板，可用于快速创建具有相同配置的分组
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">模板名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入模板名称"
              />
            </div>
            <div>
              <Label htmlFor="groupType">分组类型</Label>
              <Select 
                value={formData.config.groupType} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, groupType: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">自定义</SelectItem>
                  <SelectItem value="system">系统</SelectItem>
                  <SelectItem value="template">模板</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="输入模板描述"
              rows={2}
            />
          </div>

          {/* 策略配置 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>负载均衡策略</Label>
              <Select 
                value={formData.config.loadBalanceStrategy} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, loadBalanceStrategy: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">轮询</SelectItem>
                  <SelectItem value="weighted">加权</SelectItem>
                  <SelectItem value="least_connections">最少连接</SelectItem>
                  <SelectItem value="random">随机</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>故障转移策略</Label>
              <Select 
                value={formData.config.failoverStrategy} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, failoverStrategy: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="failover">故障转移</SelectItem>
                  <SelectItem value="failfast">快速失败</SelectItem>
                  <SelectItem value="circuit_breaker">熔断器</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 数值配置 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">优先级</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="100"
                value={formData.config.priority}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, priority: parseInt(e.target.value) || 50 }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="costLimit">费用限制 ($)</Label>
              <Input
                id="costLimit"
                type="number"
                min="0"
                step="0.01"
                value={formData.config.groupCostLimit || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { 
                    ...prev.config, 
                    groupCostLimit: e.target.value ? parseFloat(e.target.value) : undefined 
                  }
                }))}
                placeholder="不限制"
              />
            </div>
            <div>
              <Label htmlFor="requestLimit">请求限制</Label>
              <Input
                id="requestLimit"
                type="number"
                min="0"
                value={formData.config.groupRequestLimit || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { 
                    ...prev.config, 
                    groupRequestLimit: e.target.value ? parseInt(e.target.value) : undefined 
                  }
                }))}
                placeholder="不限制"
              />
            </div>
          </div>

          {/* 标签管理 */}
          <div>
            <Label>标签</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="输入标签名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.config.tags && formData.config.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.config.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-1"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
            {template ? '更新' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 模板卡片组件
function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onApply,
  onDuplicate 
}: {
  template: GroupTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onApply: () => void;
  onDuplicate: () => void;
}) {
  const getStrategyText = (strategy: string) => {
    const strategies: { [key: string]: string } = {
      'round_robin': '轮询',
      'weighted': '加权',
      'least_connections': '最少连接',
      'random': '随机',
      'failover': '故障转移',
      'failfast': '快速失败',
      'circuit_breaker': '熔断器'
    };
    return strategies[strategy] || strategy;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <FileTemplate className="h-5 w-5 text-primary" />
            <span>{template.name}</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* 配置信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">负载均衡:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {getStrategyText(template.config.loadBalanceStrategy)}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">故障转移:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {getStrategyText(template.config.failoverStrategy)}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">优先级:</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {template.config.priority}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">类型:</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {template.config.groupType}
              </Badge>
            </div>
          </div>

          {/* 限制信息 */}
          {(template.config.groupCostLimit || template.config.groupRequestLimit) && (
            <div className="bg-muted p-2 rounded text-xs">
              {template.config.groupCostLimit && (
                <div>费用限制: ${template.config.groupCostLimit}</div>
              )}
              {template.config.groupRequestLimit && (
                <div>请求限制: {template.config.groupRequestLimit.toLocaleString()}</div>
              )}
            </div>
          )}

          {/* 标签 */}
          {template.config.tags && template.config.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.config.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 应用按钮 */}
          <Button onClick={onApply} className="w-full mt-4">
            <Check className="h-4 w-4 mr-2" />
            应用模板
          </Button>

          {/* 时间信息 */}
          <div className="text-xs text-muted-foreground text-center border-t pt-2">
            创建时间: {new Date(template.createdAt).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 主模板管理组件
export default function GroupTemplateManager({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onApplyTemplate,
  className = ''
}: GroupTemplateManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GroupTemplate | null>(null);
  const [showPredefinedTemplates, setShowPredefinedTemplates] = useState(false);

  const handleCreateFromPredefined = async (predefinedTemplate: Omit<GroupTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await onCreateTemplate(predefinedTemplate);
      showToast('预定义模板添加成功', 'success');
    } catch (error: any) {
      showToast(error.message || '添加预定义模板失败', 'error');
    }
  };

  const handleDuplicateTemplate = (template: GroupTemplate) => {
    setEditingTemplate({
      ...template,
      id: '',
      name: `${template.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowForm(true);
  };

  const handleDeleteTemplate = async (template: GroupTemplate) => {
    if (window.confirm(`确定要删除模板 "${template.name}" 吗？`)) {
      try {
        await onDeleteTemplate(template.id);
        showToast('模板删除成功', 'success');
      } catch (error: any) {
        showToast(error.message || '删除模板失败', 'error');
      }
    }
  };

  const handleSaveTemplate = async (templateData: Omit<GroupTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTemplate && editingTemplate.id) {
      await onUpdateTemplate(editingTemplate.id, templateData);
    } else {
      await onCreateTemplate(templateData);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <div className={className}>
      {/* 操作按钮 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center space-x-2">
          <FileTemplate className="h-5 w-5" />
          <span>分组模板</span>
          <Badge variant="secondary">{templates.length}</Badge>
        </h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPredefinedTemplates(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            预定义模板
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建模板
          </Button>
        </div>
      </div>

      {/* 模板列表 */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileTemplate className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无模板</h3>
            <p className="text-muted-foreground text-center mb-4">
              创建模板可以快速配置具有相同设置的分组
            </p>
            <div className="flex space-x-2">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建模板
              </Button>
              <Button variant="outline" onClick={() => setShowPredefinedTemplates(true)}>
                <FileText className="h-4 w-4 mr-2" />
                使用预定义模板
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => {
                setEditingTemplate(template);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteTemplate(template)}
              onApply={() => onApplyTemplate(template)}
              onDuplicate={() => handleDuplicateTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* 模板表单对话框 */}
      <TemplateForm
        template={editingTemplate || undefined}
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={handleSaveTemplate}
      />

      {/* 预定义模板对话框 */}
      <Dialog open={showPredefinedTemplates} onOpenChange={setShowPredefinedTemplates}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>预定义模板</DialogTitle>
            <DialogDescription>
              选择一个预定义模板快速开始，您可以在添加后进一步自定义
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PREDEFINED_TEMPLATES.map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">负载均衡:</span>
                      <span>{template.config.loadBalanceStrategy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">优先级:</span>
                      <span>{template.config.priority}</span>
                    </div>
                    {template.config.groupCostLimit && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">费用限制:</span>
                        <span>${template.config.groupCostLimit}</span>
                      </div>
                    )}
                  </div>
                  
                  {template.config.tags && template.config.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.config.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={() => handleCreateFromPredefined(template)} 
                    className="w-full mt-4"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    添加到我的模板
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
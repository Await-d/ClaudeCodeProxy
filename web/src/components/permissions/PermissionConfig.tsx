import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Users, 
  Settings, 
  Clock,
  Info,
  X,
  Plus
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { apiService } from '@/services/api';
import type { 
  ApiKeyAccountPermission, 
  AccountPool, 
  CreatePermissionRequest 
} from '@/types/permissions';

// 表单验证schema
const permissionSchema = z.object({
  apiKeyId: z.string().min(1, '请选择API Key'),
  accountPoolGroup: z.string().min(1, '请选择账号池'),
  allowedPlatforms: z.array(z.string()).min(1, '请至少选择一个平台'),
  allowedAccountIds: z.array(z.string()).optional(),
  selectionStrategy: z.string(),
  priority: z.number().min(1).max(100),
  isEnabled: z.boolean(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  description: z.string().optional(),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

interface PermissionConfigProps {
  isOpen: boolean;
  onClose: () => void;
  editingPermission?: ApiKeyAccountPermission | null;
  accountPools: AccountPool[];
  onSuccess: () => void;
}

/**
 * 权限配置表单组件
 * 
 * 功能特性:
 * - 创建/编辑权限规则
 * - 多平台权限配置
 * - 账号池选择和筛选
 * - 时间范围限制设置
 * - 优先级和策略配置
 * - 实时表单验证
 * - 权限预览和验证
 */
export const PermissionConfig: React.FC<PermissionConfigProps> = ({
  isOpen,
  onClose,
  editingPermission,
  accountPools,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<Array<{id: string; name: string}>>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  const [selectionStrategies, setSelectionStrategies] = useState<Array<{
    value: string; 
    label: string; 
    description: string;
  }>>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      apiKeyId: '',
      accountPoolGroup: '',
      allowedPlatforms: [],
      allowedAccountIds: [],
      selectionStrategy: 'priority',
      priority: 50,
      isEnabled: true,
      effectiveFrom: '',
      effectiveTo: '',
      description: '',
    },
  });

  // 加载基础数据
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [apiKeysData, platformsData, strategiesData] = await Promise.all([
          apiService.getApiKeys(),
          apiService.getAvailablePlatforms(),
          apiService.getSelectionStrategies(),
        ]);

        setApiKeys(apiKeysData.map(key => ({ id: key.id, name: key.name })));
        setAvailablePlatforms(platformsData);
        setSelectionStrategies(strategiesData);
      } catch (error) {
        console.error('Failed to load form data:', error);
        showToast('加载表单数据失败', 'error');
      }
    };

    if (isOpen) {
      loadFormData();
    }
  }, [isOpen, showToast]);

  // 编辑模式时初始化表单
  useEffect(() => {
    if (editingPermission && isOpen) {
      form.reset({
        apiKeyId: editingPermission.apiKeyId,
        accountPoolGroup: editingPermission.accountPoolGroup,
        allowedPlatforms: editingPermission.allowedPlatforms,
        allowedAccountIds: editingPermission.allowedAccountIds || [],
        selectionStrategy: editingPermission.selectionStrategy,
        priority: editingPermission.priority,
        isEnabled: editingPermission.isEnabled,
        effectiveFrom: editingPermission.effectiveFrom ? 
          new Date(editingPermission.effectiveFrom).toISOString().slice(0, 16) : '',
        effectiveTo: editingPermission.effectiveTo ? 
          new Date(editingPermission.effectiveTo).toISOString().slice(0, 16) : '',
        description: '',
      });
      
      setSelectedAccounts(editingPermission.allowedAccountIds || []);
      setShowAccountSelection((editingPermission.allowedAccountIds || []).length > 0);
    }
  }, [editingPermission, isOpen, form]);

  // 获取选中池的信息
  const selectedPool = accountPools.find(pool => 
    pool.name === form.watch('accountPoolGroup')
  );

  // 处理表单提交
  const handleSubmit = useCallback(async (data: PermissionFormData) => {
    setIsLoading(true);
    try {
      const requestData: CreatePermissionRequest = {
        ...data,
        allowedAccountIds: showAccountSelection ? selectedAccounts : undefined,
        effectiveFrom: data.effectiveFrom || undefined,
        effectiveTo: data.effectiveTo || undefined,
      };

      if (editingPermission) {
        await apiService.updatePermission(editingPermission.id, requestData);
        showToast('权限规则更新成功', 'success');
      } else {
        await apiService.createPermission(requestData);
        showToast('权限规则创建成功', 'success');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save permission:', error);
      showToast(editingPermission ? '更新权限规则失败' : '创建权限规则失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [editingPermission, showAccountSelection, selectedAccounts, showToast, onSuccess]);

  // 关闭对话框时重置表单
  const handleClose = () => {
    form.reset();
    setSelectedAccounts([]);
    setShowAccountSelection(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {editingPermission ? '编辑权限规则' : '创建权限规则'}
          </DialogTitle>
          <DialogDescription>
            配置API Key对账号池的访问权限和选择策略
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 左侧：基本配置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    基本配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* API Key选择 */}
                  <FormField
                    control={form.control}
                    name="apiKeyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          disabled={!!editingPermission}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择API Key" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {apiKeys.map((key) => (
                              <SelectItem key={key.id} value={key.id}>
                                {key.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          为哪个API Key配置权限
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 账号池选择 */}
                  <FormField
                    control={form.control}
                    name="accountPoolGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>账号池</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择账号池" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountPools.map((pool) => (
                              <SelectItem key={pool.id} value={pool.name}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{pool.name}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {pool.platform} · {pool.totalAccounts}账户
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPool && (
                          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                            <p><strong>描述:</strong> {selectedPool.description}</p>
                            <p><strong>平台:</strong> {selectedPool.platform}</p>
                            <p><strong>总账户:</strong> {selectedPool.totalAccounts} 个</p>
                            <p><strong>健康账户:</strong> {selectedPool.healthyAccounts} 个</p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 平台选择 */}
                  <FormField
                    control={form.control}
                    name="allowedPlatforms"
                    render={() => (
                      <FormItem>
                        <FormLabel>允许的平台</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {availablePlatforms.map((platform) => (
                            <FormField
                              key={platform}
                              control={form.control}
                              name="allowedPlatforms"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(platform)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...(field.value || []), platform]
                                          : (field.value || []).filter(p => p !== platform);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal capitalize">
                                    {platform}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormDescription>
                          选择此API Key可以访问的平台
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 选择策略 */}
                  <FormField
                    control={form.control}
                    name="selectionStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>选择策略</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectionStrategies.map((strategy) => (
                              <SelectItem key={strategy.value} value={strategy.value}>
                                <div>
                                  <div className="font-medium">{strategy.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {strategy.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 优先级 */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优先级 (1-100)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          数字越小优先级越高
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 右侧：高级配置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    高级配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 启用状态 */}
                  <FormField
                    control={form.control}
                    name="isEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>启用规则</FormLabel>
                          <FormDescription>
                            是否立即生效此权限规则
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* 账户限制 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>账户限制</Label>
                      <Switch
                        checked={showAccountSelection}
                        onCheckedChange={setShowAccountSelection}
                      />
                    </div>
                    <FormDescription>
                      启用后可以限制访问池中的特定账户
                    </FormDescription>
                    
                    {showAccountSelection && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <Label className="text-sm">选择允许的账户ID</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedAccounts.map((accountId, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {accountId}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => {
                                  setSelectedAccounts(prev => 
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="输入账户ID"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const value = e.currentTarget.value.trim();
                                if (value && !selectedAccounts.includes(value)) {
                                  setSelectedAccounts(prev => [...prev, value]);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector('input[placeholder="输入账户ID"]') as HTMLInputElement;
                              const value = input?.value.trim();
                              if (value && !selectedAccounts.includes(value)) {
                                setSelectedAccounts(prev => [...prev, value]);
                                input.value = '';
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 时间限制 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Label>时间限制</Label>
                    </div>
                    
                    <div className="grid gap-3">
                      <FormField
                        control={form.control}
                        name="effectiveFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>生效时间</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              留空表示立即生效
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="effectiveTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>过期时间</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              留空表示永不过期
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* 描述 */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>描述 (可选)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="添加权限规则的描述..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          帮助理解此权限规则的用途
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* 预览信息 */}
            {form.watch('apiKeyId') && form.watch('accountPoolGroup') && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    配置预览
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>
                    <strong>API Key:</strong> {apiKeys.find(k => k.id === form.watch('apiKeyId'))?.name}
                  </p>
                  <p>
                    <strong>账号池:</strong> {form.watch('accountPoolGroup')}
                  </p>
                  <p>
                    <strong>平台:</strong> {form.watch('allowedPlatforms')?.join(', ')}
                  </p>
                  <p>
                    <strong>选择策略:</strong> {selectionStrategies.find(s => s.value === form.watch('selectionStrategy'))?.label}
                  </p>
                  <p>
                    <strong>优先级:</strong> {form.watch('priority')}
                  </p>
                  {selectedAccounts.length > 0 && (
                    <p>
                      <strong>限制账户:</strong> {selectedAccounts.length} 个
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '保存中...' : (editingPermission ? '更新' : '创建')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  XCircle, 
  Loader2,
  Users,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Info
} from 'lucide-react';
import type { ApiKeyGroup, BatchOperation, BatchOperationResult } from '@/types/apiKeyGroups';
import { useBatchOperation } from '@/hooks/useGroupRealtime';

interface BatchOperationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: BatchOperation;
  groups: ApiKeyGroup[];
  onConfirm: (operation: BatchOperation) => Promise<BatchOperationResult>;
}



// 操作类型配置
const OPERATION_CONFIG = {
  enable: {
    title: '启用分组',
    description: '启用选中的分组，使其可以处理请求',
    icon: Play,
    color: 'text-green-600',
    confirmText: '启用',
    warningLevel: 'info' as const,
  },
  disable: {
    title: '禁用分组',
    description: '禁用选中的分组，停止处理新请求',
    icon: Pause,
    color: 'text-yellow-600',
    confirmText: '禁用',
    warningLevel: 'warning' as const,
  },
  delete: {
    title: '删除分组',
    description: '永久删除选中的分组及其所有配置',
    icon: Trash2,
    color: 'text-red-600',
    confirmText: '删除',
    warningLevel: 'danger' as const,
  },
  update_priority: {
    title: '更新优先级',
    description: '批量更新选中分组的优先级设置',
    icon: RotateCcw,
    color: 'text-blue-600',
    confirmText: '更新',
    warningLevel: 'info' as const,
  },
  add_tag: {
    title: '添加标签',
    description: '为选中的分组添加指定标签',
    icon: Info,
    color: 'text-purple-600',
    confirmText: '添加',
    warningLevel: 'info' as const,
  },
  remove_tag: {
    title: '移除标签',
    description: '从选中的分组中移除指定标签',
    icon: XCircle,
    color: 'text-orange-600',
    confirmText: '移除',
    warningLevel: 'warning' as const,
  },
};

// 获取警告级别颜色
const getWarningLevelColors = (level: 'info' | 'warning' | 'danger') => {
  switch (level) {
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'danger':
      return 'bg-red-50 border-red-200 text-red-800';
  }
};

// 确认阶段组件
function ConfirmationStage({
  operation,
  groups,
  operationConfig,
  onConfirm,
  onCancel
}: {
  operation: BatchOperation;
  groups: ApiKeyGroup[];
  operationConfig: typeof OPERATION_CONFIG[keyof typeof OPERATION_CONFIG];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const selectedGroups = groups.filter(group => operation.groupIds.includes(group.id));
  const Icon = operationConfig.icon;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${operationConfig.color}`} />
          <span>{operationConfig.title}</span>
        </DialogTitle>
        <DialogDescription>{operationConfig.description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* 警告提示 */}
        <div className={`p-4 rounded-lg border ${getWarningLevelColors(operationConfig.warningLevel)}`}>
          <div className="flex items-start space-x-2">
            {operationConfig.warningLevel === 'danger' ? (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                即将对 {selectedGroups.length} 个分组执行{operationConfig.title.toLowerCase()}操作
              </p>
              {operationConfig.warningLevel === 'danger' && (
                <p className="text-sm mt-1">此操作不可撤销，请仔细确认。</p>
              )}
              {operation.type === 'update_priority' && operation.payload && (
                <p className="text-sm mt-1">
                  新优先级: {operation.payload.priority}
                </p>
              )}
              {(operation.type === 'add_tag' || operation.type === 'remove_tag') && operation.payload && (
                <p className="text-sm mt-1">
                  标签: "{operation.payload.tag}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 选中的分组列表 */}
        <div className="max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>选中的分组 ({selectedGroups.length})</span>
          </h4>
          
          <div className="space-y-2">
            {selectedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    group.isEnabled ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {group.groupType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {group.apiKeyCount} keys
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button
          variant={operationConfig.warningLevel === 'danger' ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          <Icon className="h-4 w-4 mr-2" />
          {operationConfig.confirmText}
        </Button>
      </DialogFooter>
    </>
  );
}

// 进度阶段组件
function ProgressStage({
  operation,
  groups,
  operationConfig,
  progress,
  results,
  isOperating,
  onCancel
}: {
  operation: BatchOperation;
  groups: ApiKeyGroup[];
  operationConfig: typeof OPERATION_CONFIG[keyof typeof OPERATION_CONFIG];
  progress: number;
  results: { success: number; failed: number; errors: string[] };
  isOperating: boolean;
  onCancel: () => void;
}) {
  const Icon = operationConfig.icon;
  const selectedGroups = groups.filter(group => operation.groupIds.includes(group.id));

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          {isOperating ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Icon className={`h-5 w-5 ${operationConfig.color}`} />
          )}
          <span>
            {isOperating ? `正在${operationConfig.title.toLowerCase()}...` : `${operationConfig.title}完成`}
          </span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* 进度条 */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>进度</span>
            <span>{results.success + results.failed}/{selectedGroups.length}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {results.success}
            </div>
            <div className="text-xs text-muted-foreground">成功</div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-semibold text-red-600">
              {results.failed}
            </div>
            <div className="text-xs text-muted-foreground">失败</div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-semibold text-gray-600">
              {selectedGroups.length - results.success - results.failed}
            </div>
            <div className="text-xs text-muted-foreground">待处理</div>
          </div>
        </div>

        {/* 错误列表 */}
        {results.errors.length > 0 && (
          <div className="max-h-40 overflow-y-auto">
            <h4 className="text-sm font-medium mb-2 flex items-center space-x-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>错误详情</span>
            </h4>
            
            <div className="space-y-1">
              {results.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isOperating && (
        <DialogFooter>
          <Button onClick={onCancel}>
            {results.failed > 0 ? '查看详情' : '完成'}
          </Button>
        </DialogFooter>
      )}
    </>
  );
}

// 主批量操作对话框
export default function BatchOperationDialog({
  isOpen,
  onClose,
  operation,
  groups
}: BatchOperationDialogProps & { onClose: () => void }) {
  const [stage, setStage] = useState<'confirm' | 'progress'>('confirm');
  const { isOperating, progress, results, executeBatchOperation, reset } = useBatchOperation();

  const operationConfig = OPERATION_CONFIG[operation.type] || OPERATION_CONFIG.enable;

  useEffect(() => {
    if (!isOpen) {
      setStage('confirm');
      reset();
    }
  }, [isOpen, reset]);

  const handleConfirm = async () => {
    setStage('progress');
    
    try {
      await executeBatchOperation(
        operation.groupIds,
        async (groupId) => {
          // 这里应该调用实际的API
          // 模拟异步操作
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 模拟随机成功/失败
          if (Math.random() > 0.1) {
            return { success: true };
          } else {
            throw new Error(`操作失败: ${groups.find(g => g.id === groupId)?.name}`);
          }
        }
      );
    } catch (error) {
      console.error('Batch operation failed:', error);
    }
  };

  const handleCancel = () => {
    if (stage === 'progress' && !isOperating) {
      // 如果是在结果阶段，可以显示详细结果或直接关闭
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl">
        {stage === 'confirm' ? (
          <ConfirmationStage
            operation={operation}
            groups={groups}
            operationConfig={operationConfig}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        ) : (
          <ProgressStage
            operation={operation}
            groups={groups}
            operationConfig={operationConfig}
            progress={progress}
            results={results}
            isOperating={isOperating}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// 批量操作触发器Hook
export function useBatchOperationDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    operation: BatchOperation;
    groups: ApiKeyGroup[];
    onConfirm: (operation: BatchOperation) => Promise<BatchOperationResult>;
  } | null>(null);

  const showDialog = (
    operation: BatchOperation,
    groups: ApiKeyGroup[],
    onConfirm: (operation: BatchOperation) => Promise<BatchOperationResult>
  ) => {
    setDialogState({
      isOpen: true,
      operation,
      groups,
      onConfirm
    });
  };

  const hideDialog = () => {
    setDialogState(null);
  };

  return {
    dialogState,
    showDialog,
    hideDialog
  };
}
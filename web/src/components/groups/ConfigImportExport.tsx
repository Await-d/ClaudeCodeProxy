import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import type { 
  ApiKeyGroup, 
  GroupConfigExport, 
  ImportValidationResult 
} from '@/types/apiKeyGroups';
import { showToast } from '@/utils/toast';
import { exportGroupConfig, validateImportConfig } from '@/utils/groupConfigUtils';

interface ConfigImportExportProps {
  groups: ApiKeyGroup[];
  onImport: (config: GroupConfigExport) => Promise<void>;
  className?: string;
}

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (config: GroupConfigExport) => Promise<void>;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groups: ApiKeyGroup[];
  selectedGroupIds: string[];
  onSelectionChange: (groupIds: string[]) => void;
}



// 导入对话框组件
function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);

    try {
      const text = await file.text();
      const config = JSON.parse(text);
      const result = validateImportConfig(config);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [`文件读取失败: ${error}`],
        warnings: [],
        groupsCount: 0,
        mappingsCount: 0
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !validationResult?.valid) return;

    setImporting(true);
    try {
      const text = await selectedFile.text();
      const config = JSON.parse(text);
      await onImport(config);
      onClose();
      showToast('配置导入成功', 'success');
    } catch (error: any) {
      showToast(error.message || '导入失败', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setValidationResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>导入分组配置</span>
          </DialogTitle>
          <DialogDescription>
            选择一个配置文件来导入API Key分组设置
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件选择 */}
          <div>
            <Label htmlFor="config-file">选择配置文件</Label>
            <input
              id="config-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80 mt-2"
            />
          </div>

          {/* 验证结果 */}
          {validationResult && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center space-x-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>验证结果</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">分组数量:</span>
                      <Badge variant="secondary" className="ml-2">
                        {validationResult.groupsCount}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">映射数量:</span>
                      <Badge variant="secondary" className="ml-2">
                        {validationResult.mappingsCount}
                      </Badge>
                    </div>
                  </div>

                  {/* 错误信息 */}
                  {validationResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-red-700">错误</span>
                      </div>
                      <ul className="text-sm text-red-600 space-y-1">
                        {validationResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 警告信息 */}
                  {validationResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-yellow-700">警告</span>
                      </div>
                      <ul className="text-sm text-yellow-600 space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 成功信息 */}
                  {validationResult.valid && validationResult.errors.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">配置文件验证通过，可以导入</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!validationResult?.valid || importing}
          >
            {importing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
            导入配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 导出对话框组件
function ExportDialog({ 
  isOpen, 
  onClose, 
  groups, 
  selectedGroupIds, 
  onSelectionChange 
}: ExportDialogProps) {
  const handleExport = () => {
    const selectedGroups = groups.filter(group => selectedGroupIds.includes(group.id));
    
    if (selectedGroups.length === 0) {
      showToast('请选择要导出的分组', 'error');
      return;
    }

    const config = exportGroupConfig(selectedGroups);
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `api-key-groups-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showToast(`成功导出 ${selectedGroups.length} 个分组配置`, 'success');
    onClose();
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      onSelectionChange(selectedGroupIds.filter(id => id !== groupId));
    } else {
      onSelectionChange([...selectedGroupIds, groupId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(groups.map(g => g.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>导出分组配置</span>
          </DialogTitle>
          <DialogDescription>
            选择要导出的API Key分组，配置将保存为JSON文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 选择操作 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedGroupIds.length} / {groups.length} 个分组
              </span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                全选
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                取消全选
              </Button>
            </div>
          </div>

          {/* 分组列表 */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {groups.map(group => (
              <Card 
                key={group.id}
                className={`cursor-pointer transition-colors ${
                  selectedGroupIds.includes(group.id) 
                    ? 'bg-primary/5 border-primary' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => toggleGroup(group.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{group.name}</span>
                        <Badge variant={group.isEnabled ? 'default' : 'secondary'} className="text-xs">
                          {group.isEnabled ? '启用' : '禁用'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {group.groupType}
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                        <span>优先级: {group.priority}</span>
                        <span>API Keys: {group.apiKeyCount}</span>
                        <span>策略: {group.loadBalanceStrategy}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2" />
              <p>暂无分组可导出</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={selectedGroupIds.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            导出配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 主导入导出组件
export default function ConfigImportExport({ 
  groups, 
  onImport, 
  className = '' 
}: ConfigImportExportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  const handleShowExport = () => {
    // 默认选择所有分组
    setSelectedGroupIds(groups.map(g => g.id));
    setShowExportDialog(true);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant="outline"
        onClick={() => setShowImportDialog(true)}
        className="flex items-center space-x-2"
      >
        <Upload className="h-4 w-4" />
        <span>导入配置</span>
      </Button>

      <Button
        variant="outline"
        onClick={handleShowExport}
        disabled={groups.length === 0}
        className="flex items-center space-x-2"
      >
        <Download className="h-4 w-4" />
        <span>导出配置</span>
      </Button>

      {/* 对话框组件 */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={onImport}
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        groups={groups}
        selectedGroupIds={selectedGroupIds}
        onSelectionChange={setSelectedGroupIds}
      />
    </div>
  );
}
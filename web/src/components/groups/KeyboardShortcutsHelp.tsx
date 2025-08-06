import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Keyboard, 
  Navigation, 
  Mouse, 
  Settings, 
  Search,
  FileText,
  Download,
  Plus
} from 'lucide-react';
import { 
  SHORTCUTS, 
  SHORTCUT_DESCRIPTIONS,
  formatShortcut,
  getPlatformShortcut 
} from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

// 快捷键分组
const SHORTCUT_GROUPS = [
  {
    title: '全局操作',
    icon: Settings,
    shortcuts: [
      { key: SHORTCUTS.NEW_GROUP, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.NEW_GROUP] },
      { key: SHORTCUTS.SEARCH, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.SEARCH] },
      { key: SHORTCUTS.REFRESH, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.REFRESH] },
      { key: SHORTCUTS.HELP, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.HELP] },
      { key: SHORTCUTS.ESCAPE, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.ESCAPE] },
    ]
  },
  {
    title: '分组操作',
    icon: Mouse,
    shortcuts: [
      { key: SHORTCUTS.ENABLE_DISABLE, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.ENABLE_DISABLE] },
      { key: SHORTCUTS.DELETE, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.DELETE] },
      { key: SHORTCUTS.EDIT, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.EDIT] },
      { key: SHORTCUTS.DUPLICATE, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.DUPLICATE] },
    ]
  },
  {
    title: '导航操作',
    icon: Navigation,
    shortcuts: [
      { key: SHORTCUTS.UP, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.UP] },
      { key: SHORTCUTS.DOWN, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.DOWN] },
      { key: SHORTCUTS.FIRST, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.FIRST] },
      { key: SHORTCUTS.LAST, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.LAST] },
      { key: SHORTCUTS.PAGE_UP, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.PAGE_UP] },
      { key: SHORTCUTS.PAGE_DOWN, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.PAGE_DOWN] },
    ]
  },
  {
    title: '选择操作',
    icon: Plus,
    shortcuts: [
      { key: SHORTCUTS.SELECT_ALL, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.SELECT_ALL] },
      { key: SHORTCUTS.SELECT_NONE, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.SELECT_NONE] },
      { key: SHORTCUTS.INVERT_SELECTION, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.INVERT_SELECTION] },
    ]
  },
  {
    title: '导入导出',
    icon: Download,
    shortcuts: [
      { key: SHORTCUTS.IMPORT, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.IMPORT] },
      { key: SHORTCUTS.EXPORT, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.EXPORT] },
    ]
  },
  {
    title: '其他功能',
    icon: FileText,
    shortcuts: [
      { key: SHORTCUTS.TEMPLATE_MANAGER, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.TEMPLATE_MANAGER] },
      { key: SHORTCUTS.TOGGLE_VIEW, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.TOGGLE_VIEW] },
      { key: SHORTCUTS.ZOOM_IN, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.ZOOM_IN] },
      { key: SHORTCUTS.ZOOM_OUT, description: SHORTCUT_DESCRIPTIONS[SHORTCUTS.ZOOM_OUT] },
    ]
  }
];

// 单个快捷键组件
function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  const platformShortcut = getPlatformShortcut(shortcut);
  const formattedShortcut = formatShortcut(platformShortcut);
  
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 transition-colors">
      <span className="text-sm text-muted-foreground">{description}</span>
      <Badge variant="outline" className="font-mono text-xs">
        {formattedShortcut}
      </Badge>
    </div>
  );
}

// 快捷键分组组件
function ShortcutGroup({ 
  title, 
  icon: Icon, 
  shortcuts 
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: { key: string; description: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Icon className="h-4 w-4 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {shortcuts.map((shortcut) => (
            <ShortcutItem
              key={shortcut.key}
              shortcut={shortcut.key}
              description={shortcut.description}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 主帮助对话框组件
export default function KeyboardShortcutsHelp({
  isOpen,
  onClose
}: KeyboardShortcutsHelpProps) {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>键盘快捷键</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 平台提示 */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              当前平台: <strong>{isMac ? 'macOS' : 'Windows/Linux'}</strong>
              {isMac && (
                <span className="ml-2">
                  (⌘ = Command键, Ctrl = Control键)
                </span>
              )}
            </p>
          </div>

          {/* 快捷键分组 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHORTCUT_GROUPS.map((group) => (
              <ShortcutGroup
                key={group.title}
                title={group.title}
                icon={group.icon}
                shortcuts={group.shortcuts}
              />
            ))}
          </div>

          {/* 使用提示 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Search className="h-4 w-4 text-primary" />
                <span>使用提示</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>在输入框中使用快捷键时，某些快捷键可能不可用</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>使用 <Badge variant="outline" className="mx-1 text-xs">Esc</Badge> 键可以取消大多数操作</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>列表导航快捷键在选中项目时最有效</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>某些快捷键在不同上下文中可能有不同的行为</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-primary">•</span>
                  <span>按 <Badge variant="outline" className="mx-1 text-xs">{formatShortcut(getPlatformShortcut(SHORTCUTS.HELP))}</Badge> 随时查看此帮助</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
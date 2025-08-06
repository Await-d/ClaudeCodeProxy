import { useEffect, useCallback, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { showToast } from '@/utils/toast';

// 快捷键配置
export const SHORTCUTS = {
  // 全局快捷键
  NEW_GROUP: 'ctrl+n, cmd+n',
  SEARCH: 'ctrl+f, cmd+f, /',
  REFRESH: 'f5, ctrl+r, cmd+r',
  HELP: 'f1, ?',
  ESCAPE: 'esc',
  
  // 分组操作
  ENABLE_DISABLE: 'space',
  DELETE: 'del, backspace',
  EDIT: 'enter, f2',
  DUPLICATE: 'ctrl+d, cmd+d',
  
  // 列表导航
  UP: 'up, k',
  DOWN: 'down, j',
  FIRST: 'home, ctrl+up, cmd+up',
  LAST: 'end, ctrl+down, cmd+down',
  PAGE_UP: 'pageup, ctrl+u, cmd+u',
  PAGE_DOWN: 'pagedown, ctrl+d, cmd+d',
  
  // 批量操作
  SELECT_ALL: 'ctrl+a, cmd+a',
  SELECT_NONE: 'ctrl+shift+a, cmd+shift+a',
  INVERT_SELECTION: 'ctrl+i, cmd+i',
  
  // 导入导出
  IMPORT: 'ctrl+o, cmd+o',
  EXPORT: 'ctrl+s, cmd+s',
  
  // 模板
  TEMPLATE_MANAGER: 'ctrl+t, cmd+t',
  
  // 视图切换
  TOGGLE_VIEW: 'ctrl+shift+v, cmd+shift+v',
  ZOOM_IN: 'ctrl+=, cmd+=',
  ZOOM_OUT: 'ctrl+-, cmd+-',
} as const;

// 快捷键描述
export const SHORTCUT_DESCRIPTIONS = {
  [SHORTCUTS.NEW_GROUP]: '创建新分组',
  [SHORTCUTS.SEARCH]: '搜索分组',
  [SHORTCUTS.REFRESH]: '刷新数据',
  [SHORTCUTS.HELP]: '显示帮助',
  [SHORTCUTS.ESCAPE]: '取消/关闭',
  [SHORTCUTS.ENABLE_DISABLE]: '启用/禁用分组',
  [SHORTCUTS.DELETE]: '删除分组',
  [SHORTCUTS.EDIT]: '编辑分组',
  [SHORTCUTS.DUPLICATE]: '复制分组',
  [SHORTCUTS.UP]: '向上选择',
  [SHORTCUTS.DOWN]: '向下选择',
  [SHORTCUTS.FIRST]: '选择第一个',
  [SHORTCUTS.LAST]: '选择最后一个',
  [SHORTCUTS.PAGE_UP]: '向上翻页',
  [SHORTCUTS.PAGE_DOWN]: '向下翻页',
  [SHORTCUTS.SELECT_ALL]: '全选',
  [SHORTCUTS.SELECT_NONE]: '取消选择',
  [SHORTCUTS.INVERT_SELECTION]: '反选',
  [SHORTCUTS.IMPORT]: '导入配置',
  [SHORTCUTS.EXPORT]: '导出配置',
  [SHORTCUTS.TEMPLATE_MANAGER]: '模板管理',
  [SHORTCUTS.TOGGLE_VIEW]: '切换视图',
  [SHORTCUTS.ZOOM_IN]: '放大',
  [SHORTCUTS.ZOOM_OUT]: '缩小',
} as const;

// 键盘快捷键Hook的选项接口
interface UseKeyboardShortcutsOptions {
  onNewGroup?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
  onEnableDisable?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  onInvertSelection?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onTemplateManager?: () => void;
  onToggleView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

// 主键盘快捷键Hook
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const {
    onNewGroup,
    onSearch,
    onRefresh,
    onHelp,
    onEscape,
    onEnableDisable,
    onDelete,
    onEdit,
    onDuplicate,
    onUp,
    onDown,
    onFirst,
    onLast,
    onPageUp,
    onPageDown,
    onSelectAll,
    onSelectNone,
    onInvertSelection,
    onImport,
    onExport,
    onTemplateManager,
    onToggleView,
    onZoomIn,
    onZoomOut,
    enabled = true,
    preventDefault = true
  } = options;

  const hotkeyOptions = useMemo(() => ({
    enabled,
    preventDefault,
    enableOnContentEditable: false,
    enableOnFormTags: false,
  }), [enabled, preventDefault]);

  // 全局快捷键
  useHotkeys(SHORTCUTS.NEW_GROUP, useCallback(() => {
    onNewGroup?.();
    showToast('快捷键: 创建新分组', 'info');
  }, [onNewGroup]), hotkeyOptions);

  useHotkeys(SHORTCUTS.SEARCH, useCallback(() => {
    onSearch?.();
    showToast('快捷键: 搜索分组', 'info');
  }, [onSearch]), hotkeyOptions);

  useHotkeys(SHORTCUTS.REFRESH, useCallback(() => {
    onRefresh?.();
    showToast('快捷键: 刷新数据', 'info');
  }, [onRefresh]), hotkeyOptions);

  useHotkeys(SHORTCUTS.HELP, useCallback(() => {
    onHelp?.();
  }, [onHelp]), hotkeyOptions);

  useHotkeys(SHORTCUTS.ESCAPE, useCallback(() => {
    onEscape?.();
  }, [onEscape]), hotkeyOptions);

  // 分组操作快捷键
  useHotkeys(SHORTCUTS.ENABLE_DISABLE, useCallback(() => {
    onEnableDisable?.();
    showToast('快捷键: 切换启用状态', 'info');
  }, [onEnableDisable]), hotkeyOptions);

  useHotkeys(SHORTCUTS.DELETE, useCallback(() => {
    onDelete?.();
  }, [onDelete]), hotkeyOptions);

  useHotkeys(SHORTCUTS.EDIT, useCallback(() => {
    onEdit?.();
  }, [onEdit]), hotkeyOptions);

  useHotkeys(SHORTCUTS.DUPLICATE, useCallback(() => {
    onDuplicate?.();
    showToast('快捷键: 复制分组', 'info');
  }, [onDuplicate]), hotkeyOptions);

  // 导航快捷键
  useHotkeys(SHORTCUTS.UP, useCallback(() => {
    onUp?.();
  }, [onUp]), hotkeyOptions);

  useHotkeys(SHORTCUTS.DOWN, useCallback(() => {
    onDown?.();
  }, [onDown]), hotkeyOptions);

  useHotkeys(SHORTCUTS.FIRST, useCallback(() => {
    onFirst?.();
    showToast('快捷键: 选择第一个', 'info');
  }, [onFirst]), hotkeyOptions);

  useHotkeys(SHORTCUTS.LAST, useCallback(() => {
    onLast?.();
    showToast('快捷键: 选择最后一个', 'info');
  }, [onLast]), hotkeyOptions);

  useHotkeys(SHORTCUTS.PAGE_UP, useCallback(() => {
    onPageUp?.();
  }, [onPageUp]), hotkeyOptions);

  useHotkeys(SHORTCUTS.PAGE_DOWN, useCallback(() => {
    onPageDown?.();
  }, [onPageDown]), hotkeyOptions);

  // 选择快捷键
  useHotkeys(SHORTCUTS.SELECT_ALL, useCallback(() => {
    onSelectAll?.();
    showToast('快捷键: 全选', 'info');
  }, [onSelectAll]), hotkeyOptions);

  useHotkeys(SHORTCUTS.SELECT_NONE, useCallback(() => {
    onSelectNone?.();
    showToast('快捷键: 取消选择', 'info');
  }, [onSelectNone]), hotkeyOptions);

  useHotkeys(SHORTCUTS.INVERT_SELECTION, useCallback(() => {
    onInvertSelection?.();
    showToast('快捷键: 反选', 'info');
  }, [onInvertSelection]), hotkeyOptions);

  // 导入导出快捷键
  useHotkeys(SHORTCUTS.IMPORT, useCallback(() => {
    onImport?.();
    showToast('快捷键: 导入配置', 'info');
  }, [onImport]), hotkeyOptions);

  useHotkeys(SHORTCUTS.EXPORT, useCallback(() => {
    onExport?.();
    showToast('快捷键: 导出配置', 'info');
  }, [onExport]), hotkeyOptions);

  // 其他功能快捷键
  useHotkeys(SHORTCUTS.TEMPLATE_MANAGER, useCallback(() => {
    onTemplateManager?.();
    showToast('快捷键: 模板管理', 'info');
  }, [onTemplateManager]), hotkeyOptions);

  useHotkeys(SHORTCUTS.TOGGLE_VIEW, useCallback(() => {
    onToggleView?.();
    showToast('快捷键: 切换视图', 'info');
  }, [onToggleView]), hotkeyOptions);

  useHotkeys(SHORTCUTS.ZOOM_IN, useCallback(() => {
    onZoomIn?.();
    showToast('快捷键: 放大', 'info');
  }, [onZoomIn]), hotkeyOptions);

  useHotkeys(SHORTCUTS.ZOOM_OUT, useCallback(() => {
    onZoomOut?.();
    showToast('快捷键: 缩小', 'info');
  }, [onZoomOut]), hotkeyOptions);
}

// 列表导航Hook
export function useListNavigation<T>(
  items: T[],
  options: {
    onSelect?: (item: T, index: number) => void;
    onActivate?: (item: T, index: number) => void;
    enabled?: boolean;
    loop?: boolean;
  } = {}
) {
  const { onSelect, onActivate, enabled = true, loop = true } = options;
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const selectNext = useCallback(() => {
    if (!items.length) return;
    
    setSelectedIndex(prev => {
      const next = loop ? (prev + 1) % items.length : Math.min(prev + 1, items.length - 1);
      onSelect?.(items[next], next);
      return next;
    });
  }, [items, onSelect, loop]);

  const selectPrevious = useCallback(() => {
    if (!items.length) return;
    
    setSelectedIndex(prev => {
      const next = loop 
        ? prev <= 0 ? items.length - 1 : prev - 1
        : Math.max(prev - 1, 0);
      onSelect?.(items[next], next);
      return next;
    });
  }, [items, onSelect, loop]);

  const selectFirst = useCallback(() => {
    if (!items.length) return;
    
    setSelectedIndex(0);
    onSelect?.(items[0], 0);
  }, [items, onSelect]);

  const selectLast = useCallback(() => {
    if (!items.length) return;
    
    const lastIndex = items.length - 1;
    setSelectedIndex(lastIndex);
    onSelect?.(items[lastIndex], lastIndex);
  }, [items, onSelect]);

  const activateSelected = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      onActivate?.(items[selectedIndex], selectedIndex);
    }
  }, [items, selectedIndex, onActivate]);

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  // 键盘事件处理
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在没有焦点在输入元素时处理
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || 
          activeElement?.tagName === 'TEXTAREA' || 
          activeElement?.getAttribute('contenteditable') === 'true') {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
        case 'j':
          event.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
        case 'k':
          event.preventDefault();
          selectPrevious();
          break;
        case 'Home':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            selectFirst();
          }
          break;
        case 'End':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            selectLast();
          }
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            event.preventDefault();
            activateSelected();
          }
          break;
        case 'Escape':
          resetSelection();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, selectNext, selectPrevious, selectFirst, selectLast, activateSelected, resetSelection, selectedIndex]);

  return {
    selectedIndex,
    selectedItem: selectedIndex >= 0 && selectedIndex < items.length ? items[selectedIndex] : null,
    selectNext,
    selectPrevious,
    selectFirst,
    selectLast,
    activateSelected,
    resetSelection,
    setSelectedIndex,
  };
}

// 快捷键帮助Hook
export function useShortcutHelp() {
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  const showHelp = useCallback(() => {
    setIsHelpVisible(true);
  }, []);

  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
  }, []);

  const toggleHelp = useCallback(() => {
    setIsHelpVisible(prev => !prev);
  }, []);

  // 帮助快捷键
  useHotkeys(SHORTCUTS.HELP, showHelp, { enableOnContentEditable: false, enableOnFormTags: false });
  useHotkeys(SHORTCUTS.ESCAPE, hideHelp, { 
    enabled: isHelpVisible,
    enableOnContentEditable: true, 
    enableOnFormTags: true 
  });

  return {
    isHelpVisible,
    showHelp,
    hideHelp,
    toggleHelp,
  };
}

// 搜索快捷键Hook
export function useSearchShortcut(onFocus: () => void) {
  useHotkeys(SHORTCUTS.SEARCH, useCallback((event) => {
    event.preventDefault();
    onFocus();
  }, [onFocus]), {
    enableOnContentEditable: false,
    enableOnFormTags: false,
  });
}

// 格式化快捷键显示文本
export function formatShortcut(shortcut: string): string {
  return shortcut
    .split(', ')[0] // 取第一个快捷键
    .replace('ctrl', 'Ctrl')
    .replace('cmd', '⌘')
    .replace('shift', 'Shift')
    .replace('alt', 'Alt')
    .replace('+', ' + ')
    .toUpperCase();
}

// 获取当前平台的快捷键
export function getPlatformShortcut(shortcut: string): string {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcuts = shortcut.split(', ');
  
  if (isMac) {
    // 优先选择cmd快捷键
    const macShortcut = shortcuts.find(s => s.includes('cmd'));
    return macShortcut || shortcuts[0];
  } else {
    // 优先选择ctrl快捷键
    const winShortcut = shortcuts.find(s => s.includes('ctrl'));
    return winShortcut || shortcuts[0];
  }
}

// 导入useState
import { useState } from 'react';
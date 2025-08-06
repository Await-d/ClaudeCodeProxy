import type { 
  ApiKeyGroup, 
  GroupConfigExport, 
  ImportValidationResult 
} from '@/types/apiKeyGroups';

// 分组配置导出函数
export const exportGroupConfig = (groups: ApiKeyGroup[]): GroupConfigExport => {
  const exportData: GroupConfigExport = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    groups: groups.map(group => ({
      name: group.name,
      description: group.description,
      groupType: group.groupType,
      priority: group.priority,
      loadBalanceStrategy: group.loadBalanceStrategy,
      failoverStrategy: group.failoverStrategy,
      tags: group.tags,
      groupCostLimit: group.groupCostLimit,
      groupRequestLimit: group.groupRequestLimit,
      // 注意: 这里不包含敏感的API Key信息，只导出配置
      mappings: [] // 可以在实际实现中包含映射信息（不含实际密钥）
    }))
  };
  
  return exportData;
};

// 配置导入验证函数
export const validateImportConfig = (config: any): ImportValidationResult => {
  const result: ImportValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    groupsCount: 0,
    mappingsCount: 0
  };

  try {
    // 检查基本结构
    if (!config || typeof config !== 'object') {
      result.valid = false;
      result.errors.push('配置文件格式无效');
      return result;
    }

    if (!config.version || !config.groups) {
      result.valid = false;
      result.errors.push('配置文件缺少必要字段');
      return result;
    }

    if (!Array.isArray(config.groups)) {
      result.valid = false;
      result.errors.push('groups 字段必须是数组');
      return result;
    }

    result.groupsCount = config.groups.length;

    // 验证版本兼容性
    if (config.version !== '1.0.0') {
      result.warnings.push(`配置文件版本 ${config.version} 可能不完全兼容`);
    }

    // 验证每个分组配置
    config.groups.forEach((group: any, index: number) => {
      const groupPrefix = `分组 ${index + 1}`;

      if (!group.name || typeof group.name !== 'string') {
        result.errors.push(`${groupPrefix}: 缺少有效的名称`);
        result.valid = false;
      }

      if (group.priority && (typeof group.priority !== 'number' || group.priority < 1 || group.priority > 100)) {
        result.warnings.push(`${groupPrefix}: 优先级应该在1-100之间`);
      }

      const validStrategies = ['round_robin', 'weighted', 'least_connections', 'random'];
      if (group.loadBalanceStrategy && !validStrategies.includes(group.loadBalanceStrategy)) {
        result.warnings.push(`${groupPrefix}: 不支持的负载均衡策略 ${group.loadBalanceStrategy}`);
      }

      const validFailoverStrategies = ['failover', 'failfast', 'circuit_breaker'];
      if (group.failoverStrategy && !validFailoverStrategies.includes(group.failoverStrategy)) {
        result.warnings.push(`${groupPrefix}: 不支持的故障转移策略 ${group.failoverStrategy}`);
      }

      if (group.mappings && Array.isArray(group.mappings)) {
        result.mappingsCount += group.mappings.length;
      }
    });

    // 检查重复的分组名称
    const groupNames = config.groups.map((g: any) => g.name).filter(Boolean);
    const duplicateNames = groupNames.filter((name: string, index: number) => 
      groupNames.indexOf(name) !== index
    );
    
    if (duplicateNames.length > 0) {
      result.errors.push(`发现重复的分组名称: ${duplicateNames.join(', ')}`);
      result.valid = false;
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(`配置文件解析失败: ${error}`);
  }

  return result;
};
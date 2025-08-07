// 权限管理相关类型定义

export interface ApiKeyAccountPermission {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  accountPoolGroup: string;
  allowedPlatforms: string[];
  allowedAccountIds?: string[];
  selectionStrategy: 'priority' | 'round_robin' | 'random' | 'performance';
  priority: number;
  isEnabled: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联数据
  apiKey?: ApiKey;
}

export interface AccountPool {
  id: string;
  name: string;
  description?: string;
  platform: string;
  totalAccounts: number;
  activeAccounts: number;
  healthyAccounts: number;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  
  // 统计信息
  usage?: {
    requestCount: number;
    successRate: number;
    averageResponseTime: number;
    lastUsedAt?: string;
  };
}

export interface Account {
  id: string;
  name: string;
  platform: string;
  poolGroup: string;
  isEnabled: boolean;
  isHealthy: boolean;
  priority: number;
  tags?: string[];
  
  // 使用统计
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsedAt?: string;
  
  // 时间信息
  createdAt: string;
  updatedAt?: string;
  lastHealthCheckAt?: string;
}

export interface PermissionRule {
  id: string;
  apiKeyId: string;
  accountPoolGroup: string;
  allowedPlatforms: string[];
  allowedAccountIds?: string[];
  selectionStrategy: string;
  priority: number;
  isEnabled: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  
  // 扩展信息
  description?: string;
  tags?: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  type: 'time_range' | 'ip_whitelist' | 'usage_limit' | 'cost_limit';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  description?: string;
}

export interface PermissionOverview {
  apiKeyId: string;
  apiKeyName: string;
  totalRules: number;
  enabledRules: number;
  accessiblePools: number;
  accessibleAccounts: number;
  lastUsedAt?: string;
  
  // 权限状态
  status: 'active' | 'inactive' | 'expired' | 'restricted';
  
  // 使用统计
  usage: {
    requestCount: number;
    successRate: number;
    totalCost: number;
    averageResponseTime: number;
  };
  
  // 权限分布
  platformDistribution: { [platform: string]: number };
  poolDistribution: { [pool: string]: number };
}

// 创建和更新请求类型
export interface CreatePermissionRequest {
  apiKeyId: string;
  accountPoolGroup: string;
  allowedPlatforms: string[];
  allowedAccountIds?: string[];
  selectionStrategy?: string;
  priority?: number;
  isEnabled?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  description?: string;
  tags?: string[];
}

export interface UpdatePermissionRequest {
  allowedPlatforms?: string[];
  allowedAccountIds?: string[];
  selectionStrategy?: string;
  priority?: number;
  isEnabled?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  description?: string;
  tags?: string[];
}

export interface BatchPermissionRequest {
  apiKeyId: string;
  permissions: CreatePermissionRequest[];
}

// 权限验证相关
export interface PermissionCheck {
  apiKeyId: string;
  platform: string;
  accountId?: string;
  hasAccess: boolean;
  reason?: string;
  recommendedAccount?: Account;
}

export interface PermissionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// 权限分析相关
export interface PermissionAnalysis {
  apiKeyId: string;
  
  // 覆盖率分析
  coverage: {
    totalPlatforms: number;
    coveredPlatforms: number;
    totalPools: number;
    coveredPools: number;
    coverageScore: number; // 0-100
  };
  
  // 权限健康度
  health: {
    activeRules: number;
    expiredRules: number;
    conflictingRules: number;
    healthScore: number; // 0-100
  };
  
  // 使用效率
  efficiency: {
    utilizationRate: number; // 0-100
    redundantRules: number;
    underutilizedPools: string[];
    recommendations: string[];
  };
  
  // 安全风险
  security: {
    overPrivilegedRules: number;
    wildcardUsage: number;
    riskScore: number; // 0-100
    riskFactors: string[];
  };
}

// 权限模板相关
export interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'basic' | 'advanced' | 'enterprise' | 'custom';
  isSystemTemplate: boolean;
  
  // 模板配置
  config: {
    platforms: string[];
    poolGroups: string[];
    selectionStrategy: string;
    priority: number;
    restrictions?: {
      timeRange?: { start: string; end: string };
      costLimit?: number;
      requestLimit?: number;
    };
  };
  
  // 使用统计
  usage: {
    appliedCount: number;
    lastUsedAt?: string;
  };
  
  createdAt: string;
  updatedAt?: string;
}

// 批量操作相关
export interface BatchPermissionOperation {
  type: 'enable' | 'disable' | 'delete' | 'update_priority' | 'apply_template';
  permissionIds: string[];
  payload?: Record<string, any>;
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: { id: string; error: string }[];
  warnings: string[];
}

// 权限导入导出
export interface PermissionExport {
  version: string;
  exportedAt: string;
  permissions: {
    apiKeyName: string;
    rules: Omit<PermissionRule, 'id' | 'apiKeyId' | 'createdAt' | 'updatedAt'>[];
  }[];
}

// 实时权限更新
export interface PermissionRealtimeUpdate {
  type: 'permission_added' | 'permission_updated' | 'permission_deleted' | 'account_status_changed';
  apiKeyId?: string;
  permissionId?: string;
  data: Record<string, any>;
  timestamp: string;
}

// API 响应类型
export interface PermissionResponse {
  data: ApiKeyAccountPermission[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface AccountPoolResponse {
  data: AccountPool[];
  total: number;
}

export interface PermissionOverviewResponse {
  data: PermissionOverview[];
  total: number;
}

// 过滤和搜索参数
export interface PermissionFilterParams {
  search?: string;
  apiKeyId?: string;
  platform?: string;
  poolGroup?: string;
  isEnabled?: boolean;
  status?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// 错误处理
export interface PermissionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  permissionId?: string;
}

// 从其他文件引入的类型（避免循环依赖）
export interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  description?: string;
  isEnabled: boolean;
  service: string;
  tags?: string[];
  totalUsageCount: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}
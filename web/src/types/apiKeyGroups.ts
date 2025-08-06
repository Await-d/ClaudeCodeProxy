// API Key分组相关类型定义

export interface ApiKeyGroup {
  id: string;
  name: string;
  description?: string;
  groupType: 'system' | 'custom' | 'template';
  priority: number;
  isEnabled: boolean;
  loadBalanceStrategy: 'round_robin' | 'weighted' | 'least_connections' | 'random';
  failoverStrategy: 'failover' | 'failfast' | 'circuit_breaker';
  tags?: string[];
  
  // 统计信息
  apiKeyCount: number;
  healthyApiKeyCount: number;
  healthStatus: 'healthy' | 'unhealthy' | 'warning' | 'unknown';
  
  // 限制设置
  groupCostLimit?: number;
  groupRequestLimit?: number;
  
  // 时间信息
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
  lastHealthCheckAt?: string;
  
  // 统计数据
  statistics?: GroupStatistics;
  
  // 配置相关
  currentRoundRobinIndex?: number;
}

export interface GroupStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalCost: number;
  averageResponseTime: number;
  currentConcurrentConnections: number;
  lastUsedAt?: string;
}

export interface ApiKeyGroupMapping {
  id: string;
  groupId: string;
  apiKeyId: string;
  weight: number;
  order: number;
  isPrimary: boolean;
  isEnabled: boolean;
  
  // 健康状态
  healthStatus: 'healthy' | 'unhealthy' | 'warning';
  lastHealthCheckAt?: string;
  disabledUntil?: string;
  
  // 统计信息
  totalUsageCount: number;
  successfulRequests: number;
  failedRequests: number;
  consecutiveFailures: number;
  averageResponseTime: number;
  currentConnections: number;
  
  // 时间信息
  createdAt: string;
  updatedAt?: string;
  lastUsedAt?: string;
  
  // 关联数据
  apiKey?: ApiKey;
  group?: ApiKeyGroup;
}

export interface GroupTemplate {
  id: string;
  name: string;
  description?: string;
  config: {
    groupType: string;
    priority: number;
    loadBalanceStrategy: string;
    failoverStrategy: string;
    tags?: string[];
    groupCostLimit?: number;
    groupRequestLimit?: number;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface GroupUsageInfo {
  requestUsage: number; // 0-100
  costUsage: number; // 0-100
  healthScore: number; // 0-100
  performanceScore: number; // 0-100
}

export interface GroupOverviewInfo {
  id: string;
  name: string;
  description?: string;
  groupType: string;
  priority: number;
  isEnabled: boolean;
  healthStatus: string;
  apiKeyCount: number;
  healthyApiKeyCount: number;
  loadBalanceStrategy: string;
  usage?: GroupUsageInfo;
  createdAt: string;
  lastUsedAt?: string;
  lastHealthCheckAt?: string;
}

// 创建和更新请求类型
export interface CreateApiKeyGroupRequest {
  name: string;
  description?: string;
  groupType?: string;
  priority?: number;
  loadBalanceStrategy?: string;
  failoverStrategy?: string;
  tags?: string[];
  groupCostLimit?: number;
  groupRequestLimit?: number;
}

export interface UpdateApiKeyGroupRequest {
  name?: string;
  description?: string;
  priority?: number;
  loadBalanceStrategy?: string;
  failoverStrategy?: string;
  tags?: string[];
  groupCostLimit?: number;
  groupRequestLimit?: number;
}

export interface AddApiKeyToGroupRequest {
  groupId: string;
  apiKeyId: string;
  weight?: number;
  order?: number;
  isPrimary?: boolean;
}

export interface UpdateApiKeyMappingRequest {
  weight?: number;
  order?: number;
  isPrimary?: boolean;
}

// 分组分析相关类型
export interface GroupAnalysisData {
  groupId: string;
  groupName: string;
  performanceMetrics: {
    averageResponseTime: number;
    successRate: number;
    throughput: number;
    availability: number;
  };
  costMetrics: {
    totalCost: number;
    costPerRequest: number;
    costEfficiency: number;
  };
  usagePatterns: {
    peakHours: number[];
    requestDistribution: { [key: string]: number };
    modelUsage: { [key: string]: number };
  };
  healthTrends: {
    timestamp: string;
    healthScore: number;
    activeKeys: number;
  }[];
  recommendations: SystemRecommendation[];
}

export interface SystemRecommendation {
  type: 'performance' | 'cost' | 'security' | 'reliability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action?: string;
  impact?: string;
}

// 批量操作相关类型
export interface BatchOperation {
  type: 'enable' | 'disable' | 'delete' | 'update_priority' | 'add_tag' | 'remove_tag';
  groupIds: string[];
  payload?: Record<string, unknown>;
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

// 导入导出相关类型
export interface GroupConfigExport {
  version: string;
  exportedAt: string;
  groups: {
    name: string;
    description?: string;
    groupType: string;
    priority: number;
    loadBalanceStrategy: string;
    failoverStrategy: string;
    tags?: string[];
    groupCostLimit?: number;
    groupRequestLimit?: number;
    mappings?: {
      apiKeyName: string;
      weight: number;
      order: number;
      isPrimary: boolean;
    }[];
  }[];
}

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  groupsCount: number;
  mappingsCount: number;
}

// 实时更新相关类型
export interface GroupRealtimeUpdate {
  type: 'health_check' | 'statistics' | 'status_change' | 'mapping_change';
  groupId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// API响应类型
export interface ApiKeyGroupResponse {
  data: ApiKeyGroup[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ApiKeyGroupMappingResponse {
  data: ApiKeyGroupMapping[];
  total: number;
}

export interface GroupHealthCheckResponse {
  groupId: string;
  isHealthy: boolean;
  healthyKeysCount: number;
  totalKeysCount: number;
  apiKeyHealths: { [apiKeyId: string]: boolean };
  lastCheckAt: string;
}

// 过滤和搜索参数
export interface GroupFilterParams {
  search?: string;
  groupType?: string;
  healthStatus?: string;
  isEnabled?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// 统计相关类型
export interface GroupStatisticsRequest {
  groupIds?: string[];
  startTime?: string;
  endTime?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface GroupStatisticsResponse {
  data: {
    groupId: string;
    statistics: GroupStatistics;
    trends: {
      timestamp: string;
      requests: number;
      cost: number;
      responseTime: number;
      successRate: number;
    }[];
  }[];
}

// API Key相关（从原有的Api.ts扩展）
export interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  description?: string;
  tags?: string[];
  service: string;
  isEnabled: boolean;
  totalUsageCount: number;
  totalCost: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  // 其他API Key属性...
  tokenLimit?: number;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  concurrencyLimit: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  totalCostLimit: number;
  dailyCostUsed: number;
  monthlyCostUsed: number;
  expiresAt?: string;
  permissions: string;
}

// 错误处理相关类型
export interface GroupOperationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  groupId?: string;
  operation?: string;
}

export interface GroupErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: {
    componentStack: string;
  };
}
interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  invitationCode?: string;
}

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    emailConfirmed: boolean;
    isActive: boolean;
    roleId: number;
    roleName: string;
    createdAt: string;
    modifiedAt: string;
  };
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isActive?: boolean;
    emailConfirmed?: boolean;
    lastLoginAt?: string;
    provider?: string;
    providerId?: string;
    roleId?: number;
    roleName?: string;
    createdAt?: string;
    modifiedAt?: string;
    permissions?: string[];
  };
}

// User management types
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  description?: string;
}

interface UserRole {
  id: string;
  name: string;
  displayName?: string;
  permissions: string[];
  description?: string;
  isSystem: boolean;
}

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  roleId: string;
  description?: string;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  displayName?: string;
  roleId?: string;
  isEnabled?: boolean;
  isActive?: boolean;
  description?: string;
}

interface UsersRequest {
  page: number;
  pageSize: number;
  searchTerm?: string;
  roleId?: string;
  isEnabled?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard 相关类型定义
export interface DashboardResponse {
  totalApiKeys: number;
  activeApiKeys: number;
  totalAccounts: number;
  activeAccounts: number;
  rateLimitedAccounts: number;
  todayRequests: number;
  totalRequests: number;
  todayInputTokens: number;
  todayOutputTokens: number;
  todayCacheCreateTokens: number;
  todayCacheReadTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheCreateTokens: number;
  totalCacheReadTokens: number;
  realtimeRPM: number;
  realtimeTPM: number;
  metricsWindow: number;
  isHistoricalMetrics: boolean;
  systemStatus: string;
  uptimeSeconds: number;
}

export interface CostDataResponse {
  todayCosts: {
    totalCost: number;
    formatted: {
      totalCost: string;
    };
  };
  totalCosts: {
    totalCost: number;
    formatted: {
      totalCost: string;
    };
  };
}

export interface UptimeResponse {
  uptimeSeconds: number;
  uptimeText: string;
  startTime: string;
}

export interface ModelStatistics {
  model: string;
  requests: number;
  allTokens: number;
  cost: number;
  formatted?: {
    total: string;
  };
}

export interface TrendDataPoint {
  date?: string;
  hour?: string;
  label?: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  requests: number;
  cost: number;
}

export interface DateFilterRequest {
  type: 'preset' | 'custom';
  preset?: string;
  customRange?: string[];
  startTime?: string;
  endTime?: string;
}

export interface TrendDataRequest {
  granularity: 'day' | 'hour';
  dateFilter?: DateFilterRequest;
}

export interface ApiKeysTrendRequest {
  metric: 'requests' | 'tokens';
  granularity: 'day' | 'hour';
  dateFilter?: DateFilterRequest;
}

export interface TopApiKeyInfo {
  id: string;
  name: string;
  usage: number;
  cost: number;
}

export interface ApiKeysTrendResponse {
  data: any[];
  topApiKeys: TopApiKeyInfo[];
  totalApiKeys: number;
}

interface ApiKey {
  id: string;
  name: string;
  keyValue: string;
  description?: string;
  tags?: string[];
  tokenLimit?: number;
  rateLimitWindow?: number;
  rateLimitRequests?: number;
  concurrencyLimit: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  totalCostLimit: number;
  dailyCostUsed: number;
  monthlyCostUsed: number;
  expiresAt?: string;
  permissions: string;
  claudeAccountId?: string;
  claudeConsoleAccountId?: string;
  geminiAccountId?: string;
  enableModelRestriction: boolean;
  restrictedModels?: string[];
  enableClientRestriction: boolean;
  allowedClients?: string[];
  isEnabled: boolean;
  lastUsedAt?: string;
  totalUsageCount: number;
  totalCost: number;
  model?: string;
  service: string;
  createdAt: string;
  updatedAt: string;
  // 分组相关属性
  groupIds?: string[];
  groupMappings?: ApiKeyGroupMapping[];
}

export interface CostUsageInfo {
  dailyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  dailyCostUsed: number;
  dailyCostLimit: number;
  monthlyCostUsed: number;
  monthlyCostLimit: number;
  totalCostUsed: number;
  totalCostLimit: number;
}

interface ProxyConfig {
  enabled: boolean;
  type: 'socks5' | 'http' | 'https';
  host: string;
  port: string;
  username?: string;
  password?: string;
}

interface Account {
  id: string;
  name: string;
  platform: 'claude' | 'claude-console' | 'gemini' | 'openai' | 'thor';
  sessionKey?: string;
  isEnabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  accountType?: 'shared' | 'dedicated';
  projectId?: string;
  priority?: number;
  apiUrl?: string;
  apiKey?: string;
  baseUrl?: string;
  supportedModels?: Record<string, string>;
  userAgent?: string;
  rateLimitDuration?: number;
  proxy?: {
    type: string;
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

interface OAuthTokenInfo {
  claudeAiOauth?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    scopes: string[];
  };
  geminiOauth?: {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
    expiry_date: number;
  };
  tokens?: any;
  // Thor platform support
  apiKey?: string;
  baseUrl?: string;
}

interface AuthUrlResponse {
  authUrl: string;
  sessionId: string;
}

// Personal Dashboard Types
export interface ProfileDashboard {
  userId: number;
  wallet: WalletStatistics;
  requests: UserRequestStatistics;
  apiKeyCount: number;
  activeApiKeyCount: number;
  lastUpdateTime: string;
}

export interface WalletStatistics {
  userId: number;
  currentBalance: number;
  totalRecharged: number;
  totalUsed: number;
  recentTransactionCount: number;
  dailyAverageUsage: number;
  lastUsedAt?: string;
  lastRechargedAt?: string;
}

export interface UserRequestStatistics {
  userId: number;
  startDate: string;
  endDate: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  modelUsage: ModelUsage[];
  dailyUsage: DailyUsage[];
}

export interface ModelUsage {
  model: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
}

export interface DailyUsage {
  date: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  successfulRequests: number;
  failedRequests: number;
}

// Redeem Code Types
export interface RedeemCode {
  id: string;
  code: string;
  type: string;
  amount: number;
  description?: string;
  isUsed: boolean;
  usedByUserId?: string;
  usedByUserName?: string;
  usedAt?: string;
  expiresAt?: string;
  isEnabled: boolean;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
  modifiedAt?: string;
}

export interface CreateRedeemCodeRequest {
  type: string;
  amount: number;
  description?: string;
  expiresAt?: string;
  count: number;
}

export interface RedeemCodeUseResult {
  success: boolean;
  message: string;
  amount: number;
  type: string;
  newBalance: number;
}

export interface RedeemCodeListRequest {
  page: number;
  pageSize: number;
  code?: string;
  type?: string;
  isUsed?: boolean;
  isEnabled?: boolean;
  createdByUserId?: string;
  usedByUserId?: string;
  startDate?: string;
  endDate?: string;
  sortBy: string;
  sortDirection: string;
}

export interface RedeemCodeListResponse {
  data: RedeemCode[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RedeemRecord {
  id: string;
  code: string;
  type: string;
  amount: number;
  description: string;
  usedAt: string;
}

export interface RedeemCodeStats {
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  expiredCodes: number;
  totalRedeemedAmount: number;
  usageRate: number;
}

// Invitation Types
export interface InvitationStatsDto {
  totalInvited: number;
  maxInvitations: number;
  totalReward: number;
  invitationLink: string;
}

export interface InvitationRecordDto {
  id: string;
  invitedUsername: string;
  invitedEmail: string;
  invitedAt: string; // ISO date string
  inviterReward: number;
  invitedReward: number;
  rewardProcessed: boolean;
  notes?: string;
}

export interface InvitationSettings {
  inviterReward: number;
  invitedReward: number;
  maxInvitations: number;
  invitationEnabled: boolean;
}

export interface UpdateInvitationSettingsRequest {
  inviterReward: number;
  invitedReward: number;
  maxInvitations: number;
  invitationEnabled: boolean;
}

// ==================== API Key Group 相关类型定义 ====================

/**
 * 负载均衡策略枚举
 */
export const LoadBalanceStrategy = {
  RoundRobin: 0,
  Weighted: 1,
  LeastConnections: 2,
  Random: 3,
  Hash: 4,
  FastestResponse: 5
} as const;

export type LoadBalanceStrategy = typeof LoadBalanceStrategy[keyof typeof LoadBalanceStrategy];

/**
 * 故障转移策略枚举
 */
export const FailoverStrategy = {
  Failover: 0,
  FailFast: 1,
  Retry: 2,
  CircuitBreaker: 3
} as const;

export type FailoverStrategy = typeof FailoverStrategy[keyof typeof FailoverStrategy];

/**
 * 健康状态枚举
 */
export const HealthStatus = {
  Unknown: 'unknown',
  Healthy: 'healthy',
  Unhealthy: 'unhealthy',
  Degraded: 'degraded',
  Warning: 'warning',
  Critical: 'critical'
} as const;

export type HealthStatus = typeof HealthStatus[keyof typeof HealthStatus];

/**
 * 分组健康状态别名
 */
export type GroupHealthStatus = HealthStatus;

/**
 * API Key分组接口
 */
export interface ApiKeyGroup {
  id: string;
  name: string;
  description?: string;
  groupType?: string;
  tags?: string[];
  priority?: number;
  loadBalanceStrategy: LoadBalanceStrategy | string;
  failoverStrategy?: FailoverStrategy | string;
  failoverEnabled?: boolean;
  healthCheckEnabled: boolean;
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  healthCheckEndpoint?: string;
  isEnabled: boolean;
  groupCostLimit?: number;
  groupRequestLimit?: number;
  totalApiKeys: number;
  activeApiKeys: number;
  healthStatus: HealthStatus | string;
  lastHealthCheck?: string;
  lastHealthCheckAt?: string;
  totalRequests: number;
  totalCost: number;
  avgResponseTime: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Key分组映射接口
 */
export interface ApiKeyGroupMapping {
  id: string;
  apiKeyId: string;
  apiKeyName?: string;
  groupId: string;
  weight: number;
  priority?: number;
  isPrimary?: boolean;
  order?: number;
  isEnabled: boolean;
  healthStatus: HealthStatus | string;
  lastHealthCheck?: string;
  lastHealthCheckAt?: string;
  lastUsedAt?: string;
  responseTime: number;
  errorRate?: number;
  currentConnections?: number;
  totalUsageCount?: number;
  successfulRequests?: number;
  failedRequests?: number;
  averageResponseTime?: number;
  consecutiveFailures?: number;
  successRate?: number;
  weightScore?: number;
  isAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  apiKey?: ApiKey;
}

/**
 * 分组健康检查接口
 */
export interface GroupHealthCheck {
  id: string;
  groupId: string;
  apiKeyId: string;
  status: 'success' | 'failed' | 'timeout';
  responseTimeMs: number;
  errorMessage?: string;
  checkedAt: string;
}

/**
 * 分组统计信息
 */
export interface GroupStatistics {
  groupId: string;
  groupName?: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate?: number;
  totalTokens?: number;
  totalCost: number;
  avgResponseTime: number;
  averageResponseTime?: number;
  peakRPM?: number;
  peakConcurrency?: number;
  activeApiKeys: number;
  healthyApiKeys: number;
  mostActiveApiKey?: string;
  leastActiveApiKey?: string;
  requestsPerHour?: number;
  tokensPerRequest?: number;
  costPerRequest?: number;
  timeRange?: string;
  lastUpdated: string;
  lastUpdatedAt?: string;
}

/**
 * 创建分组请求
 */
export interface ApiKeyGroupCreateRequest {
  name: string;
  description?: string;
  groupType?: string;
  tags?: string[];
  priority?: number;
  loadBalanceStrategy?: LoadBalanceStrategy | string;
  failoverStrategy?: FailoverStrategy | string;
  failoverEnabled?: boolean;
  healthCheckEnabled?: boolean;
  healthCheckIntervalMs?: number;
  healthCheckTimeoutMs?: number;
  healthCheckEndpoint?: string;
  isEnabled?: boolean;
  groupCostLimit?: number;
  groupRequestLimit?: number;
}

export type CreateApiKeyGroupRequest = ApiKeyGroupCreateRequest;

/**
 * 更新分组请求
 */
export interface ApiKeyGroupUpdateRequest extends ApiKeyGroupCreateRequest {
  id?: string;
}

export type UpdateApiKeyGroupRequest = ApiKeyGroupUpdateRequest;

/**
 * 分组映射创建请求
 */
export interface ApiKeyGroupMappingCreateRequest {
  groupId: string;
  apiKeyId: string;
  weight?: number;
  priority?: number;
  isPrimary?: boolean;
  order?: number;
  isEnabled?: boolean;
}

/**
 * API Key到分组映射请求
 */
export interface ApiKeyGroupMappingRequest {
  weight?: number;
  isPrimary?: boolean;
  order?: number;
  isEnabled?: boolean;
}

/**
 * 分组映射更新请求
 */
export interface ApiKeyGroupMappingUpdateRequest {
  id?: string;
  weight?: number;
  priority?: number;
  isPrimary?: boolean;
  order?: number;
  isEnabled?: boolean;
}

export type UpdateApiKeyGroupMappingRequest = ApiKeyGroupMappingUpdateRequest;

/**
 * 获取分组列表请求参数
 */
export interface GetApiKeyGroupsRequest {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  groupType?: string;
  isEnabled?: boolean;
  healthStatus?: string;
  tags?: string[];
  priorityMin?: number;
  priorityMax?: number;
  loadBalanceStrategy?: string;
  minApiKeys?: number;
  maxApiKeys?: number;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortDirection?: string;
  includeApiKeys?: boolean;
  includeStatistics?: boolean;
}

/**
 * 分组列表响应
 */
export interface ApiKeyGroupListResponse {
  data: ApiKeyGroupResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  summary?: ApiKeyGroupSummary;
  filterInfo?: FilterInfo;
  sortInfo?: SortInfo;
}

/**
 * 分组详情响应
 */
export interface ApiKeyGroupResponse {
  id: string;
  name: string;
  description?: string;
  groupType?: string;
  tags?: string[];
  priority?: number;
  isEnabled: boolean;
  groupCostLimit?: number;
  groupRequestLimit?: number;
  loadBalanceStrategy: string;
  failoverStrategy?: string;
  healthCheckInterval?: number;
  healthCheckEnabled?: boolean;
  healthCheckIntervalMs?: number;
  healthCheckTimeoutMs?: number;
  healthCheckEndpoint?: string;
  failoverEnabled?: boolean;
  apiKeys?: ApiKeyGroupMapping[];
  statistics?: GroupStatistics;
  healthStatus: string;
  lastHealthCheckAt?: string;
  totalApiKeys?: number;
  activeApiKeys?: number;
  totalRequests?: number;
  totalCost?: number;
  avgResponseTime?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 分组健康状态
 */
export interface GroupHealthStatusInfo {
  groupId: string;
  groupName: string;
  overallStatus: HealthStatus | string;
  totalApiKeys: number;
  healthyApiKeys: number;
  unhealthyApiKeys: number;
  averageResponseTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  lastCheckTime: string;
  apiKeyStatuses: ApiKeyHealthStatus[];
  recommendations?: string[];
}

/**
 * API Key健康状态
 */
export interface ApiKeyHealthStatus {
  apiKeyId: string;
  apiKeyName: string;
  status: HealthStatus | string;
  responseTime: number;
  consecutiveFailures: number;
  lastUsedAt?: string;
  errorMessage?: string;
}

/**
 * 系统概览响应
 */
export interface ApiKeyGroupsOverviewResponse {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  healthyGroups: number;
  unhealthyGroups: number;
  totalApiKeysInGroups: number;
  averageKeysPerGroup: number;
  topPerformingGroups: TopGroup[];
  systemRecommendations: SystemRecommendation[];
  overallHealthScore: number;
}

/**
 * 顶级性能分组
 */
export interface TopGroup {
  id: string;
  name: string;
  metric: string;
  value: number;
  formattedValue: string;
}

/**
 * 系统建议
 */
export interface SystemRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionRequired: boolean;
  relatedGroupIds: string[];
}

/**
 * 批量健康检查响应
 */
export interface BatchHealthCheckResponse {
  totalGroups: number;
  healthyGroups: number;
  unhealthyGroups: number;
  checkStartTime: string;
  checkEndTime: string;
  totalDuration: number;
  groupResults: GroupHealthCheckResult[];
  overallRecommendations: string[];
}

/**
 * 分组健康检查结果
 */
export interface GroupHealthCheckResult {
  groupId: string;
  groupName: string;
  status: HealthStatus | string;
  checkDuration: number;
  previousStatus?: HealthStatus | string;
  statusChanged: boolean;
  issuesFound: string[];
  recommendations: string[];
}

/**
 * 分组摘要
 */
export interface ApiKeyGroupSummary {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  averagePriority: number;
  mostUsedStrategy: string;
  totalApiKeys: number;
  averageKeysPerGroup: number;
}

/**
 * 过滤信息
 */
export interface FilterInfo {
  appliedFilters: Record<string, any>;
  availableFilters: Record<string, any[]>;
}

/**
 * 排序信息
 */
export interface SortInfo {
  sortBy: string;
  sortDirection: string;
  availableSortFields: string[];
}

// ==================== Request Log 相关类型定义 ====================

export interface RequestLogSummary {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  accountId?: string;
  accountName?: string;
  model: string;
  platform: string;
  requestStartTime: string;
  requestEndTime?: string;
  durationMs?: number;
  status: string;
  errorMessage?: string;
  httpStatusCode?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  isStreaming: boolean;
  clientIp?: string;
  requestId?: string;
}

export interface RequestLogsRequest {
  page: number;
  pageSize: number;
  dateFilter?: DateFilterRequest;
  apiKeyId?: string;
  status?: string;
  model?: string;
  platform?: string;
  searchTerm?: string;
  sortBy: string;
  sortDirection: string;
}

export interface RequestLogsResponse {
  data: RequestLogSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RequestLogDetail {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  accountId?: string;
  accountName?: string;
  model: string;
  platform: string;
  requestStartTime: string;
  requestEndTime?: string;
  durationMs?: number;
  status: string;
  errorMessage?: string;
  httpStatusCode?: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  cost: number;
  isStreaming: boolean;
  clientIp?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RequestStatusStat {
  status: string;
  count: number;
  totalTokens: number;
  totalCost: number;
  averageDurationMs: number;
}

export interface RealtimeRequestSummary {
  id: string;
  apiKeyName: string;
  model: string;
  platform: string;
  requestStartTime: string;
  status: string;
  durationMs?: number;
  totalTokens: number;
  cost: number;
  errorMessage?: string;
}

export interface RealtimeStats {
  totalRequests: number;
  successRequests: number;
  successRate: number;
  totalTokens: number;
  averageResponseTimeMs: number;
  requestsPerMinute: number;
}

export interface RealtimeRequestsResponse {
  recentRequests: RealtimeRequestSummary[];
  windowMinutes: number;
  stats: RealtimeStats;
}

export interface ApiKeyModelFlowData {
  apiKeyId: string;
  apiKeyName: string;
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

// ==================== Permission 相关类型定义 ====================

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
  usage?: {
    requestCount: number;
    successRate: number;
    averageResponseTime: number;
    lastUsedAt?: string;
  };
}

export interface PermissionOverview {
  apiKeyId: string;
  apiKeyName: string;
  totalRules: number;
  enabledRules: number;
  accessiblePools: number;
  accessibleAccounts: number;
  lastUsedAt?: string;
  status: 'active' | 'inactive' | 'expired' | 'restricted';
  usage: {
    requestCount: number;
    successRate: number;
    totalCost: number;
    averageResponseTime: number;
  };
  platformDistribution: { [platform: string]: number };
  poolDistribution: { [pool: string]: number };
}

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
}

export interface BatchPermissionRequest {
  apiKeyId: string;
  permissions: CreatePermissionRequest[];
}

// ==================== Pricing 相关类型定义 ====================

export interface ModelPricing {
  model: string;
  inputPrice: number;
  outputPrice: number;
  cacheWritePrice: number;
  cacheReadPrice: number;
  currency: string;
  description?: string;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  updatedAt: string;
}

export interface CalculateCostRequest {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreateTokens: number;
  cacheReadTokens: number;
  targetCurrency?: string;
}

export interface PricingResult {
  model: string;
  currency: string;
  inputCost: number;
  outputCost: number;
  cacheCreateCost: number;
  cacheReadCost: number;
  totalCost: number;
  weightedTokens: number;
  unitPrice: number;
}

class ApiService {
  private baseURL = '/api';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const result = await response.json();
      if (result.message) {
        throw new Error(result.message);
      } else {
        throw new Error(response.statusText);
      }
    }

    // 对于204 No Content响应，不尝试解析JSON
    if (response.status === 204) {
      return undefined as T;
    }

    // 检查响应是否有内容
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        return result;
      }
    }

    return undefined as T;
  }

  // Auth
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.accessToken) {
        this.token = response.accessToken;
        localStorage.setItem('token', response.accessToken);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await this.request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    try {
      return this.request<ApiKey[]>('/apikeys');
    } catch (error) {
      throw error;
    }
  }

  async createApiKey(data: any): Promise<ApiKey> {
    return this.request<ApiKey>('/apikeys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApiKey(id: string, data: any): Promise<ApiKey> {
    return this.request<ApiKey>(`/apikeys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async enableApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}/enable`, {
      method: 'PATCH',
    });
  }

  async disableApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}/disable`, {
      method: 'PATCH',
    });
  }

  async toggleApiKeyEnabled(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request<void>(`/apikeys/${id}`, {
      method: 'DELETE',
    });
  }

  async getApiKeyUsage(id: string): Promise<CostUsageInfo> {
    return this.request<CostUsageInfo>(`/apikeys/${id}/usage`);
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      return this.request<Account[]>('/accounts');
    } catch (error) {
      // Mock data for demo
      return [
        {
          id: '1',
          name: 'Claude Production Account',
          platform: 'claude',
          sessionKey: 'sk_live_1234567890abcdef1234567890abcdef',
          isEnabled: true,
          lastUsedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Gemini Test Account',
          platform: 'gemini',
          sessionKey: 'AIzaSyA1234567890abcdef1234567890abcdef',
          isEnabled: true,
          lastUsedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  }

  async createAccount(data: {
    name: string;
    platform: string;
    sessionKey?: string;
    description?: string;
    accountType?: 'shared' | 'dedicated';
    projectId?: string;
    priority?: number;
    apiUrl?: string;
    apiKey?: string;
    supportedModels?: Record<string, string>;
    userAgent?: string;
    rateLimitDuration?: number;
    proxy?: any;
    claudeAiOauth?: any;
    geminiOauth?: any;
  }): Promise<Account> {
    return this.request<Account>('/accounts/openai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createClaudeAccount(data: any): Promise<Account> {
    return this.request<Account>('/accounts/claude', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createClaudeConsoleAccount(data: any): Promise<Account> {
    return this.request<Account>('/accounts/claude-console', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createGeminiAccount(data: any): Promise<Account> {
    return this.request<Account>('/accounts/gemini', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClaudeAccount(id: string, data: any): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateClaudeConsoleAccount(id: string, data: any): Promise<Account> {
    return this.request<Account>(`/accounts/claude-console/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateGeminiAccount(id: string, data: any): Promise<Account> {
    return this.request<Account>(`/accounts/gemini/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAccount(id: string, data: {
    name?: string;
    platform?: string;
    sessionKey?: string;
    isEnabled?: boolean;
  }): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async enableAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}/enable`, {
      method: 'PATCH',
    });
  }

  async disableAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}/disable`, {
      method: 'PATCH',
    });
  }

  async toggleAccountEnabled(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteAccount(id: string): Promise<void> {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard APIs
  async getDashboardData(): Promise<DashboardResponse> {
    return this.request<DashboardResponse>('/dashboard');
  }

  async getCostData(): Promise<CostDataResponse> {
    return this.request<CostDataResponse>('/dashboard/costs');
  }

  async getSystemUptime(): Promise<UptimeResponse> {
    return this.request<UptimeResponse>('/dashboard/uptime');
  }

  async getModelStatistics(dateFilter?: DateFilterRequest): Promise<ModelStatistics[]> {
    return this.request<ModelStatistics[]>('/dashboard/model-statistics', {
      method: 'POST',
      body: JSON.stringify(dateFilter || {}),
    });
  }

  async getTrendData(request: TrendDataRequest): Promise<TrendDataPoint[]> {
    return this.request<TrendDataPoint[]>('/dashboard/trend-data', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getApiKeysTrend(request: ApiKeysTrendRequest): Promise<ApiKeysTrendResponse> {
    return this.request<ApiKeysTrendResponse>('/dashboard/apikeys-trend', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAvailableAccounts(platform?: string): Promise<Account[]> {
    const query = platform ? `?platform=${platform}` : '';
    return this.request<Account[]>(`/accounts/available${query}`);
  }

  // OAuth Methods
  async generateClaudeAuthUrl(data?: { proxy?: any }): Promise<AuthUrlResponse> {
    return this.request<AuthUrlResponse>('/claude-proxy/auth/generate-url', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async generateGeminiAuthUrl(data?: { proxy?: any }): Promise<AuthUrlResponse> {
    return this.request<AuthUrlResponse>('/auth/gemini/generate-url', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async exchangeClaudeCode(data: {
    sessionId: string;
    callbackUrl: string;
    proxy?: any;
  }): Promise<any> {
    return this.request<any>('/claude-proxy/auth/exchange-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exchangeGeminiCode(data: {
    code: string;
    sessionId: string;
    proxy?: any;
  }): Promise<any> {
    return this.request<any>('/auth/gemini/exchange-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Request Logs APIs
  async getRequestLogs(request: RequestLogsRequest): Promise<RequestLogsResponse> {
    return this.request<RequestLogsResponse>('/dashboard/request-logs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRequestLogDetail(id: string): Promise<RequestLogDetail> {
    return this.request<RequestLogDetail>(`/dashboard/request-logs/${id}`);
  }

  async getRequestStatusStats(dateFilter?: DateFilterRequest): Promise<RequestStatusStat[]> {
    return this.request<RequestStatusStat[]>('/dashboard/request-status-stats', {
      method: 'POST',
      body: JSON.stringify(dateFilter || {}),
    });
  }

  async getRealtimeRequests(minutes: number = 10): Promise<RealtimeRequestsResponse> {
    return this.request<RealtimeRequestsResponse>(`/dashboard/realtime-requests?minutes=${minutes}`);
  }

  async getApiKeyModelFlowData(dateFilter?: DateFilterRequest): Promise<ApiKeyModelFlowData[]> {
    return this.request<ApiKeyModelFlowData[]>('/dashboard/apikey-model-flow', {
      method: 'POST',
      body: JSON.stringify(dateFilter || {}),
    });
  }

  // Pricing APIs
  async getModelPricing(): Promise<ModelPricing[]> {
    const response = await this.request<{ data: ModelPricing[] }>('/pricing/models');
    return response.data;
  }

  async updateModelPricing(pricing: ModelPricing): Promise<void> {
    await this.request<void>('/pricing/models', {
      method: 'PUT',
      body: JSON.stringify(pricing),
    });
  }

  async getExchangeRates(): Promise<ExchangeRate[]> {
    const response = await this.request<{ data: ExchangeRate[] }>('/pricing/exchange-rates');
    return response.data;
  }

  async updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): Promise<void> {
    await this.request<void>('/pricing/exchange-rates', {
      method: 'PUT',
      body: JSON.stringify({
        fromCurrency,
        toCurrency,
        rate
      }),
    });
  }

  async calculateCost(request: CalculateCostRequest): Promise<PricingResult> {
    const response = await this.request<{ data: PricingResult }>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  // User Management APIs
  async getUsers(request: UsersRequest): Promise<any> {
    try {
      const query = new URLSearchParams();
      Object.entries(request).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString() as string);
        }
      });
      return this.request<any>(`/users?${query.toString()}`);
    } catch (error) {
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async enableUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}/enable`, {
      method: 'PATCH',
    });
  }

  async disableUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}/disable`, {
      method: 'PATCH',
    });
  }

  async toggleUserEnabled(id: string): Promise<void> {
    return this.request<void>(`/users/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    return this.request<void>(`/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Role Management APIs
  async getRoles(): Promise<UserRole[]> {
    try {
      return this.request<UserRole[]>('/roles');
    } catch (error) {
      throw error;
    }
  }

  async createRole(data: { name: string; displayName: string; permissions: string[]; description?: string }): Promise<UserRole> {
    return this.request<UserRole>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: { displayName?: string; permissions?: string[]; description?: string }): Promise<UserRole> {
    return this.request<UserRole>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string): Promise<void> {
    return this.request<void>(`/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Profile Dashboard API
  async getProfileDashboard(): Promise<ProfileDashboard> {
    return this.request<ProfileDashboard>('/profile/dashboard');
  }

  // Redeem Code APIs
  async useRedeemCode(code: string): Promise<RedeemCodeUseResult> {
    return this.request<RedeemCodeUseResult>('/redeem-codes/use', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async getMyRedeemRecords(page: number = 1, pageSize: number = 20): Promise<{ success: boolean; data: RedeemRecord[] }> {
    return this.request<{ success: boolean; data: RedeemRecord[] }>(`/redeem-codes/my-records?page=${page}&pageSize=${pageSize}`);
  }

  // Admin Redeem Code APIs
  async createRedeemCodes(request: CreateRedeemCodeRequest): Promise<RedeemCode[]> {
    return this.request<RedeemCode[]>('/admin/redeem-codes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRedeemCodeList(request: RedeemCodeListRequest): Promise<any> {
    return this.request<any>('/admin/redeem-codes/list', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateRedeemCodeStatus(id: string, isEnabled: boolean): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/redeem-codes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isEnabled }),
    });
  }

  async deleteRedeemCode(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/redeem-codes/${id}`, {
      method: 'DELETE',
    });
  }

  async getRedeemCodeStats(): Promise<RedeemCodeStats> {
    return this.request<RedeemCodeStats>('/admin/redeem-codes/stats');
  }

  // Invitation APIs
  async getInvitationStats(): Promise<InvitationStatsDto> {
    return this.request<InvitationStatsDto>('/invitation/stats');
  }

  async getInvitationLink(): Promise<{ invitationLink: string }> {
    return this.request<{ invitationLink: string }>('/invitation/link');
  }

  async getInvitationRecords(): Promise<InvitationRecordDto[]> {
    return this.request<InvitationRecordDto[]>('/invitation/records');
  }

  // Invitation Settings APIs (Admin only)
  async getInvitationSettings(): Promise<InvitationSettings> {
    return this.request<InvitationSettings>('/invitation/settings');
  }

  async updateInvitationSettings(settings: UpdateInvitationSettingsRequest): Promise<void> {
    return this.request<void>('/invitation/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ==================== API Key Groups Management APIs ====================

  async getApiKeyGroups(request?: GetApiKeyGroupsRequest): Promise<ApiKeyGroup[]> {
    try {
      if (request) {
        const response = await this.request<ApiKeyGroupListResponse>('/apikey-groups', {
          method: 'POST',
          body: JSON.stringify(request),
        });
        return (response.data || []).map((item): ApiKeyGroup => ({
          ...item,
          healthCheckEnabled: item.healthCheckEnabled ?? false,
          healthCheckIntervalMs: item.healthCheckIntervalMs ?? 60000,
          healthCheckTimeoutMs: item.healthCheckTimeoutMs ?? 5000,
          totalApiKeys: item.totalApiKeys ?? 0,
          activeApiKeys: item.activeApiKeys ?? 0,
          totalRequests: item.totalRequests ?? 0,
          totalCost: item.totalCost ?? 0,
          avgResponseTime: item.avgResponseTime ?? 0,
          loadBalanceStrategy: item.loadBalanceStrategy as any
        }));
      } else {
        const response = await this.request<ApiKeyGroupListResponse>('/apikey-groups', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        return (response.data || []).map((item): ApiKeyGroup => ({
          ...item,
          healthCheckEnabled: item.healthCheckEnabled ?? false,
          healthCheckIntervalMs: item.healthCheckIntervalMs ?? 60000,
          healthCheckTimeoutMs: item.healthCheckTimeoutMs ?? 5000,
          totalApiKeys: item.totalApiKeys ?? 0,
          activeApiKeys: item.activeApiKeys ?? 0,
          totalRequests: item.totalRequests ?? 0,
          totalCost: item.totalCost ?? 0,
          avgResponseTime: item.avgResponseTime ?? 0,
          loadBalanceStrategy: item.loadBalanceStrategy as any
        }));
      }
    } catch (error) {
      console.error('Failed to fetch API key groups:', error);
      return [];
    }
  }

  async getApiKeyGroupsWithPagination(request?: GetApiKeyGroupsRequest): Promise<ApiKeyGroupListResponse> {
    return this.request<ApiKeyGroupListResponse>('/apikey-groups', {
      method: 'POST',
      body: JSON.stringify(request || {}),
    });
  }

  async createApiKeyGroup(data: ApiKeyGroupCreateRequest): Promise<ApiKeyGroup> {
    return this.request<ApiKeyGroup>('/apikey-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApiKeyGroup(id: string): Promise<ApiKeyGroupResponse> {
    return this.request<ApiKeyGroupResponse>(`/apikey-groups/${id}`);
  }

  async updateApiKeyGroup(id: string, data: ApiKeyGroupUpdateRequest): Promise<ApiKeyGroup> {
    return this.request<ApiKeyGroup>(`/apikey-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApiKeyGroup(id: string): Promise<void> {
    return this.request<void>(`/apikey-groups/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleApiKeyGroupEnabled(id: string): Promise<void> {
    return this.request<void>(`/apikey-groups/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  // ==================== API Key Group Mapping Management APIs ====================

  async getApiKeyGroupMappings(groupId: string): Promise<ApiKeyGroupMapping[]> {
    try {
      return this.request<ApiKeyGroupMapping[]>(`/apikey-groups/${groupId}/mappings`);
    } catch (error) {
      console.error('Failed to fetch API key mappings:', error);
      return [];
    }
  }

  async addApiKeyToGroup(groupId: string, apiKeyId: string, mapping: ApiKeyGroupMappingRequest): Promise<ApiKeyGroupMapping>;
  async addApiKeyToGroup(data: ApiKeyGroupMappingCreateRequest): Promise<ApiKeyGroupMapping>;
  async addApiKeyToGroup(
    groupIdOrData: string | ApiKeyGroupMappingCreateRequest, 
    apiKeyId?: string, 
    mapping?: ApiKeyGroupMappingRequest
  ): Promise<ApiKeyGroupMapping> {
    if (typeof groupIdOrData === 'string' && apiKeyId && mapping) {
      return this.request<ApiKeyGroupMapping>('/api-key-group-mappings', {
        method: 'POST',
        body: JSON.stringify({
          groupId: groupIdOrData,
          apiKeyId,
          ...mapping,
        }),
      });
    } else if (typeof groupIdOrData === 'object') {
      return this.request<ApiKeyGroupMapping>('/api-key-group-mappings', {
        method: 'POST',
        body: JSON.stringify(groupIdOrData),
      });
    } else {
      throw new Error('Invalid arguments');
    }
  }

  async updateApiKeyGroupMapping(id: string, data: ApiKeyGroupMappingUpdateRequest): Promise<ApiKeyGroupMapping>;
  async updateApiKeyGroupMapping(groupId: string, apiKeyId: string, mapping: UpdateApiKeyGroupMappingRequest): Promise<void>;
  async updateApiKeyGroupMapping(
    idOrGroupId: string, 
    dataOrApiKeyId?: ApiKeyGroupMappingUpdateRequest | string, 
    mapping?: UpdateApiKeyGroupMappingRequest
  ): Promise<ApiKeyGroupMapping | void> {
    if (typeof dataOrApiKeyId === 'object') {
      return this.request<ApiKeyGroupMapping>(`/api-key-group-mappings/${idOrGroupId}`, {
        method: 'PUT',
        body: JSON.stringify(dataOrApiKeyId),
      });
    } else if (typeof dataOrApiKeyId === 'string' && mapping) {
      return this.request<void>(`/apikey-groups/${idOrGroupId}/apikeys/${dataOrApiKeyId}`, {
        method: 'PUT',
        body: JSON.stringify(mapping),
      });
    } else {
      throw new Error('Invalid arguments');
    }
  }

  async removeApiKeyFromGroup(mappingId: string): Promise<void>;
  async removeApiKeyFromGroup(groupId: string, apiKeyId: string): Promise<void>;
  async removeApiKeyFromGroup(mappingIdOrGroupId: string, apiKeyId?: string): Promise<void> {
    if (apiKeyId) {
      return this.request<void>(`/apikey-groups/${mappingIdOrGroupId}/apikeys/${apiKeyId}`, {
        method: 'DELETE',
      });
    } else {
      return this.request<void>(`/api-key-group-mappings/${mappingIdOrGroupId}`, {
        method: 'DELETE',
      });
    }
  }

  async getGroupApiKeys(groupId: string): Promise<ApiKeyGroupMapping[]> {
    return this.request<ApiKeyGroupMapping[]>(`/apikey-groups/${groupId}/apikeys`);
  }

  // ==================== Health Monitoring APIs ====================

  async performGroupHealthCheck(groupId: string): Promise<GroupHealthCheck[]> {
    return this.request<GroupHealthCheck[]>(`/apikey-groups/${groupId}/health-check`, {
      method: 'POST',
    });
  }

  async triggerGroupHealthCheck(id: string): Promise<void> {
    return this.request<void>(`/apikey-groups/${id}/health-check`, {
      method: 'POST',
    });
  }

  async getGroupHealthStatus(id: string): Promise<GroupHealthStatusInfo> {
    return this.request<GroupHealthStatusInfo>(`/apikey-groups/${id}/health`);
  }

  async getGroupStatistics(groupId: string): Promise<GroupStatistics> {
    try {
      return this.request<GroupStatistics>(`/apikey-groups/${groupId}/statistics`);
    } catch (error) {
      console.error('Failed to fetch group statistics:', error);
      // Mock data for demo
      return {
        groupId: groupId,
        totalRequests: 1250,
        successfulRequests: 1225,
        failedRequests: 25,
        totalCost: 125.50,
        avgResponseTime: 850,
        peakRPM: 45,
        activeApiKeys: 2,
        healthyApiKeys: 2,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // ==================== System Overview APIs ====================

  async getApiKeyGroupsOverview(): Promise<ApiKeyGroupsOverviewResponse> {
    return this.request<ApiKeyGroupsOverviewResponse>('/apikey-groups/overview');
  }

  async batchGroupHealthCheck(): Promise<BatchHealthCheckResponse> {
    return this.request<BatchHealthCheckResponse>('/apikey-groups/batch-health-check', {
      method: 'POST',
    });
  }

  // ==================== Permission Management APIs ====================

  async getApiKeyPermissions(apiKeyId: string): Promise<ApiKeyAccountPermission[]> {
    try {
      return this.request<ApiKeyAccountPermission[]>(`/api-key-permissions/${apiKeyId}`);
    } catch (error) {
      console.error('Failed to fetch API key permissions:', error);
      return [];
    }
  }

  async getAllPermissions(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    platform?: string;
    poolGroup?: string;
    isEnabled?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: ApiKeyAccountPermission[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      return this.request<{ data: ApiKeyAccountPermission[]; total: number }>(`/api-key-permissions?${queryParams}`);
    } catch (error) {
      console.error('Failed to fetch all permissions:', error);
      return { data: [], total: 0 };
    }
  }

  async createPermission(data: CreatePermissionRequest): Promise<ApiKeyAccountPermission> {
    return this.request<ApiKeyAccountPermission>('/api-key-permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePermission(id: string, data: Partial<CreatePermissionRequest>): Promise<ApiKeyAccountPermission> {
    return this.request<ApiKeyAccountPermission>(`/api-key-permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePermission(id: string): Promise<void> {
    return this.request<void>(`/api-key-permissions/${id}`, {
      method: 'DELETE',
    });
  }

  async togglePermissionEnabled(id: string): Promise<void> {
    return this.request<void>(`/api-key-permissions/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async batchUpdatePermissions(data: BatchPermissionRequest): Promise<ApiKeyAccountPermission[]> {
    return this.request<ApiKeyAccountPermission[]>('/api-key-permissions/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async batchDeletePermissions(permissionIds: string[]): Promise<void> {
    return this.request<void>('/api-key-permissions/batch', {
      method: 'DELETE',
      body: JSON.stringify({ permissionIds }),
    });
  }

  async getAccountPools(): Promise<AccountPool[]> {
    try {
      return this.request<AccountPool[]>('/account-pools');
    } catch (error) {
      console.error('Failed to fetch account pools:', error);
      return [];
    }
  }

  async getPermissionOverview(): Promise<PermissionOverview[]> {
    try {
      return this.request<PermissionOverview[]>('/api-key-permissions/overview');
    } catch (error) {
      console.error('Failed to fetch permission overview:', error);
      return [];
    }
  }

  async checkPermission(apiKeyId: string, platform: string, accountId?: string): Promise<{
    hasAccess: boolean;
    reason?: string;
    recommendedAccount?: any;
  }> {
    return this.request<{
      hasAccess: boolean;
      reason?: string;
      recommendedAccount?: any;
    }>('/api-key-permissions/check', {
      method: 'POST',
      body: JSON.stringify({ apiKeyId, platform, accountId }),
    });
  }

  async getAvailablePlatforms(): Promise<string[]> {
    try {
      return this.request<string[]>('/platforms');
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
      return ['claude', 'claude-console', 'gemini', 'openai', 'all'];
    }
  }

  async getSelectionStrategies(): Promise<{ value: string; label: string; description: string }[]> {
    return [
      { value: 'priority', label: '优先级', description: '按优先级顺序选择账户' },
      { value: 'round_robin', label: '轮询', description: '轮流使用账户' },
      { value: 'random', label: '随机', description: '随机选择账户' },
      { value: 'performance', label: '性能优先', description: '选择性能最好的账户' }
    ];
  }

  async getAvailableApiKeysForGroup(groupId?: string): Promise<ApiKey[]> {
    const query = groupId ? `?excludeGroup=${groupId}` : '';
    try {
      return this.request<ApiKey[]>(`/apikeys/available${query}`);
    } catch (error) {
      console.error('Failed to get available API keys:', error);
      // 返回未分组的API Keys
      const allKeys = await this.getApiKeys();
      return allKeys.filter(key => key.isEnabled);
    }
  }
}

export const apiService = new ApiService();
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiKey,
  Account,
  ProxyConfig,
  OAuthTokenInfo,
  AuthUrlResponse,
  User,
  UserRole,
  CreateUserRequest,
  UpdateUserRequest,
  UsersRequest,
  UsersResponse
};
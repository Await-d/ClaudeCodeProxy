import type { 
  ApiKeyAccountPermission, 
  AccountPool, 
  PermissionOverview 
} from '@/types/permissions';

// Mock API Key权限数据
export const mockApiKeyPermissions: ApiKeyAccountPermission[] = [
  {
    id: '1',
    apiKeyId: '1',
    apiKeyName: 'Production Key',
    accountPoolGroup: 'production-pool',
    allowedPlatforms: ['claude', 'claude-console'],
    allowedAccountIds: undefined,
    selectionStrategy: 'priority',
    priority: 10,
    isEnabled: true,
    effectiveFrom: undefined,
    effectiveTo: undefined,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    apiKeyId: '1',
    apiKeyName: 'Production Key',
    accountPoolGroup: 'gemini-pool',
    allowedPlatforms: ['gemini'],
    allowedAccountIds: ['gemini-acc-1', 'gemini-acc-2'],
    selectionStrategy: 'round_robin',
    priority: 20,
    isEnabled: true,
    effectiveFrom: undefined,
    effectiveTo: undefined,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    apiKeyId: '2',
    apiKeyName: 'Development Key',
    accountPoolGroup: 'dev-pool',
    allowedPlatforms: ['claude'],
    allowedAccountIds: undefined,
    selectionStrategy: 'random',
    priority: 30,
    isEnabled: false,
    effectiveFrom: undefined,
    effectiveTo: undefined,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4',
    apiKeyId: '3',
    apiKeyName: 'Testing Key',
    accountPoolGroup: 'test-pool',
    allowedPlatforms: ['all'],
    allowedAccountIds: undefined,
    selectionStrategy: 'performance',
    priority: 40,
    isEnabled: true,
    effectiveFrom: new Date(Date.now() + 3600000).toISOString(),
    effectiveTo: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  }
];

// Mock 账号池数据
export const mockAccountPools: AccountPool[] = [
  {
    id: '1',
    name: 'production-pool',
    description: '生产环境账号池，包含高性能和稳定的账户',
    platform: 'all',
    totalAccounts: 8,
    activeAccounts: 7,
    healthyAccounts: 7,
    tags: ['production', 'high-priority', 'stable'],
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    usage: {
      requestCount: 12500,
      successRate: 98.7,
      averageResponseTime: 650,
      lastUsedAt: new Date(Date.now() - 300000).toISOString(),
    }
  },
  {
    id: '2',
    name: 'gemini-pool',
    description: 'Gemini专用账号池，优化了Google AI模型访问',
    platform: 'gemini',
    totalAccounts: 5,
    activeAccounts: 4,
    healthyAccounts: 4,
    tags: ['gemini', 'ai', 'google'],
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    usage: {
      requestCount: 4500,
      successRate: 96.2,
      averageResponseTime: 850,
      lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
    }
  },
  {
    id: '3',
    name: 'dev-pool',
    description: '开发测试环境账号池，用于日常开发和测试',
    platform: 'claude',
    totalAccounts: 3,
    activeAccounts: 2,
    healthyAccounts: 2,
    tags: ['development', 'testing', 'low-priority'],
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    usage: {
      requestCount: 1250,
      successRate: 94.8,
      averageResponseTime: 1200,
      lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
    }
  },
  {
    id: '4',
    name: 'test-pool',
    description: '专门的测试账号池，支持多平台测试',
    platform: 'all',
    totalAccounts: 6,
    activeAccounts: 5,
    healthyAccounts: 4,
    tags: ['testing', 'multi-platform', 'qa'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    usage: {
      requestCount: 890,
      successRate: 92.3,
      averageResponseTime: 980,
      lastUsedAt: new Date(Date.now() - 10800000).toISOString(),
    }
  },
  {
    id: '5',
    name: 'backup-pool',
    description: '备用账号池，用于故障转移和负载均衡',
    platform: 'claude',
    totalAccounts: 4,
    activeAccounts: 3,
    healthyAccounts: 2,
    tags: ['backup', 'failover', 'emergency'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
    usage: {
      requestCount: 125,
      successRate: 88.5,
      averageResponseTime: 1500,
      lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  }
];

// Mock 权限概览数据
export const mockPermissionOverview: PermissionOverview[] = [
  {
    apiKeyId: '1',
    apiKeyName: 'Production Key',
    totalRules: 3,
    enabledRules: 3,
    accessiblePools: 3,
    accessibleAccounts: 18,
    lastUsedAt: new Date(Date.now() - 300000).toISOString(),
    status: 'active',
    usage: {
      requestCount: 17890,
      successRate: 97.8,
      totalCost: 1247.56,
      averageResponseTime: 720,
    },
    platformDistribution: {
      'claude': 8500,
      'claude-console': 4500,
      'gemini': 4890,
    },
    poolDistribution: {
      'production-pool': 12500,
      'gemini-pool': 4500,
      'test-pool': 890,
    }
  },
  {
    apiKeyId: '2',
    apiKeyName: 'Development Key',
    totalRules: 2,
    enabledRules: 1,
    accessiblePools: 2,
    accessibleAccounts: 5,
    lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'restricted',
    usage: {
      requestCount: 1375,
      successRate: 94.8,
      totalCost: 89.32,
      averageResponseTime: 1150,
    },
    platformDistribution: {
      'claude': 1250,
      'all': 125,
    },
    poolDistribution: {
      'dev-pool': 1250,
      'backup-pool': 125,
    }
  },
  {
    apiKeyId: '3',
    apiKeyName: 'Testing Key',
    totalRules: 1,
    enabledRules: 0,
    accessiblePools: 1,
    accessibleAccounts: 6,
    lastUsedAt: new Date(Date.now() - 10800000).toISOString(),
    status: 'inactive',
    usage: {
      requestCount: 890,
      successRate: 92.3,
      totalCost: 45.67,
      averageResponseTime: 980,
    },
    platformDistribution: {
      'all': 890,
    },
    poolDistribution: {
      'test-pool': 890,
    }
  },
  {
    apiKeyId: '4',
    apiKeyName: 'Analytics Key',
    totalRules: 2,
    enabledRules: 2,
    accessiblePools: 2,
    accessibleAccounts: 9,
    lastUsedAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'active',
    usage: {
      requestCount: 5670,
      successRate: 96.1,
      totalCost: 312.45,
      averageResponseTime: 890,
    },
    platformDistribution: {
      'claude': 3200,
      'gemini': 2470,
    },
    poolDistribution: {
      'production-pool': 3200,
      'gemini-pool': 2470,
    }
  },
  {
    apiKeyId: '5',
    apiKeyName: 'Backup Key',
    totalRules: 1,
    enabledRules: 1,
    accessiblePools: 1,
    accessibleAccounts: 4,
    lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'expired',
    usage: {
      requestCount: 125,
      successRate: 88.5,
      totalCost: 12.34,
      averageResponseTime: 1500,
    },
    platformDistribution: {
      'claude': 125,
    },
    poolDistribution: {
      'backup-pool': 125,
    }
  }
];

// Mock API Keys 列表
export const mockApiKeys = [
  { id: '1', name: 'Production Key' },
  { id: '2', name: 'Development Key' },
  { id: '3', name: 'Testing Key' },
  { id: '4', name: 'Analytics Key' },
  { id: '5', name: 'Backup Key' },
];

// Mock 平台列表
export const mockPlatforms = ['claude', 'claude-console', 'gemini', 'openai', 'all'];

// Mock 选择策略
export const mockSelectionStrategies = [
  { value: 'priority', label: '优先级', description: '按优先级顺序选择账户，数值越小优先级越高' },
  { value: 'round_robin', label: '轮询', description: '按顺序轮流使用账户，保证负载均衡' },
  { value: 'random', label: '随机', description: '随机选择可用账户，避免模式化访问' },
  { value: 'performance', label: '性能优先', description: '选择当前性能最好的账户，动态优化' }
];

// 导出所有mock数据
export const mockPermissionData = {
  permissions: mockApiKeyPermissions,
  accountPools: mockAccountPools,
  overview: mockPermissionOverview,
  apiKeys: mockApiKeys,
  platforms: mockPlatforms,
  selectionStrategies: mockSelectionStrategies,
};
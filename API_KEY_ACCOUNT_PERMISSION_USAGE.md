# ClaudeCodeProxy 账号池权限管理系统 - 使用指南

## 概述

ClaudeCodeProxy 的账号池权限管理系统提供了精细的权限控制机制，允许管理员为不同的 API Key 配置特定的账户池访问权限，支持多种负载均衡策略和智能账户选择。

## 核心功能

### 1. 权限控制层次
- **API Key 级别**: 每个 API Key 可以配置独立的权限规则
- **账号池分组**: 账户可以按用途、地区、性能等维度分组管理
- **平台隔离**: 支持 Claude、Claude-Console、Gemini、OpenAI 等多平台权限隔离
- **时间控制**: 支持权限生效时间和到期时间设置

### 2. 负载均衡策略
- **priority**: 优先级策略（默认）- 按优先级和权重选择
- **round_robin**: 轮询策略 - 依次循环使用账户
- **random**: 随机策略 - 随机选择可用账户
- **performance**: 性能策略 - 基于权重和使用次数选择
- **least_used**: 最少使用策略 - 选择使用次数最少的账户
- **weighted**: 权重策略 - 基于权重随机选择
- **consistent_hash**: 一致性哈希 - 基于会话哈希固定选择

## API 端点

### 权限管理端点

#### 1. 获取 API Key 权限列表
```http
GET /api/apikey-permissions/{apiKeyId}
```

**响应示例：**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "apiKeyId": "456e7890-e89b-12d3-a456-426614174001",
    "accountPoolGroup": "premium-claude",
    "allowedPlatforms": ["claude", "claude-console"],
    "allowedAccountIds": null,
    "selectionStrategy": "priority",
    "priority": 10,
    "isEnabled": true,
    "effectiveFrom": null,
    "effectiveTo": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "isEffective": true
  }
]
```

#### 2. 添加权限规则
```http
POST /api/apikey-permissions/{apiKeyId}
Content-Type: application/json
```

**请求体：**
```json
{
  "accountPoolGroup": "premium-claude",
  "allowedPlatforms": ["claude", "claude-console"],
  "allowedAccountIds": ["account-1", "account-2"],
  "selectionStrategy": "round_robin",
  "priority": 10,
  "isEnabled": true,
  "effectiveFrom": "2024-01-15T00:00:00Z",
  "effectiveTo": "2024-12-31T23:59:59Z"
}
```

#### 3. 批量更新权限
```http
PUT /api/apikey-permissions/{apiKeyId}/batch
Content-Type: application/json
```

**请求体：**
```json
[
  {
    "accountPoolGroup": "premium-claude",
    "allowedPlatforms": ["claude"],
    "selectionStrategy": "priority",
    "priority": 10,
    "isEnabled": true
  },
  {
    "accountPoolGroup": "standard-claude",
    "allowedPlatforms": ["claude-console"],
    "selectionStrategy": "round_robin",
    "priority": 20,
    "isEnabled": true
  }
]
```

#### 4. 检查账户访问权限
```http
GET /api/apikey-permissions/{apiKeyId}/check/{accountId}?platform=claude
```

#### 5. 获取可访问的账户列表
```http
GET /api/apikey-permissions/{apiKeyId}/allowed-accounts?platform=claude
```

### 账号池管理端点

#### 1. 获取所有账号池
```http
GET /api/apikey-permissions/pools
```

#### 2. 获取账号池详情
```http
GET /api/apikey-permissions/pools/{poolGroup}
```

## 使用场景和配置示例

### 场景1：基础权限配置

为一个 API Key 配置基本的 Claude 访问权限：

```bash
# 添加权限规则
curl -X POST "http://localhost:6500/api/apikey-permissions/your-api-key-id" \
  -H "Content-Type: application/json" \
  -d '{
    "accountPoolGroup": "default-claude",
    "allowedPlatforms": ["claude"],
    "selectionStrategy": "priority",
    "priority": 50,
    "isEnabled": true
  }'
```

### 场景2：多平台权限配置

为 API Key 配置跨平台访问权限：

```bash
curl -X PUT "http://localhost:6500/api/apikey-permissions/your-api-key-id/batch" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "accountPoolGroup": "premium-claude",
      "allowedPlatforms": ["claude"],
      "selectionStrategy": "performance",
      "priority": 10,
      "isEnabled": true
    },
    {
      "accountPoolGroup": "backup-openai",
      "allowedPlatforms": ["openai"],
      "selectionStrategy": "round_robin",
      "priority": 90,
      "isEnabled": true
    }
  ]'
```

### 场景3：时间限制的权限

配置有时间限制的权限规则：

```json
{
  "accountPoolGroup": "trial-accounts",
  "allowedPlatforms": ["claude-console"],
  "selectionStrategy": "least_used",
  "priority": 30,
  "isEnabled": true,
  "effectiveFrom": "2024-01-01T00:00:00Z",
  "effectiveTo": "2024-01-31T23:59:59Z"
}
```

### 场景4：指定账户权限

限制只能使用特定的账户：

```json
{
  "accountPoolGroup": "vip-claude",
  "allowedPlatforms": ["claude"],
  "allowedAccountIds": ["claude-account-1", "claude-account-3"],
  "selectionStrategy": "weighted",
  "priority": 5,
  "isEnabled": true
}
```

## 账户池配置

### 1. 账户配置
确保账户正确配置了 `PoolGroup` 字段：

```json
{
  "id": "account-1",
  "name": "Premium Claude Account 1",
  "platform": "claude",
  "poolGroup": "premium-claude",
  "priority": 10,
  "weight": 5,
  "isEnabled": true
}
```

### 2. 常见的池分组策略

#### 按性能分组
- `high-performance`: 高性能账户池
- `standard`: 标准账户池
- `backup`: 备用账户池

#### 按用途分组
- `development`: 开发测试专用
- `production`: 生产环境专用
- `trial`: 试用账户池

#### 按地区分组
- `us-west`: 美西账户池
- `us-east`: 美东账户池
- `europe`: 欧洲账户池

## 智能账户选择策略

系统采用三层智能选择策略：

### 1. 账号池权限控制（优先级最高）
- 精细的权限控制
- 多种负载均衡策略
- 会话一致性支持

### 2. API Key 分组管理
- 分组级别的故障转移
- 统计和监控

### 3. 传统固定绑定（兜底策略）
- 向后兼容
- 简单可靠

## 监控和统计

### 权限使用统计
系统会自动记录权限使用情况，包括：
- 账户选择成功/失败次数
- 各策略的使用频率
- 账户池健康状态

### 健康检查
可以通过以下方式检查账户池状态：

```bash
# 检查特定账户池
curl "http://localhost:6500/api/apikey-permissions/pools/premium-claude"
```

## 故障处理

### 常见问题

#### 1. 权限配置后无法访问账户
- 检查权限是否已启用（`isEnabled: true`）
- 验证时间范围设置（`effectiveFrom` 和 `effectiveTo`）
- 确认账户池中有可用账户
- 检查账户状态（非限流、已启用）

#### 2. 负载均衡不生效
- 确认选择策略配置正确
- 检查账户权重设置
- 验证会话一致性配置

#### 3. 权限验证失败
- 确认 API Key 存在且有效
- 检查平台参数匹配
- 验证账户 ID 格式

### 日志监控
系统提供详细的日志记录，关键日志包括：
- 权限验证过程
- 账户选择策略执行
- 错误和异常信息

## 性能优化

### 1. 缓存机制
- 权限规则缓存
- 会话映射缓存
- 轮询计数器缓存

### 2. 数据库优化
- 索引优化
- 查询优化
- 连接池配置

### 3. 内存管理
- 自动缓存清理
- 内存使用监控
- 并发控制

## 安全考虑

### 1. 权限隔离
- API Key 级别的权限隔离
- 平台间权限隔离
- 账户池权限边界

### 2. 审计日志
- 权限变更记录
- 访问日志记录
- 异常行为监控

### 3. 访问控制
- 管理接口权限控制
- 敏感信息脱敏
- 安全传输

## 最佳实践

### 1. 权限设计
- 遵循最小权限原则
- 合理设置权限优先级
- 定期审查权限配置

### 2. 负载均衡
- 根据业务需求选择合适的策略
- 合理配置账户权重
- 监控负载分布情况

### 3. 监控告警
- 设置账户池健康告警
- 监控权限使用趋势
- 配置异常情况通知

### 4. 运维管理
- 定期备份权限配置
- 制定应急处理流程
- 建立权限变更审批机制

## 版本兼容性

本权限管理系统向后兼容，现有的固定绑定配置将继续工作：
- 专属 Claude OAuth 绑定
- Claude Console 绑定  
- Gemini 绑定

建议逐步迁移到新的权限管理系统以获得更好的灵活性和控制能力。
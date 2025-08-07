# API Key 账号池权限控制实现方案

## 🎯 **需求分析**

实现 **"一个 API Key 限定只能访问指定分组的账号池"** 功能，使系统支持细粒度的账户访问权限控制。

## 📋 **解决方案概览**

### **核心概念**
- **账号池分组 (Account Pool Group)**: 将账户按业务需要分成不同的池子
- **权限映射 (Permission Mapping)**: API Key 到账号池分组的权限关系
- **智能选择 (Intelligent Selection)**: 在权限范围内智能选择最佳账户

### **架构层次**
```
用户请求 → API Key → 权限检查 → 账号池分组 → 账户选择 → AI平台
     ↑        ↑        ↑         ↑         ↑        ↑
   入口     验证     权限控制    资源池    智能调度   目标
```

---

## 🗄️ **数据模型设计**

### **1. 新增权限映射实体**

**`ApiKeyAccountPoolPermission.cs`** - 核心权限控制实体
```csharp
public class ApiKeyAccountPoolPermission : Entity<Guid>
{
    public Guid ApiKeyId { get; set; }                    // API Key ID
    public string AccountPoolGroup { get; set; }          // 账号池分组名
    public string[] AllowedPlatforms { get; set; }        // 允许的平台
    public string[]? AllowedAccountIds { get; set; }      // 允许的具体账户(可选)
    public string SelectionStrategy { get; set; }         // 选择策略
    public int Priority { get; set; }                     // 权限优先级
    public bool IsEnabled { get; set; }                   // 是否启用
    public DateTime? EffectiveFrom { get; set; }          // 生效时间
    public DateTime? EffectiveTo { get; set; }            // 失效时间
}
```

### **2. 扩展账户实体**

**`Accounts.cs`** - 新增分组相关字段
```csharp
public class Accounts : Entity<string>
{
    // ... 现有字段
    public string? PoolGroup { get; set; }         // 账号池分组标识
    public List<string>? Tags { get; set; }        // 账户标签
    public int Weight { get; set; } = 1;           // 权重(负载均衡)
    public int MaxConcurrency { get; set; } = 10;  // 最大并发数
}
```

---

## 🔧 **核心服务实现**

### **1. 权限管理服务**

**`IApiKeyAccountPermissionService.cs`** - 服务接口
```csharp
public interface IApiKeyAccountPermissionService
{
    // 权限管理
    Task<ApiKeyAccountPoolPermission> AddPermissionAsync(...);
    Task<bool> RemovePermissionAsync(...);
    Task<List<ApiKeyAccountPoolPermission>> GetPermissionsAsync(...);
    
    // 账户选择
    Task<List<Accounts>> GetAllowedAccountsAsync(...);
    Task<Accounts?> SelectBestAccountAsync(...);
    Task<bool> HasPermissionAsync(...);
}
```

**`ApiKeyAccountPermissionService.cs`** - 核心业务逻辑
- ✅ **权限验证**: 检查API Key对账号池的访问权限
- ✅ **账户过滤**: 根据权限规则过滤可访问账户
- ✅ **智能选择**: 支持多种选择策略(优先级、轮询、随机、性能优先)
- ✅ **时间控制**: 支持权限的生效和失效时间
- ✅ **平台限制**: 支持按平台类型限制访问

### **2. 智能账户选择逻辑**

**扩展 `AccountsService.cs`**
```csharp
// 新增智能选择方法
public async Task<Accounts?> SelectAccountIntelligent(...)
{
    // 策略1: 优先使用账号池权限控制(新功能)
    if (permissionService != null && hasPoolPermissions) {
        return await SelectAccountForApiKeyWithPoolPermission(...);
    }
    
    // 策略2: 使用API Key分组管理
    if (apiKeyValue.IsGroupManaged && apiKeyGroupService != null) {
        return await SelectAccountForApiKeyWithGroup(...);
    }
    
    // 策略3: 回退到传统固定绑定模式
    return await SelectAccountForApiKey(...);
}
```

---

## 🌐 **API 端点设计**

### **权限管理 API**
```
GET    /api/apikey-permissions/{apiKeyId}                 # 获取权限列表
POST   /api/apikey-permissions/{apiKeyId}                 # 添加权限
DELETE /api/apikey-permissions/{apiKeyId}/{poolGroup}     # 移除权限
PUT    /api/apikey-permissions/{apiKeyId}/batch           # 批量更新
GET    /api/apikey-permissions/{apiKeyId}/check/{accountId} # 检查权限
GET    /api/apikey-permissions/{apiKeyId}/allowed-accounts # 获取可访问账户
```

### **账号池管理 API**
```
GET /api/apikey-permissions/pools                    # 获取所有账号池
GET /api/apikey-permissions/pools/{poolGroup}        # 获取账号池详情
```

---

## 🗃️ **数据库设计**

### **新增表结构**

**`ApiKeyAccountPoolPermissions`** 表
```sql
CREATE TABLE ApiKeyAccountPoolPermissions (
    Id CHAR(36) PRIMARY KEY,
    ApiKeyId CHAR(36) NOT NULL,
    AccountPoolGroup NVARCHAR(100) NOT NULL,
    AllowedPlatforms NVARCHAR(500),
    AllowedAccountIds TEXT,
    SelectionStrategy NVARCHAR(20) DEFAULT 'priority',
    Priority INTEGER DEFAULT 50,
    IsEnabled BOOLEAN DEFAULT 1,
    EffectiveFrom DATETIME,
    EffectiveTo DATETIME,
    CreatedAt DATETIME NOT NULL,
    -- 外键和索引
    FOREIGN KEY (ApiKeyId) REFERENCES ApiKeys(Id),
    UNIQUE(ApiKeyId, AccountPoolGroup)
);
```

**扩展 `Accounts` 表**
```sql
ALTER TABLE Accounts ADD COLUMN PoolGroup NVARCHAR(100);
ALTER TABLE Accounts ADD COLUMN Tags TEXT;
ALTER TABLE Accounts ADD COLUMN Weight INTEGER DEFAULT 1;
ALTER TABLE Accounts ADD COLUMN MaxConcurrency INTEGER DEFAULT 10;
```

---

## 🚀 **使用示例**

### **1. 配置账号池分组**
```sql
-- 创建生产环境账号池
UPDATE Accounts SET PoolGroup = 'production' 
WHERE Platform = 'claude' AND AccountType = 'dedicated';

-- 创建开发环境账号池  
UPDATE Accounts SET PoolGroup = 'development'
WHERE Platform = 'claude' AND AccountType = 'shared';
```

### **2. 配置API Key权限**
```http
POST /api/apikey-permissions/{apiKeyId}
{
    "accountPoolGroup": "production",
    "allowedPlatforms": ["claude", "claude-console"],
    "selectionStrategy": "priority",
    "priority": 10,
    "isEnabled": true
}
```

### **3. 权限验证流程**
```
用户请求 → API Key验证 → 检查账号池权限 → 筛选可用账户 → 智能选择 → 执行请求
```

---

## ⚙️ **配置与部署**

### **1. 服务注册**
```csharp
// Program.cs
services.AddScoped<IApiKeyAccountPermissionService, ApiKeyAccountPermissionService>();
app.MapApiKeyAccountPermissionEndpoints();
```

### **2. 数据库迁移**
```bash
# 执行迁移脚本
sqlite3 ClaudeCodeProxy.db < migration_add_account_pool_permissions.sql
```

### **3. 配置验证**
```bash
# 健康检查
curl http://localhost:6500/api/apikey-permissions/pools

# API文档
http://localhost:6500/scalar/v1
```

---

## 🎯 **核心优势**

### **1. 细粒度权限控制**
- ✅ **账号池级别**: 控制API Key可以访问哪些账号池
- ✅ **平台级别**: 限制API Key访问的AI平台类型
- ✅ **账户级别**: 可进一步限制具体的账户访问
- ✅ **时间级别**: 支持权限的时间窗口控制

### **2. 灵活的选择策略**
- **优先级**: 按账户优先级和权重选择
- **轮询**: 均匀分配负载
- **随机**: 随机分散请求
- **性能优先**: 选择响应最快的账户

### **3. 完整的管理功能**
- **权限配置**: 图形化界面管理权限
- **实时监控**: 监控权限使用情况
- **审计日志**: 完整的权限变更记录
- **批量操作**: 支持批量权限配置

### **4. 向后兼容**
- 🔄 **智能回退**: 新功能失败时自动回退到原有逻辑
- 🔄 **渐进迁移**: 可逐步迁移现有API Key到新权限模式
- 🔄 **零停机**: 部署过程不影响现有功能

---

## 🔄 **与现有架构的关系**

### **三种账户选择模式**

1. **账号池权限模式** (新增) - 最高优先级
   - API Key → 权限映射 → 账号池分组 → 账户选择

2. **API Key分组模式** (现有) - 中等优先级  
   - API Key → 分组映射 → 负载均衡 → 固定绑定账户

3. **固定绑定模式** (现有) - 最低优先级
   - API Key → 直接绑定 → 固定账户

### **智能选择逻辑**
系统会按优先级顺序尝试每种模式，确保在任何情况下都能为用户提供可用的账户资源。

---

## 📊 **实施建议**

### **阶段1: 基础实施**
1. 部署数据库迁移
2. 注册新服务和端点
3. 配置基础账号池分组

### **阶段2: 权限配置**
1. 为关键API Key配置账号池权限
2. 测试权限验证和选择逻辑
3. 监控性能和稳定性

### **阶段3: 全面推广**
1. 逐步迁移现有API Key
2. 优化选择策略和性能
3. 完善监控和管理界面

---

## 🎉 **总结**

通过这个实现方案，您可以实现：

- ✅ **一个API Key限定访问指定账号池分组**
- ✅ **灵活的权限配置和管理**
- ✅ **智能的账户选择策略**
- ✅ **完整的API和管理界面**
- ✅ **与现有架构的无缝集成**

这个方案完全满足您的需求，同时保持了系统的灵活性和扩展性！
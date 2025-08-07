using ClaudeCodeProxy.Domain;

namespace ClaudeCodeProxy.UnitTests.Utilities;

/// <summary>
/// API Key账号池权限测试数据构建器
/// </summary>
public class ApiKeyAccountPoolPermissionBuilder
{
    private readonly ApiKeyAccountPoolPermission _permission = new();

    public ApiKeyAccountPoolPermissionBuilder WithId(Guid id)
    {
        _permission.Id = id;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithApiKeyId(Guid apiKeyId)
    {
        _permission.ApiKeyId = apiKeyId;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithAccountPoolGroup(string group)
    {
        _permission.AccountPoolGroup = group;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithAllowedPlatforms(params string[] platforms)
    {
        _permission.AllowedPlatforms = platforms;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithAllowedAccountIds(params string[] accountIds)
    {
        _permission.AllowedAccountIds = accountIds.Length > 0 ? accountIds : null;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithSelectionStrategy(string strategy)
    {
        _permission.SelectionStrategy = strategy;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithPriority(int priority)
    {
        _permission.Priority = priority;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithIsEnabled(bool isEnabled)
    {
        _permission.IsEnabled = isEnabled;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithTimeWindow(DateTime? from, DateTime? to)
    {
        _permission.EffectiveFrom = from;
        _permission.EffectiveTo = to;
        return this;
    }

    public ApiKeyAccountPoolPermissionBuilder WithCreatedAt(DateTime createdAt)
    {
        _permission.CreatedAt = createdAt;
        return this;
    }

    public ApiKeyAccountPoolPermission Build() => _permission;

    // 预设配置方法
    public static ApiKeyAccountPoolPermissionBuilder Default() =>
        new ApiKeyAccountPoolPermissionBuilder()
            .WithId(Guid.NewGuid())
            .WithApiKeyId(Guid.NewGuid())
            .WithAccountPoolGroup("default-group")
            .WithAllowedPlatforms("claude")
            .WithSelectionStrategy("priority")
            .WithPriority(50)
            .WithIsEnabled(true)
            .WithCreatedAt(DateTime.UtcNow);

    public static ApiKeyAccountPoolPermissionBuilder ClaudeOnlyPermission() =>
        Default()
            .WithAccountPoolGroup("claude-premium")
            .WithAllowedPlatforms("claude")
            .WithPriority(10);

    public static ApiKeyAccountPoolPermissionBuilder MultiPlatformPermission() =>
        Default()
            .WithAccountPoolGroup("multi-platform")
            .WithAllowedPlatforms("claude", "openai", "gemini")
            .WithPriority(20);

    public static ApiKeyAccountPoolPermissionBuilder HighPriorityPermission() =>
        Default()
            .WithAccountPoolGroup("high-priority")
            .WithAllowedPlatforms("claude")
            .WithPriority(1);

    public static ApiKeyAccountPoolPermissionBuilder DisabledPermission() =>
        Default()
            .WithAccountPoolGroup("disabled-group")
            .WithAllowedPlatforms("claude")
            .WithIsEnabled(false);

    public static ApiKeyAccountPoolPermissionBuilder TimeRestrictedPermission(DateTime from, DateTime to) =>
        Default()
            .WithAccountPoolGroup("time-restricted")
            .WithAllowedPlatforms("claude")
            .WithTimeWindow(from, to);

    public static ApiKeyAccountPoolPermissionBuilder SpecificAccountsPermission(params string[] accountIds) =>
        Default()
            .WithAccountPoolGroup("specific-accounts")
            .WithAllowedPlatforms("claude")
            .WithAllowedAccountIds(accountIds);
}

/// <summary>
/// API Key测试数据构建器
/// </summary>
public class ApiKeyBuilder
{
    private readonly ApiKey _apiKey = new();

    public ApiKeyBuilder WithId(Guid id)
    {
        _apiKey.Id = id;
        return this;
    }

    public ApiKeyBuilder WithName(string name)
    {
        _apiKey.Name = name;
        return this;
    }

    public ApiKeyBuilder WithKey(string key)
    {
        _apiKey.Key = key;
        return this;
    }

    public ApiKeyBuilder WithIsEnabled(bool isEnabled)
    {
        _apiKey.IsEnabled = isEnabled;
        return this;
    }

    public ApiKeyBuilder WithCreatedAt(DateTime createdAt)
    {
        _apiKey.CreatedAt = createdAt;
        return this;
    }

    public ApiKeyBuilder WithUpdatedAt(DateTime updatedAt)
    {
        _apiKey.UpdatedAt = updatedAt;
        return this;
    }

    public ApiKey Build() => _apiKey;

    public static ApiKeyBuilder Default() =>
        new ApiKeyBuilder()
            .WithId(Guid.NewGuid())
            .WithName("test-api-key")
            .WithKey($"tk-{Guid.NewGuid():N}")
            .WithIsEnabled(true)
            .WithCreatedAt(DateTime.UtcNow)
            .WithUpdatedAt(DateTime.UtcNow);

    public static ApiKeyBuilder EnabledApiKey(string name) =>
        Default()
            .WithName(name)
            .WithIsEnabled(true);

    public static ApiKeyBuilder DisabledApiKey(string name) =>
        Default()
            .WithName(name)
            .WithIsEnabled(false);
}

/// <summary>
/// 账户测试数据构建器
/// </summary>
public class AccountsBuilder
{
    private readonly Accounts _account = new();

    public AccountsBuilder WithId(string id)
    {
        _account.Id = id;
        return this;
    }

    public AccountsBuilder WithPlatform(string platform)
    {
        _account.Platform = platform;
        return this;
    }

    public AccountsBuilder WithPoolGroup(string poolGroup)
    {
        _account.PoolGroup = poolGroup;
        return this;
    }

    public AccountsBuilder WithPriority(int priority)
    {
        _account.Priority = priority;
        return this;
    }

    public AccountsBuilder WithWeight(int weight)
    {
        _account.Weight = weight;
        return this;
    }

    public AccountsBuilder WithIsEnabled(bool isEnabled)
    {
        _account.IsEnabled = isEnabled;
        return this;
    }

    public AccountsBuilder WithUsageCount(int usageCount)
    {
        _account.UsageCount = usageCount;
        return this;
    }

    public AccountsBuilder WithCreatedAt(DateTime createdAt)
    {
        _account.CreatedAt = createdAt;
        return this;
    }

    public Accounts Build() => _account;

    public static AccountsBuilder Default() =>
        new AccountsBuilder()
            .WithId(Guid.NewGuid().ToString("N")[..12])
            .WithPlatform("claude")
            .WithPoolGroup("default")
            .WithPriority(50)
            .WithWeight(100)
            .WithIsEnabled(true)
            .WithUsageCount(0)
            .WithCreatedAt(DateTime.UtcNow);

    public static AccountsBuilder ClaudeAccount(string poolGroup = "default") =>
        Default()
            .WithPlatform("claude")
            .WithPoolGroup(poolGroup);

    public static AccountsBuilder OpenAIAccount(string poolGroup = "default") =>
        Default()
            .WithPlatform("openai")
            .WithPoolGroup(poolGroup);

    public static AccountsBuilder GeminiAccount(string poolGroup = "default") =>
        Default()
            .WithPlatform("gemini")
            .WithPoolGroup(poolGroup);

    public static AccountsBuilder HighPriorityAccount(string platform = "claude") =>
        Default()
            .WithPlatform(platform)
            .WithPriority(1)
            .WithWeight(100);

    public static AccountsBuilder LowPriorityAccount(string platform = "claude") =>
        Default()
            .WithPlatform(platform)
            .WithPriority(100)
            .WithWeight(50);

    public static AccountsBuilder DisabledAccount(string platform = "claude") =>
        Default()
            .WithPlatform(platform)
            .WithIsEnabled(false);

    public static AccountsBuilder HighUsageAccount(string platform = "claude", int usageCount = 1000) =>
        Default()
            .WithPlatform(platform)
            .WithUsageCount(usageCount);
}

/// <summary>
/// 测试场景构建器
/// </summary>
public class TestScenarioBuilder
{
    private Guid _apiKeyId = Guid.NewGuid();
    private readonly List<ApiKeyAccountPoolPermission> _permissions = new();
    private readonly List<Accounts> _accounts = new();

    public TestScenarioBuilder WithApiKeyId(Guid apiKeyId)
    {
        _apiKeyId = apiKeyId;
        return this;
    }

    public TestScenarioBuilder WithPermission(ApiKeyAccountPoolPermissionBuilder permissionBuilder)
    {
        var permission = permissionBuilder.WithApiKeyId(_apiKeyId).Build();
        _permissions.Add(permission);
        return this;
    }

    public TestScenarioBuilder WithAccount(AccountsBuilder accountBuilder)
    {
        var account = accountBuilder.Build();
        _accounts.Add(account);
        return this;
    }

    public TestScenario Build() => new(_apiKeyId, _permissions, _accounts);

    // 预设场景
    public static TestScenarioBuilder SimpleClaudeScenario()
    {
        return new TestScenarioBuilder()
            .WithPermission(ApiKeyAccountPoolPermissionBuilder.ClaudeOnlyPermission())
            .WithAccount(AccountsBuilder.ClaudeAccount("claude-premium").WithPriority(1))
            .WithAccount(AccountsBuilder.ClaudeAccount("claude-premium").WithPriority(2));
    }

    public static TestScenarioBuilder MultiPlatformScenario()
    {
        return new TestScenarioBuilder()
            .WithPermission(ApiKeyAccountPoolPermissionBuilder.MultiPlatformPermission())
            .WithAccount(AccountsBuilder.ClaudeAccount("multi-platform"))
            .WithAccount(AccountsBuilder.OpenAIAccount("multi-platform"))
            .WithAccount(AccountsBuilder.GeminiAccount("multi-platform"));
    }

    public static TestScenarioBuilder NoPermissionScenario()
    {
        return new TestScenarioBuilder()
            .WithAccount(AccountsBuilder.ClaudeAccount());
    }

    public static TestScenarioBuilder DisabledPermissionScenario()
    {
        return new TestScenarioBuilder()
            .WithPermission(ApiKeyAccountPoolPermissionBuilder.DisabledPermission())
            .WithAccount(AccountsBuilder.ClaudeAccount("disabled-group"));
    }

    public static TestScenarioBuilder TimeRestrictedScenario(DateTime from, DateTime to)
    {
        return new TestScenarioBuilder()
            .WithPermission(ApiKeyAccountPoolPermissionBuilder.TimeRestrictedPermission(from, to))
            .WithAccount(AccountsBuilder.ClaudeAccount("time-restricted"));
    }
}

/// <summary>
/// 测试场景数据容器
/// </summary>
public class TestScenario
{
    public Guid ApiKeyId { get; }
    public IReadOnlyList<ApiKeyAccountPoolPermission> Permissions { get; }
    public IReadOnlyList<Accounts> Accounts { get; }

    public TestScenario(Guid apiKeyId, 
        IEnumerable<ApiKeyAccountPoolPermission> permissions, 
        IEnumerable<Accounts> accounts)
    {
        ApiKeyId = apiKeyId;
        Permissions = permissions.ToList().AsReadOnly();
        Accounts = accounts.ToList().AsReadOnly();
    }
}

/// <summary>
/// 测试数据生成器
/// </summary>
public static class TestDataGenerator
{
    private static readonly Random _random = new();

    /// <summary>
    /// 生成随机API Key ID
    /// </summary>
    public static Guid GenerateApiKeyId() => Guid.NewGuid();

    /// <summary>
    /// 生成随机账户ID
    /// </summary>
    public static string GenerateAccountId() => $"acc_{_random.Next(10000, 99999)}";

    /// <summary>
    /// 生成随机分组名称
    /// </summary>
    public static string GeneratePoolGroup() => $"group_{_random.Next(1, 100)}";

    /// <summary>
    /// 生成随机平台
    /// </summary>
    public static string GenerateRandomPlatform()
    {
        var platforms = new[] { "claude", "openai", "gemini" };
        return platforms[_random.Next(platforms.Length)];
    }

    /// <summary>
    /// 生成随机选择策略
    /// </summary>
    public static string GenerateRandomStrategy()
    {
        var strategies = new[] { "priority", "round_robin", "random", "performance" };
        return strategies[_random.Next(strategies.Length)];
    }

    /// <summary>
    /// 生成随机权重
    /// </summary>
    public static int GenerateRandomWeight() => _random.Next(1, 101);

    /// <summary>
    /// 生成随机优先级
    /// </summary>
    public static int GenerateRandomPriority() => _random.Next(1, 101);

    /// <summary>
    /// 生成批量权限数据
    /// </summary>
    public static List<ApiKeyAccountPoolPermission> GeneratePermissions(
        int count, 
        Guid? apiKeyId = null)
    {
        var id = apiKeyId ?? GenerateApiKeyId();
        var permissions = new List<ApiKeyAccountPoolPermission>();

        for (int i = 0; i < count; i++)
        {
            var permission = ApiKeyAccountPoolPermissionBuilder
                .Default()
                .WithApiKeyId(id)
                .WithAccountPoolGroup(GeneratePoolGroup())
                .WithAllowedPlatforms(GenerateRandomPlatform())
                .WithSelectionStrategy(GenerateRandomStrategy())
                .WithPriority(GenerateRandomPriority())
                .Build();

            permissions.Add(permission);
        }

        return permissions;
    }

    /// <summary>
    /// 生成批量账户数据
    /// </summary>
    public static List<Accounts> GenerateAccounts(
        int count,
        string? platform = null,
        string? poolGroup = null)
    {
        var accounts = new List<Accounts>();

        for (int i = 0; i < count; i++)
        {
            var account = AccountsBuilder
                .Default()
                .WithId(GenerateAccountId())
                .WithPlatform(platform ?? GenerateRandomPlatform())
                .WithPoolGroup(poolGroup ?? GeneratePoolGroup())
                .WithPriority(GenerateRandomPriority())
                .WithWeight(GenerateRandomWeight())
                .Build();

            accounts.Add(account);
        }

        return accounts;
    }

    /// <summary>
    /// 生成完整的测试场景
    /// </summary>
    public static TestScenario GenerateCompleteScenario(
        int permissionCount = 3,
        int accountCount = 5)
    {
        var apiKeyId = GenerateApiKeyId();
        var permissions = GeneratePermissions(permissionCount, apiKeyId);
        var accounts = GenerateAccounts(accountCount);

        return new TestScenario(apiKeyId, permissions, accounts);
    }
}
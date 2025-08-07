using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Jobs;
using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace ClaudeCodeProxy.PerformanceTests.Benchmarks;

/// <summary>
/// API Key账号池权限服务性能基准测试
/// </summary>
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net90)]
[RankColumn]
[MinColumn, MaxColumn, MeanColumn, MedianColumn]
public class PermissionServiceBenchmarks
{
    private ApiKeyAccountPermissionService _permissionService = null!;
    private IContext _context = null!;
    private Guid _testApiKeyId;
    private List<ApiKeyAccountPoolPermission> _permissions = null!;
    private List<Accounts> _accounts = null!;

    [GlobalSetup]
    public void Setup()
    {
        // 创建内存数据库
        var options = new DbContextOptionsBuilder<MasterDbContext>()
            .UseInMemoryDatabase(databaseName: $"BenchmarkDb_{Guid.NewGuid()}")
            .Options;

        _context = new MasterDbContext(options);

        // Mock dependencies
        var mockLogger = new Mock<ILogger<ApiKeyAccountPermissionService>>();
        var mockAccountsService = new Mock<IAccountsService>();
        
        // Setup accounts service mock to return available accounts
        mockAccountsService
            .Setup(x => x.IsAccountAvailableAsync(It.IsAny<Accounts>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        _permissionService = new ApiKeyAccountPermissionService(
            _context,
            mockLogger.Object,
            mockAccountsService.Object);

        // 初始化测试数据
        InitializeTestData().Wait();
    }

    [GlobalCleanup]
    public void Cleanup()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    /// <summary>
    /// 基准测试：获取允许访问的账户（单个权限）
    /// </summary>
    [Benchmark(Baseline = true)]
    public async Task<List<Accounts>> GetAllowedAccounts_SinglePermission()
    {
        return await _permissionService.GetAllowedAccountsAsync(_testApiKeyId, "claude");
    }

    /// <summary>
    /// 基准测试：获取允许访问的账户（多个权限）
    /// </summary>
    [Benchmark]
    public async Task<List<Accounts>> GetAllowedAccounts_MultiplePermissions()
    {
        // 为测试API Key添加多个权限
        var apiKeyWithMultiplePermissions = Guid.NewGuid();
        await AddTestApiKeyWithMultiplePermissions(apiKeyWithMultiplePermissions);
        
        return await _permissionService.GetAllowedAccountsAsync(apiKeyWithMultiplePermissions, "claude");
    }

    /// <summary>
    /// 基准测试：选择最佳账户（优先级策略）
    /// </summary>
    [Benchmark]
    public async Task<Accounts?> SelectBestAccount_Priority()
    {
        return await _permissionService.SelectBestAccountAsync(_testApiKeyId, "claude");
    }

    /// <summary>
    /// 基准测试：选择最佳账户（轮询策略）
    /// </summary>
    [Benchmark]
    public async Task<Accounts?> SelectBestAccount_RoundRobin()
    {
        // 创建使用轮询策略的权限
        var apiKeyWithRoundRobin = Guid.NewGuid();
        await AddTestApiKeyWithStrategy(apiKeyWithRoundRobin, "round_robin");
        
        return await _permissionService.SelectBestAccountAsync(apiKeyWithRoundRobin, "claude");
    }

    /// <summary>
    /// 基准测试：权限检查
    /// </summary>
    [Benchmark]
    public async Task<bool> HasPermission_Check()
    {
        return await _permissionService.HasPermissionAsync(_testApiKeyId, "claude-acc-1", "claude");
    }

    /// <summary>
    /// 基准测试：获取权限列表
    /// </summary>
    [Benchmark]
    public async Task<List<ApiKeyAccountPoolPermission>> GetPermissions()
    {
        return await _permissionService.GetPermissionsAsync(_testApiKeyId);
    }

    /// <summary>
    /// 基准测试：并发获取允许访问的账户
    /// </summary>
    [Benchmark]
    public async Task ConcurrentGetAllowedAccounts()
    {
        var tasks = new List<Task<List<Accounts>>>();
        
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_permissionService.GetAllowedAccountsAsync(_testApiKeyId, "claude"));
        }
        
        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// 基准测试：并发账户选择
    /// </summary>
    [Benchmark]
    public async Task ConcurrentAccountSelection()
    {
        var tasks = new List<Task<Accounts?>>();
        
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_permissionService.SelectBestAccountAsync(_testApiKeyId, "claude", $"session-{i}"));
        }
        
        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// 基准测试：大量权限数据查询
    /// </summary>
    [Benchmark]
    public async Task<List<Accounts>> GetAllowedAccounts_LargeDataSet()
    {
        // 创建有大量权限的API Key
        var apiKeyWithManyPermissions = Guid.NewGuid();
        await AddTestApiKeyWithManyPermissions(apiKeyWithManyPermissions, 100);
        
        return await _permissionService.GetAllowedAccountsAsync(apiKeyWithManyPermissions, "claude");
    }

    #region Private Methods

    private async Task InitializeTestData()
    {
        _testApiKeyId = Guid.NewGuid();

        // 创建测试API Key
        var apiKey = new ApiKey
        {
            Id = _testApiKeyId,
            Name = "Benchmark Test Key",
            Key = "benchmark-key-12345",
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeys.Add(apiKey);

        // 创建测试账户
        _accounts = new List<Accounts>();
        for (int i = 1; i <= 50; i++)
        {
            var account = new Accounts
            {
                Id = $"claude-acc-{i}",
                Platform = "claude",
                PoolGroup = "premium",
                Priority = i,
                Weight = 100 - i,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            };
            _accounts.Add(account);
            _context.Accounts.Add(account);
        }

        // 创建测试权限
        var permission = new ApiKeyAccountPoolPermission
        {
            Id = Guid.NewGuid(),
            ApiKeyId = _testApiKeyId,
            AccountPoolGroup = "premium",
            AllowedPlatforms = new[] { "claude" },
            SelectionStrategy = "priority",
            Priority = 10,
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeyAccountPoolPermissions.Add(permission);

        await _context.SaveChangesAsync();
    }

    private async Task AddTestApiKeyWithMultiplePermissions(Guid apiKeyId)
    {
        // 创建API Key
        var apiKey = new ApiKey
        {
            Id = apiKeyId,
            Name = "Multiple Permissions Key",
            Key = $"multi-key-{apiKeyId}",
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeys.Add(apiKey);

        // 创建多个权限
        for (int i = 1; i <= 5; i++)
        {
            var permission = new ApiKeyAccountPoolPermission
            {
                Id = Guid.NewGuid(),
                ApiKeyId = apiKeyId,
                AccountPoolGroup = i <= 3 ? "premium" : "standard",
                AllowedPlatforms = new[] { "claude" },
                SelectionStrategy = "priority",
                Priority = i * 10,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.ApiKeyAccountPoolPermissions.Add(permission);
        }

        await _context.SaveChangesAsync();
    }

    private async Task AddTestApiKeyWithStrategy(Guid apiKeyId, string strategy)
    {
        var apiKey = new ApiKey
        {
            Id = apiKeyId,
            Name = $"Strategy Test Key - {strategy}",
            Key = $"strategy-key-{apiKeyId}",
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeys.Add(apiKey);

        var permission = new ApiKeyAccountPoolPermission
        {
            Id = Guid.NewGuid(),
            ApiKeyId = apiKeyId,
            AccountPoolGroup = "premium",
            AllowedPlatforms = new[] { "claude" },
            SelectionStrategy = strategy,
            Priority = 10,
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeyAccountPoolPermissions.Add(permission);

        await _context.SaveChangesAsync();
    }

    private async Task AddTestApiKeyWithManyPermissions(Guid apiKeyId, int permissionCount)
    {
        var apiKey = new ApiKey
        {
            Id = apiKeyId,
            Name = "Large Dataset Key",
            Key = $"large-key-{apiKeyId}",
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ApiKeys.Add(apiKey);

        // 创建大量权限和对应的账户
        for (int i = 1; i <= permissionCount; i++)
        {
            var groupName = $"group-{i}";
            
            // 创建权限
            var permission = new ApiKeyAccountPoolPermission
            {
                Id = Guid.NewGuid(),
                ApiKeyId = apiKeyId,
                AccountPoolGroup = groupName,
                AllowedPlatforms = new[] { "claude" },
                SelectionStrategy = "priority",
                Priority = i,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.ApiKeyAccountPoolPermissions.Add(permission);

            // 为每个分组创建几个账户
            for (int j = 1; j <= 3; j++)
            {
                var account = new Accounts
                {
                    Id = $"large-claude-acc-{i}-{j}",
                    Platform = "claude",
                    PoolGroup = groupName,
                    Priority = j,
                    Weight = 100 - j,
                    IsEnabled = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Accounts.Add(account);
            }
        }

        await _context.SaveChangesAsync();
    }

    #endregion
}
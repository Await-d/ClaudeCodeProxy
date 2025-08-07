using ClaudeCodeProxy.Core;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Data.Common;

namespace ClaudeCodeProxy.IntegrationTests.Infrastructure;

/// <summary>
/// 集成测试Web应用程序工厂
/// </summary>
public class TestWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> 
    where TProgram : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // 移除原有的数据库配置
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<MasterDbContext>));
            if (dbContextDescriptor != null)
                services.Remove(dbContextDescriptor);

            var dbConnectionDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbConnection));
            if (dbConnectionDescriptor != null)
                services.Remove(dbConnectionDescriptor);

            // 配置内存数据库
            services.AddDbContext<MasterDbContext>(options =>
            {
                options.UseInMemoryDatabase($"TestDatabase_{Guid.NewGuid()}");
            });

            // 替换IContext服务
            var contextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IContext));
            if (contextDescriptor != null)
                services.Remove(contextDescriptor);

            services.AddScoped<IContext>(provider => 
                provider.GetRequiredService<MasterDbContext>());

            // 配置测试认证
            services.AddAuthentication("Test")
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationSchemeHandler>(
                    "Test", options => { });

            // 禁用日志（减少测试噪音）
            services.AddLogging(builder =>
            {
                builder.ClearProviders();
                builder.SetMinimumLevel(LogLevel.Warning);
            });
        });

        builder.UseEnvironment("Test");
    }

    /// <summary>
    /// 获取测试数据库上下文
    /// </summary>
    public MasterDbContext GetTestDbContext()
    {
        var scope = Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<MasterDbContext>();
    }

    /// <summary>
    /// 初始化测试数据
    /// </summary>
    public async Task InitializeTestDataAsync()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
        
        await context.Database.EnsureCreatedAsync();
        await SeedTestDataAsync(context);
    }

    /// <summary>
    /// 清理测试数据
    /// </summary>
    public async Task CleanupTestDataAsync()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
        
        await context.Database.EnsureDeletedAsync();
    }

    /// <summary>
    /// 播种测试数据
    /// </summary>
    private static async Task SeedTestDataAsync(MasterDbContext context)
    {
        // 创建测试API Key
        var testApiKey = new ClaudeCodeProxy.Domain.ApiKey
        {
            Id = Guid.Parse("12345678-1234-1234-1234-123456789012"),
            Name = "Integration Test Key",
            Key = "test-api-key-12345",
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };

        context.ApiKeys.Add(testApiKey);

        // 创建测试账户
        var testAccounts = new[]
        {
            new ClaudeCodeProxy.Domain.Accounts
            {
                Id = "test-claude-acc-1",
                Platform = "claude",
                PoolGroup = "premium",
                Priority = 1,
                Weight = 100,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            },
            new ClaudeCodeProxy.Domain.Accounts
            {
                Id = "test-claude-acc-2",
                Platform = "claude", 
                PoolGroup = "premium",
                Priority = 2,
                Weight = 80,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            },
            new ClaudeCodeProxy.Domain.Accounts
            {
                Id = "test-openai-acc-1",
                Platform = "openai",
                PoolGroup = "standard",
                Priority = 1,
                Weight = 90,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        context.Accounts.AddRange(testAccounts);

        // 创建测试权限
        var testPermission = new ClaudeCodeProxy.Domain.ApiKeyAccountPoolPermission
        {
            Id = Guid.NewGuid(),
            ApiKeyId = testApiKey.Id,
            AccountPoolGroup = "premium",
            AllowedPlatforms = new[] { "claude" },
            SelectionStrategy = "priority",
            Priority = 10,
            IsEnabled = true,
            CreatedAt = DateTime.UtcNow
        };

        context.ApiKeyAccountPoolPermissions.Add(testPermission);

        await context.SaveChangesAsync();
    }
}

/// <summary>
/// 测试认证处理器
/// </summary>
public class TestAuthenticationSchemeHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationSchemeHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock)
        : base(options, logger, encoder, clock)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "TestUser"),
            new Claim(ClaimTypes.NameIdentifier, "123"),
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
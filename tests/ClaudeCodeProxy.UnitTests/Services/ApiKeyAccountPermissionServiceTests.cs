using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ClaudeCodeProxy.UnitTests.Services;

/// <summary>
/// API Key账号池权限服务单元测试
/// </summary>
public class ApiKeyAccountPermissionServiceTests : IAsyncDisposable
{
    private readonly Mock<IContext> _mockContext;
    private readonly Mock<ILogger<ApiKeyAccountPermissionService>> _mockLogger;
    private readonly Mock<IAccountsService> _mockAccountsService;
    private readonly Mock<DbSet<ApiKeyAccountPoolPermission>> _mockPermissionDbSet;
    private readonly Mock<DbSet<ApiKey>> _mockApiKeyDbSet;
    private readonly Mock<DbSet<Accounts>> _mockAccountsDbSet;
    private readonly ApiKeyAccountPermissionService _service;
    private readonly List<IDisposable> _disposables = new();

    public ApiKeyAccountPermissionServiceTests()
    {
        _mockContext = new Mock<IContext>();
        _mockLogger = new Mock<ILogger<ApiKeyAccountPermissionService>>();
        _mockAccountsService = new Mock<IAccountsService>();
        _mockPermissionDbSet = new Mock<DbSet<ApiKeyAccountPoolPermission>>();
        _mockApiKeyDbSet = new Mock<DbSet<ApiKey>>();
        _mockAccountsDbSet = new Mock<DbSet<Accounts>>();

        // 设置DbSet模拟
        _mockContext.Setup(x => x.ApiKeyAccountPoolPermissions).Returns(_mockPermissionDbSet.Object);
        _mockContext.Setup(x => x.ApiKeys).Returns(_mockApiKeyDbSet.Object);
        _mockContext.Setup(x => x.Accounts).Returns(_mockAccountsDbSet.Object);

        _service = new ApiKeyAccountPermissionService(
            _mockContext.Object,
            _mockLogger.Object,
            _mockAccountsService.Object);
    }

    #region AddPermissionAsync Tests

    [Fact]
    public async Task AddPermissionAsync_ValidInput_ShouldCreatePermission()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var apiKey = new ApiKey { Id = apiKeyId, Name = "test-key" };
        var accountPoolGroup = "premium-group";
        var allowedPlatforms = new[] { "claude", "openai" };

        _mockApiKeyDbSet.Setup(x => x.FindAsync(apiKeyId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(apiKey);

        _mockPermissionDbSet.SetupSequence(x => x.FirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<ApiKeyAccountPoolPermission, bool>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ApiKeyAccountPoolPermission?)null); // 不存在重复权限

        _mockContext.Setup(x => x.SaveAsync(It.IsAny<CancellationToken>()))
                   .ReturnsAsync(1);

        // Act
        var result = await _service.AddPermissionAsync(
            apiKeyId,
            accountPoolGroup,
            allowedPlatforms,
            selectionStrategy: "priority",
            priority: 10);

        // Assert
        result.Should().NotBeNull();
        result.ApiKeyId.Should().Be(apiKeyId);
        result.AccountPoolGroup.Should().Be(accountPoolGroup);
        result.AllowedPlatforms.Should().BeEquivalentTo(allowedPlatforms);
        result.SelectionStrategy.Should().Be("priority");
        result.Priority.Should().Be(10);
        result.IsEnabled.Should().BeTrue();

        _mockPermissionDbSet.Verify(x => x.Add(It.IsAny<ApiKeyAccountPoolPermission>()), Times.Once);
        _mockContext.Verify(x => x.SaveAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AddPermissionAsync_ApiKeyNotExists_ShouldThrowArgumentException()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var accountPoolGroup = "test-group";
        var allowedPlatforms = new[] { "claude" };

        _mockApiKeyDbSet.Setup(x => x.FindAsync(apiKeyId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync((ApiKey?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddPermissionAsync(apiKeyId, accountPoolGroup, allowedPlatforms));

        exception.Message.Should().Contain($"API Key {apiKeyId} 不存在");
        _mockPermissionDbSet.Verify(x => x.Add(It.IsAny<ApiKeyAccountPoolPermission>()), Times.Never);
    }

    [Fact]
    public async Task AddPermissionAsync_DuplicatePermission_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var apiKey = new ApiKey { Id = apiKeyId, Name = "test-key" };
        var accountPoolGroup = "test-group";
        var allowedPlatforms = new[] { "claude" };

        var existingPermission = new ApiKeyAccountPoolPermission
        {
            ApiKeyId = apiKeyId,
            AccountPoolGroup = accountPoolGroup
        };

        _mockApiKeyDbSet.Setup(x => x.FindAsync(apiKeyId, It.IsAny<CancellationToken>()))
                       .ReturnsAsync(apiKey);

        _mockPermissionDbSet.Setup(x => x.FirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<ApiKeyAccountPoolPermission, bool>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingPermission);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.AddPermissionAsync(apiKeyId, accountPoolGroup, allowedPlatforms));

        exception.Message.Should().Contain($"API Key {apiKeyId} 已存在对账号池 {accountPoolGroup} 的权限规则");
        _mockPermissionDbSet.Verify(x => x.Add(It.IsAny<ApiKeyAccountPoolPermission>()), Times.Never);
    }

    #endregion

    #region GetAllowedAccountsAsync Tests

    [Fact]
    public async Task GetAllowedAccountsAsync_WithValidPermissions_ShouldReturnFilteredAccounts()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "claude", "openai" },
                IsEnabled = true,
                Priority = 1
            },
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group2",
                AllowedPlatforms = new[] { "gemini" },
                IsEnabled = true,
                Priority = 2
            }
        };

        var accounts = new List<Accounts>
        {
            new() { Id = "acc1", Platform = platform, PoolGroup = "group1", Priority = 1 },
            new() { Id = "acc2", Platform = platform, PoolGroup = "group1", Priority = 2 }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());
        SetupDbSetQueryable(_mockAccountsDbSet, accounts.AsQueryable());

        _mockAccountsService.Setup(x => x.IsAccountAvailableAsync(It.IsAny<Accounts>(), It.IsAny<CancellationToken>()))
                          .ReturnsAsync(true);

        // Act
        var result = await _service.GetAllowedAccountsAsync(apiKeyId, platform);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(a => a.Platform == platform);
        result.Should().OnlyContain(a => a.PoolGroup == "group1");
    }

    [Fact]
    public async Task GetAllowedAccountsAsync_NoValidPermissions_ShouldReturnEmptyList()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "openai" }, // 不包含请求的平台
                IsEnabled = true,
                Priority = 1
            }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());

        // Act
        var result = await _service.GetAllowedAccountsAsync(apiKeyId, platform);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllowedAccountsAsync_WithSpecificAccountIds_ShouldFilterByAccountIds()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "claude" },
                AllowedAccountIds = new[] { "acc1", "acc3" }, // 只允许特定账户
                IsEnabled = true,
                Priority = 1
            }
        };

        var accounts = new List<Accounts>
        {
            new() { Id = "acc1", Platform = platform, PoolGroup = "group1", Priority = 1 },
            new() { Id = "acc2", Platform = platform, PoolGroup = "group1", Priority = 2 },
            new() { Id = "acc3", Platform = platform, PoolGroup = "group1", Priority = 3 }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());
        SetupDbSetQueryable(_mockAccountsDbSet, accounts.AsQueryable());

        _mockAccountsService.Setup(x => x.IsAccountAvailableAsync(It.IsAny<Accounts>(), It.IsAny<CancellationToken>()))
                          .ReturnsAsync(true);

        // Act
        var result = await _service.GetAllowedAccountsAsync(apiKeyId, platform);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(a => a.Id == "acc1" || a.Id == "acc3");
    }

    #endregion

    #region SelectBestAccountAsync Tests

    [Theory]
    [InlineData("priority")]
    [InlineData("round_robin")]
    [InlineData("random")]
    [InlineData("performance")]
    public async Task SelectBestAccountAsync_WithAvailableAccounts_ShouldReturnAccount(string strategy)
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "claude" },
                SelectionStrategy = strategy,
                IsEnabled = true,
                Priority = 1
            }
        };

        var accounts = new List<Accounts>
        {
            new() { Id = "acc1", Platform = platform, PoolGroup = "group1", Priority = 1, Weight = 100 },
            new() { Id = "acc2", Platform = platform, PoolGroup = "group1", Priority = 2, Weight = 80 },
            new() { Id = "acc3", Platform = platform, PoolGroup = "group1", Priority = 3, Weight = 90 }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());
        SetupDbSetQueryable(_mockAccountsDbSet, accounts.AsQueryable());

        _mockAccountsService.Setup(x => x.IsAccountAvailableAsync(It.IsAny<Accounts>(), It.IsAny<CancellationToken>()))
                          .ReturnsAsync(true);

        // Act
        var result = await _service.SelectBestAccountAsync(apiKeyId, platform);

        // Assert
        result.Should().NotBeNull();
        result!.Platform.Should().Be(platform);
        result.PoolGroup.Should().Be("group1");
    }

    [Fact]
    public async Task SelectBestAccountAsync_NoAvailableAccounts_ShouldReturnNull()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "claude" },
                IsEnabled = true,
                Priority = 1
            }
        };

        var accounts = new List<Accounts>
        {
            new() { Id = "acc1", Platform = platform, PoolGroup = "group1", Priority = 1 }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());
        SetupDbSetQueryable(_mockAccountsDbSet, accounts.AsQueryable());

        // 模拟所有账户都不可用
        _mockAccountsService.Setup(x => x.IsAccountAvailableAsync(It.IsAny<Accounts>(), It.IsAny<CancellationToken>()))
                          .ReturnsAsync(false);

        // Act
        var result = await _service.SelectBestAccountAsync(apiKeyId, platform);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region HasPermissionAsync Tests

    [Fact]
    public async Task HasPermissionAsync_WithValidPermission_ShouldReturnTrue()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var accountId = "acc1";
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "claude" },
                IsEnabled = true,
                Priority = 1
            }
        };

        var accounts = new List<Accounts>
        {
            new() { Id = accountId, Platform = platform, PoolGroup = "group1", Priority = 1 }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());
        SetupDbSetQueryable(_mockAccountsDbSet, accounts.AsQueryable());

        _mockAccountsService.Setup(x => x.IsAccountAvailableAsync(It.IsAny<Accounts>(), It.IsAny<CancellationToken>()))
                          .ReturnsAsync(true);

        // Act
        var result = await _service.HasPermissionAsync(apiKeyId, accountId, platform);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task HasPermissionAsync_WithoutPermission_ShouldReturnFalse()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var accountId = "acc1";
        var platform = "claude";

        var permissions = new List<ApiKeyAccountPoolPermission>
        {
            new()
            {
                ApiKeyId = apiKeyId,
                AccountPoolGroup = "group1",
                AllowedPlatforms = new[] { "openai" }, // 不允许访问claude平台
                IsEnabled = true,
                Priority = 1
            }
        };

        SetupDbSetQueryable(_mockPermissionDbSet, permissions.AsQueryable());

        // Act
        var result = await _service.HasPermissionAsync(apiKeyId, accountId, platform);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Helper Methods

    private static void SetupDbSetQueryable<T>(Mock<DbSet<T>> mockDbSet, IQueryable<T> data) where T : class
    {
        mockDbSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(data.Provider);
        mockDbSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(data.Expression);
        mockDbSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(data.ElementType);
        mockDbSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(data.GetEnumerator());
    }

    #endregion

    #region IAsyncDisposable

    public async ValueTask DisposeAsync()
    {
        foreach (var disposable in _disposables)
        {
            disposable.Dispose();
        }
        _disposables.Clear();
        GC.SuppressFinalize(this);
    }

    #endregion
}
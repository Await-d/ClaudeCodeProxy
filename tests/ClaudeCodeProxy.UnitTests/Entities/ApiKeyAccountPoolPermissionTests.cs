using ClaudeCodeProxy.Domain;
using FluentAssertions;
using Xunit;

namespace ClaudeCodeProxy.UnitTests.Entities;

/// <summary>
/// API Key账号池权限实体单元测试
/// </summary>
public class ApiKeyAccountPoolPermissionTests
{
    #region IsEffective Tests

    [Fact]
    public void IsEffective_EnabledWithoutTimeRestrictions_ShouldReturnTrue()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            EffectiveFrom = null,
            EffectiveTo = null
        };

        // Act
        var result = permission.IsEffective();

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEffective_DisabledPermission_ShouldReturnFalse()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = false,
            EffectiveFrom = null,
            EffectiveTo = null
        };

        // Act
        var result = permission.IsEffective();

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEffective_WithinTimeWindow_ShouldReturnTrue()
    {
        // Arrange
        var now = DateTime.UtcNow;
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            EffectiveFrom = now.AddDays(-1),
            EffectiveTo = now.AddDays(1)
        };

        // Act
        var result = permission.IsEffective(now);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEffective_BeforeEffectiveFrom_ShouldReturnFalse()
    {
        // Arrange
        var checkTime = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            EffectiveFrom = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            EffectiveTo = new DateTime(2024, 12, 31, 23, 59, 59, DateTimeKind.Utc)
        };

        // Act
        var result = permission.IsEffective(checkTime);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEffective_AfterEffectiveTo_ShouldReturnFalse()
    {
        // Arrange
        var checkTime = new DateTime(2025, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            EffectiveFrom = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EffectiveTo = new DateTime(2024, 12, 31, 23, 59, 59, DateTimeKind.Utc)
        };

        // Act
        var result = permission.IsEffective(checkTime);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEffective_ExactlyAtEffectiveFrom_ShouldReturnTrue()
    {
        // Arrange
        var exactTime = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            EffectiveFrom = exactTime,
            EffectiveTo = new DateTime(2024, 12, 31, 23, 59, 59, DateTimeKind.Utc)
        };

        // Act
        var result = permission.IsEffective(exactTime);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEffective_ExactlyAtEffectiveTo_ShouldReturnTrue()
    {
        // Arrange
        var exactTime = new DateTime(2024, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            EffectiveFrom = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EffectiveTo = exactTime
        };

        // Act
        var result = permission.IsEffective(exactTime);

        // Assert
        result.Should().BeTrue();
    }

    #endregion

    #region CanAccessPlatform Tests

    [Theory]
    [InlineData("claude", new[] { "claude" }, true)]
    [InlineData("claude", new[] { "claude", "openai" }, true)]
    [InlineData("claude", new[] { "openai" }, false)]
    [InlineData("claude", new[] { "CLAUDE" }, true)] // 大小写不敏感
    [InlineData("CLAUDE", new[] { "claude" }, true)] // 大小写不敏感
    [InlineData("gemini", new[] { "claude", "openai" }, false)]
    public void CanAccessPlatform_WithSpecificPlatforms_ShouldReturnExpectedResult(
        string platform, string[] allowedPlatforms, bool expected)
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedPlatforms = allowedPlatforms
        };

        // Act
        var result = permission.CanAccessPlatform(platform);

        // Assert
        result.Should().Be(expected);
    }

    [Theory]
    [InlineData("claude")]
    [InlineData("openai")]
    [InlineData("gemini")]
    [InlineData("any-platform")]
    public void CanAccessPlatform_WithAllPlatforms_ShouldAlwaysReturnTrue(string platform)
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedPlatforms = new[] { "all" }
        };

        // Act
        var result = permission.CanAccessPlatform(platform);

        // Assert
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("ALL")]
    [InlineData("All")]
    [InlineData("aLL")]
    public void CanAccessPlatform_WithAllPlatformsCaseInsensitive_ShouldReturnTrue(string allValue)
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedPlatforms = new[] { allValue }
        };

        // Act
        var result = permission.CanAccessPlatform("claude");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CanAccessPlatform_WithEmptyPlatforms_ShouldReturnFalse()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedPlatforms = Array.Empty<string>()
        };

        // Act
        var result = permission.CanAccessPlatform("claude");

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region CanAccessAccount Tests

    [Fact]
    public void CanAccessAccount_WithNullAllowedAccountIds_ShouldReturnTrue()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedAccountIds = null
        };

        // Act
        var result = permission.CanAccessAccount("any-account-id");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void CanAccessAccount_WithEmptyAllowedAccountIds_ShouldReturnTrue()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedAccountIds = Array.Empty<string>()
        };

        // Act
        var result = permission.CanAccessAccount("any-account-id");

        // Assert
        result.Should().BeTrue();
    }

    [Theory]
    [InlineData("acc1", new[] { "acc1", "acc2" }, true)]
    [InlineData("acc2", new[] { "acc1", "acc2" }, true)]
    [InlineData("acc3", new[] { "acc1", "acc2" }, false)]
    [InlineData("ACC1", new[] { "acc1", "acc2" }, true)] // 大小写不敏感
    [InlineData("acc1", new[] { "ACC1", "ACC2" }, true)] // 大小写不敏感
    public void CanAccessAccount_WithSpecificAccountIds_ShouldReturnExpectedResult(
        string accountId, string[] allowedAccountIds, bool expected)
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedAccountIds = allowedAccountIds
        };

        // Act
        var result = permission.CanAccessAccount(accountId);

        // Assert
        result.Should().Be(expected);
    }

    #endregion

    #region Complex Scenarios Tests

    [Fact]
    public void Permission_ComplexScenario_ShouldWorkCorrectly()
    {
        // Arrange - 创建一个复杂的权限场景
        var permission = new ApiKeyAccountPoolPermission
        {
            Id = Guid.NewGuid(),
            ApiKeyId = Guid.NewGuid(),
            AccountPoolGroup = "premium-group",
            AllowedPlatforms = new[] { "claude", "openai" },
            AllowedAccountIds = new[] { "premium-acc1", "premium-acc2" },
            SelectionStrategy = "priority",
            Priority = 10,
            IsEnabled = true,
            EffectiveFrom = DateTime.UtcNow.AddDays(-1),
            EffectiveTo = DateTime.UtcNow.AddDays(30)
        };

        // Act & Assert - 验证多个条件组合
        permission.IsEffective().Should().BeTrue();
        permission.CanAccessPlatform("claude").Should().BeTrue();
        permission.CanAccessPlatform("openai").Should().BeTrue();
        permission.CanAccessPlatform("gemini").Should().BeFalse();
        permission.CanAccessAccount("premium-acc1").Should().BeTrue();
        permission.CanAccessAccount("premium-acc2").Should().BeTrue();
        permission.CanAccessAccount("other-acc").Should().BeFalse();
    }

    [Fact]
    public void Permission_DisabledPermission_ShouldRejectAllAccess()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = false, // 权限被禁用
            AllowedPlatforms = new[] { "all" },
            AllowedAccountIds = null // 允许所有账户
        };

        // Act & Assert - 即使其他条件都满足，禁用的权限应该拒绝所有访问
        permission.IsEffective().Should().BeFalse();
        // 注意：CanAccessPlatform 和 CanAccessAccount 不检查 IsEnabled 状态
        // 这是设计上的考虑，因为 IsEffective 已经包含了完整的有效性检查
    }

    [Fact]
    public void Permission_ExpiredPermission_ShouldBeIneffective()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            AllowedPlatforms = new[] { "claude" },
            EffectiveFrom = DateTime.UtcNow.AddDays(-30),
            EffectiveTo = DateTime.UtcNow.AddDays(-1) // 昨天过期
        };

        // Act & Assert
        permission.IsEffective().Should().BeFalse();
        permission.CanAccessPlatform("claude").Should().BeTrue(); // 平台访问检查不考虑时间
    }

    [Fact]
    public void Permission_FuturePermission_ShouldBeIneffective()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            IsEnabled = true,
            AllowedPlatforms = new[] { "claude" },
            EffectiveFrom = DateTime.UtcNow.AddDays(1), // 明天才生效
            EffectiveTo = DateTime.UtcNow.AddDays(30)
        };

        // Act & Assert
        permission.IsEffective().Should().BeFalse();
        permission.CanAccessPlatform("claude").Should().BeTrue(); // 平台访问检查不考虑时间
    }

    #endregion

    #region Edge Cases Tests

    [Fact]
    public void IsEffective_DefaultConstructor_ShouldReturnTrue()
    {
        // Arrange - 使用默认构造函数创建权限
        var permission = new ApiKeyAccountPoolPermission();
        // 默认值：IsEnabled = true, EffectiveFrom = null, EffectiveTo = null

        // Act
        var result = permission.IsEffective();

        // Assert
        result.Should().BeTrue("默认权限应该有效");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CanAccessPlatform_WithInvalidPlatformInput_ShouldHandleGracefully(string platform)
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedPlatforms = new[] { "claude", "openai" }
        };

        // Act & Assert - 应该不抛异常，但返回false
        var result = permission.CanAccessPlatform(platform);
        result.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CanAccessAccount_WithInvalidAccountInput_ShouldHandleGracefully(string accountId)
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedAccountIds = new[] { "acc1", "acc2" }
        };

        // Act & Assert - 应该不抛异常，但返回false
        var result = permission.CanAccessAccount(accountId);
        result.Should().BeFalse();
    }

    [Fact]
    public void Permission_WithEmptyStringsInArrays_ShouldHandleCorrectly()
    {
        // Arrange
        var permission = new ApiKeyAccountPoolPermission
        {
            AllowedPlatforms = new[] { "", "claude", "", "openai" },
            AllowedAccountIds = new[] { "", "acc1", "", "acc2" }
        };

        // Act & Assert
        permission.CanAccessPlatform("claude").Should().BeTrue();
        permission.CanAccessPlatform("").Should().BeTrue(); // 空字符串在数组中，应该匹配
        permission.CanAccessAccount("acc1").Should().BeTrue();
        permission.CanAccessAccount("").Should().BeTrue(); // 空字符串在数组中，应该匹配
    }

    #endregion

    #region Property Tests

    [Fact]
    public void Permission_DefaultValues_ShouldBeCorrect()
    {
        // Arrange & Act
        var permission = new ApiKeyAccountPoolPermission();

        // Assert
        permission.AccountPoolGroup.Should().Be(string.Empty);
        permission.AllowedPlatforms.Should().BeEquivalentTo(Array.Empty<string>());
        permission.AllowedAccountIds.Should().BeNull();
        permission.SelectionStrategy.Should().Be("priority");
        permission.Priority.Should().Be(50);
        permission.IsEnabled.Should().BeTrue();
        permission.EffectiveFrom.Should().BeNull();
        permission.EffectiveTo.Should().BeNull();
    }

    [Fact]
    public void Permission_PropertyAssignment_ShouldWork()
    {
        // Arrange
        var apiKeyId = Guid.NewGuid();
        var permissionId = Guid.NewGuid();
        var createdAt = DateTime.UtcNow;
        var effectiveFrom = DateTime.UtcNow.AddDays(-1);
        var effectiveTo = DateTime.UtcNow.AddDays(30);

        // Act
        var permission = new ApiKeyAccountPoolPermission
        {
            Id = permissionId,
            ApiKeyId = apiKeyId,
            AccountPoolGroup = "test-group",
            AllowedPlatforms = new[] { "claude", "openai" },
            AllowedAccountIds = new[] { "acc1", "acc2" },
            SelectionStrategy = "round_robin",
            Priority = 20,
            IsEnabled = false,
            EffectiveFrom = effectiveFrom,
            EffectiveTo = effectiveTo,
            CreatedAt = createdAt
        };

        // Assert
        permission.Id.Should().Be(permissionId);
        permission.ApiKeyId.Should().Be(apiKeyId);
        permission.AccountPoolGroup.Should().Be("test-group");
        permission.AllowedPlatforms.Should().BeEquivalentTo(new[] { "claude", "openai" });
        permission.AllowedAccountIds.Should().BeEquivalentTo(new[] { "acc1", "acc2" });
        permission.SelectionStrategy.Should().Be("round_robin");
        permission.Priority.Should().Be(20);
        permission.IsEnabled.Should().BeFalse();
        permission.EffectiveFrom.Should().Be(effectiveFrom);
        permission.EffectiveTo.Should().Be(effectiveTo);
        permission.CreatedAt.Should().Be(createdAt);
    }

    #endregion
}
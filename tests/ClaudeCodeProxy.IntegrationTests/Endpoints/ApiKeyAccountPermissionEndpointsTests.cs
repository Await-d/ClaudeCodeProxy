using ClaudeCodeProxy.IntegrationTests.Infrastructure;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ClaudeCodeProxy.IntegrationTests.Endpoints;

/// <summary>
/// API Key账号池权限端点集成测试
/// </summary>
public class ApiKeyAccountPermissionEndpointsTests : IClassFixture<TestWebApplicationFactory<Program>>, IAsyncDisposable
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly Guid _testApiKeyId = Guid.Parse("12345678-1234-1234-1234-123456789012");

    public ApiKeyAccountPermissionEndpointsTests(TestWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    #region Setup & Cleanup

    [Fact]
    public async Task Setup_TestEnvironment_ShouldInitializeCorrectly()
    {
        // Arrange & Act
        await _factory.InitializeTestDataAsync();

        // Assert - 验证测试数据已正确初始化
        var response = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region GET Tests

    [Fact]
    public async Task GET_GetPermissions_WithValidApiKeyId_ShouldReturn200()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();

        // Act
        var response = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        // 验证返回的权限数据
        var permissions = JsonSerializer.Deserialize<List<PermissionResponse>>(content, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        permissions.Should().NotBeEmpty();
        permissions.Should().Contain(p => p.AccountPoolGroup == "premium");
    }

    [Fact]
    public async Task GET_GetPermissions_WithInvalidApiKeyId_ShouldReturn404()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var invalidApiKeyId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/apikey-account-permissions/{invalidApiKeyId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GET_GetAllowedAccounts_WithValidParameters_ShouldReturn200()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var platform = "claude";

        // Act
        var response = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}/allowed-accounts?platform={platform}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var accounts = JsonSerializer.Deserialize<List<AccountResponse>>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        accounts.Should().NotBeEmpty();
        accounts.Should().OnlyContain(a => a.Platform == platform);
    }

    [Fact]
    public async Task GET_SelectBestAccount_WithValidParameters_ShouldReturn200()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var platform = "claude";

        // Act
        var response = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}/select-account?platform={platform}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var account = JsonSerializer.Deserialize<AccountResponse>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        account.Should().NotBeNull();
        account!.Platform.Should().Be(platform);
    }

    #endregion

    #region POST Tests

    [Fact]
    public async Task POST_AddPermission_WithValidData_ShouldReturn201()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var newPermission = new
        {
            AccountPoolGroup = "standard",
            AllowedPlatforms = new[] { "openai", "gemini" },
            AllowedAccountIds = new[] { "test-openai-acc-1" },
            SelectionStrategy = "round_robin",
            Priority = 20,
            IsEnabled = true
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/apikey-account-permissions/{_testApiKeyId}", newPermission);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var location = response.Headers.Location;
        location.Should().NotBeNull();

        var content = await response.Content.ReadAsStringAsync();
        var createdPermission = JsonSerializer.Deserialize<PermissionResponse>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        createdPermission.Should().NotBeNull();
        createdPermission!.AccountPoolGroup.Should().Be("standard");
        createdPermission.AllowedPlatforms.Should().BeEquivalentTo(new[] { "openai", "gemini" });
        createdPermission.SelectionStrategy.Should().Be("round_robin");
    }

    [Fact]
    public async Task POST_AddPermission_WithInvalidData_ShouldReturn400()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var invalidPermission = new
        {
            // 缺少必需字段
            AllowedPlatforms = new[] { "claude" }
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/apikey-account-permissions/{_testApiKeyId}", invalidPermission);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_AddPermission_DuplicatePermission_ShouldReturn409()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var duplicatePermission = new
        {
            AccountPoolGroup = "premium", // 已存在的分组
            AllowedPlatforms = new[] { "claude" },
            SelectionStrategy = "priority",
            Priority = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/apikey-account-permissions/{_testApiKeyId}", duplicatePermission);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    #endregion

    #region PUT Tests

    [Fact]
    public async Task PUT_BatchUpdatePermissions_WithValidData_ShouldReturn200()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var permissions = new[]
        {
            new
            {
                AccountPoolGroup = "premium-updated",
                AllowedPlatforms = new[] { "claude", "openai" },
                SelectionStrategy = "performance",
                Priority = 5,
                IsEnabled = true
            },
            new
            {
                AccountPoolGroup = "standard-new",
                AllowedPlatforms = new[] { "gemini" },
                SelectionStrategy = "random",
                Priority = 15,
                IsEnabled = true
            }
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/apikey-account-permissions/{_testApiKeyId}/batch", permissions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // 验证更新后的权限
        var getResponse = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await getResponse.Content.ReadAsStringAsync();
        var updatedPermissions = JsonSerializer.Deserialize<List<PermissionResponse>>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        updatedPermissions.Should().HaveCount(2);
        updatedPermissions.Should().Contain(p => p.AccountPoolGroup == "premium-updated");
        updatedPermissions.Should().Contain(p => p.AccountPoolGroup == "standard-new");
    }

    #endregion

    #region DELETE Tests

    [Fact]
    public async Task DELETE_RemovePermission_WithValidData_ShouldReturn200()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var accountPoolGroup = "premium";

        // Act
        var response = await _client.DeleteAsync($"/api/apikey-account-permissions/{_testApiKeyId}/{accountPoolGroup}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // 验证权限已被删除
        var getResponse = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}");
        var content = await getResponse.Content.ReadAsStringAsync();
        var permissions = JsonSerializer.Deserialize<List<PermissionResponse>>(content,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        permissions.Should().NotContain(p => p.AccountPoolGroup == accountPoolGroup);
    }

    [Fact]
    public async Task DELETE_RemovePermission_WithNonExistentPermission_ShouldReturn404()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var nonExistentGroup = "non-existent-group";

        // Act
        var response = await _client.DeleteAsync($"/api/apikey-account-permissions/{_testApiKeyId}/{nonExistentGroup}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Authorization Tests

    [Fact]
    public async Task GET_WithoutAuthentication_ShouldReturn401()
    {
        // Arrange
        var unauthenticatedClient = _factory.CreateClient();
        // 移除默认的测试认证
        unauthenticatedClient.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await unauthenticatedClient.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Performance Tests

    [Fact]
    public async Task GET_GetPermissions_ShouldCompleteWithin5Seconds()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var response = await _client.GetAsync($"/api/apikey-account-permissions/{_testApiKeyId}");

        // Assert
        stopwatch.Stop();
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000);
    }

    [Fact]
    public async Task POST_AddPermission_ShouldCompleteWithin3Seconds()
    {
        // Arrange
        await _factory.InitializeTestDataAsync();
        var newPermission = new
        {
            AccountPoolGroup = "performance-test-group",
            AllowedPlatforms = new[] { "claude" },
            SelectionStrategy = "priority",
            Priority = 30
        };

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // Act
        var response = await _client.PostAsJsonAsync($"/api/apikey-account-permissions/{_testApiKeyId}", newPermission);

        // Assert
        stopwatch.Stop();
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(3000);
    }

    #endregion

    #region Helper Classes

    private class PermissionResponse
    {
        public Guid Id { get; set; }
        public Guid ApiKeyId { get; set; }
        public string AccountPoolGroup { get; set; } = string.Empty;
        public string[] AllowedPlatforms { get; set; } = Array.Empty<string>();
        public string[]? AllowedAccountIds { get; set; }
        public string SelectionStrategy { get; set; } = string.Empty;
        public int Priority { get; set; }
        public bool IsEnabled { get; set; }
        public DateTime? EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    private class AccountResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string PoolGroup { get; set; } = string.Empty;
        public int Priority { get; set; }
        public int Weight { get; set; }
        public bool IsEnabled { get; set; }
    }

    #endregion

    #region IAsyncDisposable

    public async ValueTask DisposeAsync()
    {
        await _factory.CleanupTestDataAsync();
        _client.Dispose();
        GC.SuppressFinalize(this);
    }

    #endregion
}
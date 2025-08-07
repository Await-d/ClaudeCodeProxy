using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Services;
using ClaudeCodeProxy.Host.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// API Key 账号池权限管理端点
/// </summary>
public static class ApiKeyAccountPermissionEndpoints
{
    /// <summary>
    /// 配置API Key账号池权限相关路由
    /// </summary>
    public static void MapApiKeyAccountPermissionEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/apikey-permissions")
            .WithTags("ApiKeyAccountPermission")
            .WithOpenApi();

        #region 权限管理端点

        // 获取API Key的账号池权限列表
        group.MapGet("/{apiKeyId:guid}", GetPermissions)
            .WithName("GetApiKeyAccountPermissions")
            .WithSummary("获取API Key的账号池权限列表")
            .WithDescription("获取指定API Key的所有账号池权限配置")
            .Produces<List<ApiKeyAccountPoolPermissionResponse>>();

        // 为API Key添加账号池权限
        group.MapPost("/{apiKeyId:guid}", AddPermission)
            .WithName("AddApiKeyAccountPermission")
            .WithSummary("为API Key添加账号池权限")
            .WithDescription("为指定API Key添加新的账号池访问权限")
            .Produces<ApiKeyAccountPoolPermissionResponse>(201)
            .Produces<string>(400);

        // 移除API Key的账号池权限
        group.MapDelete("/{apiKeyId:guid}/{accountPoolGroup}", RemovePermission)
            .WithName("RemoveApiKeyAccountPermission")
            .WithSummary("移除API Key的账号池权限")
            .WithDescription("移除指定API Key对特定账号池的访问权限")
            .Produces(204)
            .Produces<string>(404);

        // 批量更新API Key权限
        group.MapPut("/{apiKeyId:guid}/batch", BatchUpdatePermissions)
            .WithName("BatchUpdateApiKeyAccountPermissions")
            .WithSummary("批量更新API Key权限")
            .WithDescription("批量更新指定API Key的所有账号池权限")
            .Produces<BatchUpdateResult>()
            .Produces<string>(400);

        // 检查API Key对特定账户的访问权限
        group.MapGet("/{apiKeyId:guid}/check/{accountId}", CheckPermission)
            .WithName("CheckApiKeyAccountPermission")
            .WithSummary("检查API Key账户访问权限")
            .WithDescription("检查指定API Key是否有权限访问特定账户")
            .Produces<PermissionCheckResponse>();

        // 获取API Key可访问的账户列表
        group.MapGet("/{apiKeyId:guid}/allowed-accounts", GetAllowedAccounts)
            .WithName("GetApiKeyAllowedAccounts")
            .WithSummary("获取API Key可访问的账户列表")
            .WithDescription("根据权限配置获取API Key可以访问的所有账户")
            .Produces<List<AllowedAccountResponse>>();

        #endregion

        #region 账号池管理端点

        // 获取所有账号池分组
        group.MapGet("/pools", GetAccountPools)
            .WithName("GetAccountPools")
            .WithSummary("获取所有账号池分组")
            .WithDescription("获取系统中所有可用的账号池分组信息")
            .Produces<List<AccountPoolInfo>>();

        // 获取指定账号池的详细信息
        group.MapGet("/pools/{poolGroup}", GetAccountPoolDetails)
            .WithName("GetAccountPoolDetails")
            .WithSummary("获取账号池详细信息")
            .WithDescription("获取指定账号池分组的详细信息和包含的账户")
            .Produces<AccountPoolDetails>()
            .Produces<string>(404);

        #endregion
    }

    #region 权限管理端点实现

    /// <summary>
    /// 获取API Key的账号池权限列表
    /// </summary>
    private static async Task<Results<Ok<List<ApiKeyAccountPoolPermissionResponse>>, BadRequest<string>>> GetPermissions(
        Guid apiKeyId,
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var permissions = await permissionService.GetPermissionsAsync(apiKeyId, cancellationToken);
            var response = permissions.Select(MapToPermissionResponse).ToList();
            
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取权限列表失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 为API Key添加账号池权限
    /// </summary>
    private static async Task<Results<Created<ApiKeyAccountPoolPermissionResponse>, BadRequest<string>>> AddPermission(
        Guid apiKeyId,
        ApiKeyAccountPoolPermissionRequest request,
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var permission = await permissionService.AddPermissionAsync(
                apiKeyId,
                request.AccountPoolGroup,
                request.AllowedPlatforms,
                request.AllowedAccountIds,
                request.SelectionStrategy,
                request.Priority,
                cancellationToken);

            var response = MapToPermissionResponse(permission);
            return TypedResults.Created($"/api/apikey-permissions/{apiKeyId}", response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"添加权限失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 移除API Key的账号池权限
    /// </summary>
    private static async Task<Results<NoContent, NotFound<string>>> RemovePermission(
        Guid apiKeyId,
        string accountPoolGroup,
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await permissionService.RemovePermissionAsync(apiKeyId, accountPoolGroup, cancellationToken);
            if (!success)
            {
                return TypedResults.NotFound($"未找到API Key {apiKeyId} 对账号池 {accountPoolGroup} 的权限");
            }

            return TypedResults.NoContent();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"移除权限失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 批量更新API Key权限
    /// </summary>
    private static async Task<Results<Ok<BatchUpdateResult>, BadRequest<string>>> BatchUpdatePermissions(
        Guid apiKeyId,
        List<ApiKeyAccountPoolPermissionRequest> permissions,
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await permissionService.BatchUpdatePermissionsAsync(apiKeyId, permissions, cancellationToken);
            
            var result = new BatchUpdateResult
            {
                Success = success,
                UpdatedCount = permissions.Count,
                Message = success ? "批量更新成功" : "批量更新失败"
            };

            return TypedResults.Ok(result);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"批量更新权限失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 检查API Key对特定账户的访问权限
    /// </summary>
    private static async Task<Results<Ok<PermissionCheckResponse>, BadRequest<string>>> CheckPermission(
        Guid apiKeyId,
        string accountId,
        string platform,
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var hasPermission = await permissionService.HasPermissionAsync(apiKeyId, accountId, platform, cancellationToken);
            
            var response = new PermissionCheckResponse
            {
                ApiKeyId = apiKeyId,
                AccountId = accountId,
                Platform = platform,
                HasPermission = hasPermission,
                CheckedAt = DateTime.UtcNow
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"检查权限失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取API Key可访问的账户列表
    /// </summary>
    private static async Task<Results<Ok<List<AllowedAccountResponse>>, BadRequest<string>>> GetAllowedAccounts(
        Guid apiKeyId,
        string platform,
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accounts = await permissionService.GetAllowedAccountsAsync(apiKeyId, platform, cancellationToken);
            var response = accounts.Select(MapToAllowedAccountResponse).ToList();
            
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取允许访问的账户列表失败: {ex.Message}");
        }
    }

    #endregion

    #region 账号池管理端点实现

    /// <summary>
    /// 获取所有账号池分组
    /// </summary>
    private static async Task<Results<Ok<List<AccountPoolInfo>>, BadRequest<string>>> GetAccountPools(
        IContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var pools = await context.Accounts
                .Where(a => !string.IsNullOrEmpty(a.PoolGroup))
                .GroupBy(a => a.PoolGroup)
                .Select(g => new AccountPoolInfo
                {
                    PoolGroup = g.Key!,
                    AccountCount = g.Count(),
                    EnabledAccountCount = g.Count(a => a.IsEnabled),
                    Platforms = g.Select(a => a.Platform).Distinct().ToList(),
                    Description = $"账号池分组 {g.Key}"
                })
                .ToListAsync(cancellationToken);

            return TypedResults.Ok(pools);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取账号池列表失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取指定账号池的详细信息
    /// </summary>
    private static async Task<Results<Ok<AccountPoolDetails>, NotFound<string>>> GetAccountPoolDetails(
        string poolGroup,
        IContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accounts = await context.Accounts
                .Where(a => a.PoolGroup == poolGroup)
                .ToListAsync(cancellationToken);

            if (!accounts.Any())
            {
                return TypedResults.NotFound($"账号池分组 {poolGroup} 不存在或没有账户");
            }

            var details = new AccountPoolDetails
            {
                PoolGroup = poolGroup,
                Description = $"账号池分组 {poolGroup} 的详细信息",
                TotalAccounts = accounts.Count,
                EnabledAccounts = accounts.Count(a => a.IsEnabled),
                Platforms = accounts.GroupBy(a => a.Platform).ToDictionary(g => g.Key, g => g.Count()),
                Accounts = accounts.Select(a => new AccountSummary
                {
                    Id = a.Id,
                    Name = a.Name,
                    Platform = a.Platform,
                    IsEnabled = a.IsEnabled,
                    Status = a.Status,
                    Priority = a.Priority,
                    Weight = a.Weight,
                    UsageCount = a.UsageCount
                }).ToList()
            };

            return TypedResults.Ok(details);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取账号池详细信息失败: {ex.Message}");
        }
    }

    #endregion

    #region 辅助方法

    /// <summary>
    /// 映射到权限响应模型
    /// </summary>
    private static ApiKeyAccountPoolPermissionResponse MapToPermissionResponse(ApiKeyAccountPoolPermission permission)
    {
        return new ApiKeyAccountPoolPermissionResponse
        {
            Id = permission.Id,
            ApiKeyId = permission.ApiKeyId,
            AccountPoolGroup = permission.AccountPoolGroup,
            AllowedPlatforms = permission.AllowedPlatforms,
            AllowedAccountIds = permission.AllowedAccountIds,
            SelectionStrategy = permission.SelectionStrategy,
            Priority = permission.Priority,
            IsEnabled = permission.IsEnabled,
            EffectiveFrom = permission.EffectiveFrom,
            EffectiveTo = permission.EffectiveTo,
            CreatedAt = permission.CreatedAt,
            ModifiedAt = permission.ModifiedAt,
            IsEffective = permission.IsEffective()
        };
    }

    /// <summary>
    /// 映射到允许访问的账户响应模型
    /// </summary>
    private static AllowedAccountResponse MapToAllowedAccountResponse(Accounts account)
    {
        return new AllowedAccountResponse
        {
            Id = account.Id,
            Name = account.Name,
            Platform = account.Platform,
            PoolGroup = account.PoolGroup,
            IsEnabled = account.IsEnabled,
            Status = account.Status,
            Priority = account.Priority,
            Weight = account.Weight,
            UsageCount = account.UsageCount,
            LastUsedAt = account.LastUsedAt
        };
    }

    #endregion
}

#region 响应模型定义

/// <summary>
/// API Key账号池权限响应模型
/// </summary>
public class ApiKeyAccountPoolPermissionResponse
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
    public DateTime? ModifiedAt { get; set; }
    public bool IsEffective { get; set; }
}

/// <summary>
/// 权限检查响应模型
/// </summary>
public class PermissionCheckResponse
{
    public Guid ApiKeyId { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public bool HasPermission { get; set; }
    public DateTime CheckedAt { get; set; }
}

/// <summary>
/// 允许访问的账户响应模型
/// </summary>
public class AllowedAccountResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string? PoolGroup { get; set; }
    public bool IsEnabled { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Priority { get; set; }
    public int Weight { get; set; }
    public long UsageCount { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

/// <summary>
/// 批量更新结果
/// </summary>
public class BatchUpdateResult
{
    public bool Success { get; set; }
    public int UpdatedCount { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// 账号池信息
/// </summary>
public class AccountPoolInfo
{
    public string PoolGroup { get; set; } = string.Empty;
    public int AccountCount { get; set; }
    public int EnabledAccountCount { get; set; }
    public List<string> Platforms { get; set; } = new();
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// 账号池详细信息
/// </summary>
public class AccountPoolDetails
{
    public string PoolGroup { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TotalAccounts { get; set; }
    public int EnabledAccounts { get; set; }
    public Dictionary<string, int> Platforms { get; set; } = new();
    public List<AccountSummary> Accounts { get; set; } = new();
}

/// <summary>
/// 账户摘要信息
/// </summary>
public class AccountSummary
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Priority { get; set; }
    public int Weight { get; set; }
    public long UsageCount { get; set; }
}

#endregion
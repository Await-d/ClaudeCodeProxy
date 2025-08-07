using ClaudeCodeProxy.Domain;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// API Key 账号池权限管理服务接口
/// </summary>
public interface IApiKeyAccountPermissionService
{
    /// <summary>
    /// 为API Key添加账号池权限
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="accountPoolGroup">账号池分组</param>
    /// <param name="allowedPlatforms">允许的平台</param>
    /// <param name="allowedAccountIds">允许的具体账户ID（可选）</param>
    /// <param name="selectionStrategy">选择策略</param>
    /// <param name="priority">优先级</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>权限映射实体</returns>
    Task<ApiKeyAccountPoolPermission> AddPermissionAsync(
        Guid apiKeyId,
        string accountPoolGroup,
        string[] allowedPlatforms,
        string[]? allowedAccountIds = null,
        string selectionStrategy = "priority",
        int priority = 50,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 移除API Key的账号池权限
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="accountPoolGroup">账号池分组</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否成功移除</returns>
    Task<bool> RemovePermissionAsync(
        Guid apiKeyId,
        string accountPoolGroup,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取API Key的所有账号池权限
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>权限列表</returns>
    Task<List<ApiKeyAccountPoolPermission>> GetPermissionsAsync(
        Guid apiKeyId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据权限获取API Key可访问的账户列表
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="platform">请求的平台</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>可访问的账户列表</returns>
    Task<List<Accounts>> GetAllowedAccountsAsync(
        Guid apiKeyId,
        string platform,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 从允许的账户中选择最佳账户
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="platform">平台类型</param>
    /// <param name="sessionHash">会话哈希（用于一致性哈希）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选择的账户</returns>
    Task<Accounts?> SelectBestAccountAsync(
        Guid apiKeyId,
        string platform,
        string? sessionHash = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 检查API Key是否有权限访问指定账户
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="accountId">账户ID</param>
    /// <param name="platform">平台类型</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否有权限</returns>
    Task<bool> HasPermissionAsync(
        Guid apiKeyId,
        string accountId,
        string platform,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批量更新API Key权限
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="permissions">权限配置列表</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新结果</returns>
    Task<bool> BatchUpdatePermissionsAsync(
        Guid apiKeyId,
        List<ApiKeyAccountPoolPermissionRequest> permissions,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// API Key 账号池权限请求模型
/// </summary>
public class ApiKeyAccountPoolPermissionRequest
{
    public string AccountPoolGroup { get; set; } = string.Empty;
    public string[] AllowedPlatforms { get; set; } = Array.Empty<string>();
    public string[]? AllowedAccountIds { get; set; }
    public string SelectionStrategy { get; set; } = "priority";
    public int Priority { get; set; } = 50;
    public bool IsEnabled { get; set; } = true;
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}
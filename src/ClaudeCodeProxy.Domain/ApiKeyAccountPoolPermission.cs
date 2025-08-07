namespace ClaudeCodeProxy.Domain;

/// <summary>
/// API Key 到账号池的权限映射实体
/// </summary>
public class ApiKeyAccountPoolPermission : Entity<Guid>
{
    /// <summary>
    /// API Key ID
    /// </summary>
    public Guid ApiKeyId { get; set; }

    /// <summary>
    /// 关联的 API Key
    /// </summary>
    public ApiKey? ApiKey { get; set; }

    /// <summary>
    /// 允许访问的账户分组名称
    /// </summary>
    public string AccountPoolGroup { get; set; } = string.Empty;

    /// <summary>
    /// 允许访问的平台类型：claude, claude-console, gemini, openai, all
    /// </summary>
    public string[] AllowedPlatforms { get; set; } = Array.Empty<string>();

    /// <summary>
    /// 允许访问的具体账户ID列表（可选，为空则访问整个分组）
    /// </summary>
    public string[]? AllowedAccountIds { get; set; }

    /// <summary>
    /// 账户选择策略：priority(优先级), round_robin(轮询), random(随机), performance(性能优先)
    /// </summary>
    public string SelectionStrategy { get; set; } = "priority";

    /// <summary>
    /// 权限优先级（数字越小优先级越高）
    /// </summary>
    public int Priority { get; set; } = 50;

    /// <summary>
    /// 是否启用此权限规则
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 权限生效时间
    /// </summary>
    public DateTime? EffectiveFrom { get; set; }

    /// <summary>
    /// 权限到期时间
    /// </summary>
    public DateTime? EffectiveTo { get; set; }

    /// <summary>
    /// 检查权限是否生效
    /// </summary>
    public bool IsEffective(DateTime? checkTime = null)
    {
        var now = checkTime ?? DateTime.UtcNow;
        
        if (!IsEnabled) return false;
        
        if (EffectiveFrom.HasValue && now < EffectiveFrom.Value) return false;
        
        if (EffectiveTo.HasValue && now > EffectiveTo.Value) return false;
        
        return true;
    }

    /// <summary>
    /// 检查是否允许访问指定平台
    /// </summary>
    public bool CanAccessPlatform(string platform)
    {
        if (AllowedPlatforms.Contains("all", StringComparer.OrdinalIgnoreCase))
            return true;
            
        return AllowedPlatforms.Contains(platform, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 检查是否允许访问指定账户
    /// </summary>
    public bool CanAccessAccount(string accountId)
    {
        // 如果没有指定具体账户，则允许访问分组内所有账户
        if (AllowedAccountIds == null || AllowedAccountIds.Length == 0)
            return true;
            
        return AllowedAccountIds.Contains(accountId, StringComparer.OrdinalIgnoreCase);
    }
}
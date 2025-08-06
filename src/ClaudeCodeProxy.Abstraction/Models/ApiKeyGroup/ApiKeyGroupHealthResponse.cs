using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组健康检查响应模型
/// </summary>
public class ApiKeyGroupHealthResponse
{
    /// <summary>
    /// 分组ID
    /// </summary>
    [JsonPropertyName("group_id")]
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// 分组名称
    /// </summary>
    [JsonPropertyName("group_name")]
    public string GroupName { get; set; } = string.Empty;
    
    /// <summary>
    /// 整体健康状态
    /// </summary>
    [JsonPropertyName("overall_health_status")]
    public string OverallHealthStatus { get; set; } = "unknown";
    
    /// <summary>
    /// 是否启用
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool IsEnabled { get; set; }
    
    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    [JsonPropertyName("last_health_check_at")]
    public DateTime? LastHealthCheckAt { get; set; }
    
    /// <summary>
    /// API Key总数
    /// </summary>
    [JsonPropertyName("total_api_keys")]
    public int TotalApiKeys { get; set; }
    
    /// <summary>
    /// 健康的API Key数量
    /// </summary>
    [JsonPropertyName("healthy_api_keys")]
    public int HealthyApiKeys { get; set; }
    
    /// <summary>
    /// 不健康的API Key数量
    /// </summary>
    [JsonPropertyName("unhealthy_api_keys")]
    public int UnhealthyApiKeys { get; set; }
    
    /// <summary>
    /// API Key健康详情
    /// </summary>
    [JsonPropertyName("api_key_health_details")]
    public Dictionary<Guid, object> ApiKeyHealthDetails { get; set; } = new();
    
    /// <summary>
    /// 检查完成时间
    /// </summary>
    [JsonPropertyName("check_completed_at")]
    public DateTime CheckCompletedAt { get; set; } = DateTime.UtcNow;
}
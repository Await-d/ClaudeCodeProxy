using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组映射数据传输对象
/// </summary>
public class ApiKeyGroupMappingDto
{
    /// <summary>
    /// 映射ID
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// API Key ID
    /// </summary>
    [JsonPropertyName("api_key_id")]
    public Guid ApiKeyId { get; set; }
    
    /// <summary>
    /// API Key名称
    /// </summary>
    [JsonPropertyName("api_key_name")]
    public string ApiKeyName { get; set; } = string.Empty;
    
    /// <summary>
    /// 分组ID
    /// </summary>
    [JsonPropertyName("group_id")]
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// 权重
    /// </summary>
    public int Weight { get; set; } = 1;
    
    /// <summary>
    /// 是否为主Key
    /// </summary>
    [JsonPropertyName("is_primary")]
    public bool IsPrimary { get; set; } = false;
    
    /// <summary>
    /// 顺序
    /// </summary>
    public int Order { get; set; } = 0;
    
    /// <summary>
    /// 是否启用
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// 当前连接数
    /// </summary>
    [JsonPropertyName("current_connections")]
    public int CurrentConnections { get; set; } = 0;
    
    /// <summary>
    /// 最后使用时间
    /// </summary>
    [JsonPropertyName("last_used_at")]
    public DateTime? LastUsedAt { get; set; }
    
    /// <summary>
    /// 总使用次数
    /// </summary>
    [JsonPropertyName("total_usage_count")]
    public long TotalUsageCount { get; set; } = 0;
    
    /// <summary>
    /// 成功请求次数
    /// </summary>
    [JsonPropertyName("successful_requests")]
    public long SuccessfulRequests { get; set; } = 0;
    
    /// <summary>
    /// 失败请求次数
    /// </summary>
    [JsonPropertyName("failed_requests")]
    public long FailedRequests { get; set; } = 0;
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; } = 0;
    
    /// <summary>
    /// 健康状态
    /// </summary>
    [JsonPropertyName("health_status")]
    public string HealthStatus { get; set; } = "unknown";
    
    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    [JsonPropertyName("last_health_check_at")]
    public DateTime? LastHealthCheckAt { get; set; }
    
    /// <summary>
    /// 连续失败次数
    /// </summary>
    [JsonPropertyName("consecutive_failures")]
    public int ConsecutiveFailures { get; set; } = 0;
    
    /// <summary>
    /// 成功率
    /// </summary>
    [JsonPropertyName("success_rate")]
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 权重分数
    /// </summary>
    [JsonPropertyName("weight_score")]
    public double WeightScore { get; set; }
    
    /// <summary>
    /// 是否可用
    /// </summary>
    [JsonPropertyName("is_available")]
    public bool IsAvailable { get; set; }
    
    /// <summary>
    /// 创建时间
    /// </summary>
    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// 更新时间
    /// </summary>
    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
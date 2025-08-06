using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组数据传输对象
/// </summary>
public class ApiKeyGroupDto
{
    /// <summary>
    /// 分组ID
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// 分组名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 分组描述
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 分组类型：default(默认), custom(自定义), system(系统)
    /// </summary>
    [JsonPropertyName("group_type")]
    public string GroupType { get; set; } = "custom";
    
    /// <summary>
    /// 分组标签
    /// </summary>
    public List<string>? Tags { get; set; }
    
    /// <summary>
    /// 分组优先级（1-100，数字越小优先级越高）
    /// </summary>
    public int Priority { get; set; } = 50;
    
    /// <summary>
    /// 是否启用
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// 分组总费用限制
    /// </summary>
    [JsonPropertyName("group_cost_limit")]
    public decimal? GroupCostLimit { get; set; }
    
    /// <summary>
    /// 分组总请求数限制
    /// </summary>
    [JsonPropertyName("group_request_limit")]
    public long? GroupRequestLimit { get; set; }
    
    /// <summary>
    /// 负载均衡策略
    /// </summary>
    [JsonPropertyName("load_balance_strategy")]
    public string LoadBalanceStrategy { get; set; } = "round_robin";
    
    /// <summary>
    /// 故障转移策略
    /// </summary>
    [JsonPropertyName("failover_strategy")]
    public string FailoverStrategy { get; set; } = "failover";
    
    /// <summary>
    /// 健康检查间隔（秒）
    /// </summary>
    [JsonPropertyName("health_check_interval")]
    public int HealthCheckInterval { get; set; } = 30;
    
    /// <summary>
    /// API Key数量
    /// </summary>
    [JsonPropertyName("api_key_count")]
    public int ApiKeyCount { get; set; } = 0;
    
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
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组响应模型
/// </summary>
public class ApiKeyGroupResponse
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
    /// 分组标签（用于分类和过滤）
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
    /// 负载均衡策略：round_robin(轮询), weighted(加权), least_connections(最少连接)
    /// </summary>
    [JsonPropertyName("load_balance_strategy")]
    public string LoadBalanceStrategy { get; set; } = "round_robin";
    
    /// <summary>
    /// 故障转移策略：failover(故障转移), failfast(快速失败)
    /// </summary>
    [JsonPropertyName("failover_strategy")]
    public string FailoverStrategy { get; set; } = "failover";
    
    /// <summary>
    /// 健康检查间隔（秒）
    /// </summary>
    [JsonPropertyName("health_check_interval")]
    public int HealthCheckInterval { get; set; } = 30;
    
    /// <summary>
    /// 分组中的API Key数量
    /// </summary>
    [JsonPropertyName("api_key_count")]
    public int ApiKeyCount { get; set; } = 0;
    
    /// <summary>
    /// 健康的API Key数量
    /// </summary>
    [JsonPropertyName("healthy_api_key_count")]
    public int HealthyApiKeyCount { get; set; } = 0;
    
    /// <summary>
    /// 分组统计信息
    /// </summary>
    public GroupStatisticsDto? Statistics { get; set; }
    
    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    [JsonPropertyName("last_health_check_at")]
    public DateTime? LastHealthCheckAt { get; set; }
    
    /// <summary>
    /// 健康状态：healthy, unhealthy, unknown
    /// </summary>
    [JsonPropertyName("health_status")]
    public string HealthStatus { get; set; } = "unknown";
    
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
    
    /// <summary>
    /// API Key列表（可选包含）
    /// </summary>
    [JsonPropertyName("api_keys")]
    public List<ApiKeyGroupMappingDto>? ApiKeys { get; set; }
    
    /// <summary>
    /// 使用率信息
    /// </summary>
    [JsonPropertyName("usage_info")]
    public GroupUsageInfoDto? UsageInfo { get; set; }
    
    /// <summary>
    /// 是否可以接受请求
    /// </summary>
    [JsonPropertyName("can_accept_request")]
    public bool CanAcceptRequest { get; set; }
    
    /// <summary>
    /// 分组状态描述
    /// </summary>
    [JsonPropertyName("status_description")]
    public string? StatusDescription { get; set; }
}
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 更新API Key分组请求模型
/// </summary>
public class UpdateApiKeyGroupRequest
{
    /// <summary>
    /// 分组名称
    /// </summary>
    [StringLength(100, ErrorMessage = "分组名称长度不能超过100字符")]
    public string? Name { get; set; }
    
    /// <summary>
    /// 分组描述
    /// </summary>
    [StringLength(500, ErrorMessage = "分组描述长度不能超过500字符")]
    public string? Description { get; set; }
    
    /// <summary>
    /// 分组标签（用于分类和过滤）
    /// </summary>
    public List<string>? Tags { get; set; }
    
    /// <summary>
    /// 分组优先级（1-100，数字越小优先级越高）
    /// </summary>
    [Range(1, 100, ErrorMessage = "优先级必须在1-100之间")]
    public int? Priority { get; set; }
    
    /// <summary>
    /// 是否启用
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool? IsEnabled { get; set; }
    
    /// <summary>
    /// 分组总费用限制
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "费用限制不能为负数")]
    [JsonPropertyName("group_cost_limit")]
    public decimal? GroupCostLimit { get; set; }
    
    /// <summary>
    /// 分组总请求数限制
    /// </summary>
    [Range(0, long.MaxValue, ErrorMessage = "请求数限制不能为负数")]
    [JsonPropertyName("group_request_limit")]
    public long? GroupRequestLimit { get; set; }
    
    /// <summary>
    /// 负载均衡策略
    /// </summary>
    [JsonPropertyName("load_balance_strategy")]
    public string? LoadBalanceStrategy { get; set; }
    
    /// <summary>
    /// 故障转移策略
    /// </summary>
    [JsonPropertyName("failover_strategy")]
    public string? FailoverStrategy { get; set; }
    
    /// <summary>
    /// 健康检查间隔（秒）
    /// </summary>
    [Range(10, 3600, ErrorMessage = "健康检查间隔必须在10-3600秒之间")]
    [JsonPropertyName("health_check_interval")]
    public int? HealthCheckInterval { get; set; }
}
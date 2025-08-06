using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 创建API Key分组请求模型
/// </summary>
public class CreateApiKeyGroupRequest
{
    /// <summary>
    /// 分组名称
    /// </summary>
    [Required(ErrorMessage = "分组名称不能为空")]
    [StringLength(100, ErrorMessage = "分组名称长度不能超过100字符")]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 分组描述
    /// </summary>
    [StringLength(500, ErrorMessage = "分组描述长度不能超过500字符")]
    public string? Description { get; set; }
    
    /// <summary>
    /// 分组类型：default(默认), custom(自定义), system(系统)
    /// </summary>
    [Required(ErrorMessage = "分组类型不能为空")]
    [JsonPropertyName("group_type")]
    public string GroupType { get; set; } = "custom";
    
    /// <summary>
    /// 分组标签（用于分类和过滤）
    /// </summary>
    public List<string>? Tags { get; set; }
    
    /// <summary>
    /// 分组优先级（1-100，数字越小优先级越高）
    /// </summary>
    [Range(1, 100, ErrorMessage = "优先级必须在1-100之间")]
    public int Priority { get; set; } = 50;
    
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
    [Required(ErrorMessage = "负载均衡策略不能为空")]
    [JsonPropertyName("load_balance_strategy")]
    public string LoadBalanceStrategy { get; set; } = "round_robin";
    
    /// <summary>
    /// 故障转移策略：failover(故障转移), failfast(快速失败)
    /// </summary>
    [Required(ErrorMessage = "故障转移策略不能为空")]
    [JsonPropertyName("failover_strategy")]
    public string FailoverStrategy { get; set; } = "failover";
    
    /// <summary>
    /// 健康检查间隔（秒）
    /// </summary>
    [Range(10, 3600, ErrorMessage = "健康检查间隔必须在10-3600秒之间")]
    [JsonPropertyName("health_check_interval")]
    public int HealthCheckInterval { get; set; } = 30;
}
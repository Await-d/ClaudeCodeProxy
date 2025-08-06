using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 获取API Key分组列表请求模型
/// </summary>
public class GetApiKeyGroupsRequest
{
    /// <summary>
    /// 页码
    /// </summary>
    [Range(1, int.MaxValue, ErrorMessage = "页码必须大于0")]
    public int Page { get; set; } = 1;
    
    /// <summary>
    /// 每页数量
    /// </summary>
    [Range(1, 100, ErrorMessage = "每页数量必须在1-100之间")]
    [JsonPropertyName("page_size")]
    public int PageSize { get; set; } = 20;
    
    /// <summary>
    /// 搜索关键词（支持名称、描述搜索）
    /// </summary>
    [StringLength(100, ErrorMessage = "搜索关键词长度不能超过100字符")]
    [JsonPropertyName("search_term")]
    public string? SearchTerm { get; set; }
    
    /// <summary>
    /// 分组类型过滤：default, custom, system
    /// </summary>
    [JsonPropertyName("group_type")]
    public string? GroupType { get; set; }
    
    /// <summary>
    /// 启用状态过滤
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool? IsEnabled { get; set; }
    
    /// <summary>
    /// 健康状态过滤：healthy, unhealthy, unknown
    /// </summary>
    [JsonPropertyName("health_status")]
    public string? HealthStatus { get; set; }
    
    /// <summary>
    /// 标签过滤（AND关系）
    /// </summary>
    public List<string>? Tags { get; set; }
    
    /// <summary>
    /// 优先级范围过滤 - 最小值
    /// </summary>
    [Range(1, 100, ErrorMessage = "优先级最小值必须在1-100之间")]
    [JsonPropertyName("priority_min")]
    public int? PriorityMin { get; set; }
    
    /// <summary>
    /// 优先级范围过滤 - 最大值
    /// </summary>
    [Range(1, 100, ErrorMessage = "优先级最大值必须在1-100之间")]
    [JsonPropertyName("priority_max")]
    public int? PriorityMax { get; set; }
    
    /// <summary>
    /// 负载均衡策略过滤
    /// </summary>
    [JsonPropertyName("load_balance_strategy")]
    public string? LoadBalanceStrategy { get; set; }
    
    /// <summary>
    /// API Key数量范围过滤 - 最小值
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "API Key最小数量不能为负数")]
    [JsonPropertyName("min_api_keys")]
    public int? MinApiKeys { get; set; }
    
    /// <summary>
    /// API Key数量范围过滤 - 最大值
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "API Key最大数量不能为负数")]
    [JsonPropertyName("max_api_keys")]
    public int? MaxApiKeys { get; set; }
    
    /// <summary>
    /// API Key数量范围过滤 - 最小值（别名）
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "API Key最小数量不能为负数")]
    public int? MinApiKeyCount => MinApiKeys;
    
    /// <summary>
    /// API Key数量范围过滤 - 最大值（别名）
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "API Key最大数量不能为负数")]
    public int? MaxApiKeyCount => MaxApiKeys;
    
    /// <summary>
    /// 创建时间范围过滤 - 开始时间
    /// </summary>
    [JsonPropertyName("created_from")]
    public DateTime? CreatedFrom { get; set; }
    
    /// <summary>
    /// 创建时间范围过滤 - 结束时间
    /// </summary>
    [JsonPropertyName("created_to")]
    public DateTime? CreatedTo { get; set; }
    
    /// <summary>
    /// 创建时间范围过滤 - 开始时间（别名）
    /// </summary>
    public DateTime? CreatedAfter => CreatedFrom;
    
    /// <summary>
    /// 创建时间范围过滤 - 结束时间（别名）
    /// </summary>
    public DateTime? CreatedBefore => CreatedTo;
    
    /// <summary>
    /// 排序字段：name, priority, created_at, updated_at, api_key_count
    /// </summary>
    [JsonPropertyName("sort_by")]
    public string SortBy { get; set; } = "created_at";
    
    /// <summary>
    /// 排序方向：asc, desc
    /// </summary>
    [JsonPropertyName("sort_direction")]
    public string SortDirection { get; set; } = "desc";
    
    /// <summary>
    /// 是否包含API Key详情
    /// </summary>
    [JsonPropertyName("include_api_keys")]
    public bool IncludeApiKeys { get; set; } = false;
    
    /// <summary>
    /// 是否包含统计信息
    /// </summary>
    [JsonPropertyName("include_statistics")]
    public bool IncludeStatistics { get; set; } = true;
}
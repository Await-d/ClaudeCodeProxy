using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 过滤器信息DTO
/// </summary>
public class FilterInfoDto
{
    /// <summary>
    /// 应用的过滤器数量
    /// </summary>
    [JsonPropertyName("applied_filters_count")]
    public int AppliedFiltersCount { get; set; }
    
    /// <summary>
    /// 过滤后的结果数量
    /// </summary>
    [JsonPropertyName("filtered_count")]
    public int FilteredCount { get; set; }
    
    /// <summary>
    /// 未过滤的总数量
    /// </summary>
    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }
    
    /// <summary>
    /// 活动的过滤器
    /// </summary>
    [JsonPropertyName("active_filters")]
    public Dictionary<string, object> ActiveFilters { get; set; } = new();
    
    /// <summary>
    /// 过滤器生效时间
    /// </summary>
    [JsonPropertyName("applied_at")]
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// 排序信息DTO
/// </summary>
public class SortInfoDto
{
    /// <summary>
    /// 排序字段
    /// </summary>
    [JsonPropertyName("sort_by")]
    public string SortBy { get; set; } = string.Empty;
    
    /// <summary>
    /// 排序方向
    /// </summary>
    [JsonPropertyName("sort_direction")]
    public string SortDirection { get; set; } = "asc";
    
    /// <summary>
    /// 是否为默认排序
    /// </summary>
    [JsonPropertyName("is_default")]
    public bool IsDefault { get; set; }
    
    /// <summary>
    /// 可用的排序字段
    /// </summary>
    [JsonPropertyName("available_sort_fields")]
    public List<string> AvailableSortFields { get; set; } = new();
}
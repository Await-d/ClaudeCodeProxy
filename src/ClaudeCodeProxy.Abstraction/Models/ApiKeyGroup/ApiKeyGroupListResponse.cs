using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组列表响应模型
/// </summary>
public class ApiKeyGroupListResponse
{
    /// <summary>
    /// 分组数据列表
    /// </summary>
    public List<ApiKeyGroupResponse> Data { get; set; } = new();
    
    /// <summary>
    /// 总记录数
    /// </summary>
    public int Total { get; set; }
    
    /// <summary>
    /// 当前页码
    /// </summary>
    public int Page { get; set; }
    
    /// <summary>
    /// 每页数量
    /// </summary>
    [JsonPropertyName("page_size")]
    public int PageSize { get; set; }
    
    /// <summary>
    /// 总页数
    /// </summary>
    [JsonPropertyName("total_pages")]
    public int TotalPages { get; set; }
    
    /// <summary>
    /// 是否有下一页
    /// </summary>
    [JsonPropertyName("has_next")]
    public bool HasNext { get; set; }
    
    /// <summary>
    /// 是否有上一页
    /// </summary>
    [JsonPropertyName("has_previous")]
    public bool HasPrevious { get; set; }
    
    /// <summary>
    /// 分组统计摘要
    /// </summary>
    public ApiKeyGroupSummaryDto? Summary { get; set; }
    
    /// <summary>
    /// 过滤器信息
    /// </summary>
    [JsonPropertyName("filter_info")]
    public FilterInfoDto? FilterInfo { get; set; }
    
    /// <summary>
    /// 排序信息
    /// </summary>
    [JsonPropertyName("sort_info")]
    public SortInfoDto? SortInfo { get; set; }
}
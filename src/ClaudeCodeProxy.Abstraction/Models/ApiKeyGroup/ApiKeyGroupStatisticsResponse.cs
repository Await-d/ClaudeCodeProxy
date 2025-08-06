using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组统计响应模型
/// </summary>
public class ApiKeyGroupStatisticsResponse
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
    /// 统计时间范围
    /// </summary>
    [JsonPropertyName("time_range")]
    public TimeRangeDto TimeRange { get; set; } = new();
    
    /// <summary>
    /// 请求统计
    /// </summary>
    [JsonPropertyName("request_stats")]
    public RequestStatisticsDto RequestStats { get; set; } = new();
    
    /// <summary>
    /// 费用统计
    /// </summary>
    [JsonPropertyName("cost_stats")]
    public CostStatisticsDto CostStats { get; set; } = new();
    
    /// <summary>
    /// 性能统计
    /// </summary>
    [JsonPropertyName("performance_stats")]
    public PerformanceStatisticsDto PerformanceStats { get; set; } = new();
    
    /// <summary>
    /// 健康状态统计
    /// </summary>
    [JsonPropertyName("health_stats")]
    public HealthStatisticsDto HealthStats { get; set; } = new();
    
    /// <summary>
    /// API Key使用分布
    /// </summary>
    [JsonPropertyName("api_key_distribution")]
    public List<ApiKeyUsageDistributionDto> ApiKeyDistribution { get; set; } = new();
    
    /// <summary>
    /// 时间序列数据
    /// </summary>
    [JsonPropertyName("time_series")]
    public List<TimeSeriesDataPointDto> TimeSeries { get; set; } = new();
    
    /// <summary>
    /// 错误类型分布
    /// </summary>
    [JsonPropertyName("error_distribution")]
    public List<ErrorDistributionDto> ErrorDistribution { get; set; } = new();
    
    /// <summary>
    /// 模型使用统计
    /// </summary>
    [JsonPropertyName("model_usage")]
    public List<ModelUsageDto> ModelUsage { get; set; } = new();
    
    /// <summary>
    /// 负载均衡效率
    /// </summary>
    [JsonPropertyName("load_balance_efficiency")]
    public LoadBalanceEfficiencyDto? LoadBalanceEfficiency { get; set; }
    
    /// <summary>
    /// 统计生成时间
    /// </summary>
    [JsonPropertyName("generated_at")]
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
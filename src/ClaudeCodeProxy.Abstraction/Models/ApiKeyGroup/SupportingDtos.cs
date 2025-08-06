using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 分组使用率信息DTO
/// </summary>
public class GroupUsageInfoDto
{
    /// <summary>
    /// 请求使用率（0-1之间）
    /// </summary>
    [JsonPropertyName("request_usage")]
    public double RequestUsage { get; set; }
    
    /// <summary>
    /// 费用使用率（0-1之间）
    /// </summary>
    [JsonPropertyName("cost_usage")]
    public double CostUsage { get; set; }
    
    /// <summary>
    /// 总请求数
    /// </summary>
    [JsonPropertyName("total_requests")]
    public long TotalRequests { get; set; }
    
    /// <summary>
    /// 总费用
    /// </summary>
    [JsonPropertyName("total_cost")]
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    [JsonPropertyName("success_rate")]
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 健康的Key数量
    /// </summary>
    [JsonPropertyName("healthy_key_count")]
    public int HealthyKeyCount { get; set; }
    
    /// <summary>
    /// 最后使用时间
    /// </summary>
    [JsonPropertyName("last_used_at")]
    public DateTime? LastUsedAt { get; set; }
}

/// <summary>
/// API Key详细信息DTO
/// </summary>
public class ApiKeyDetailsDto
{
    /// <summary>
    /// API Key ID
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// API Key名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 是否启用
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool IsEnabled { get; set; }
    
    /// <summary>
    /// 服务类型
    /// </summary>
    public string Service { get; set; } = string.Empty;
    
    /// <summary>
    /// 模型限制
    /// </summary>
    public string? Model { get; set; }
    
    /// <summary>
    /// 到期时间
    /// </summary>
    [JsonPropertyName("expires_at")]
    public DateTime? ExpiresAt { get; set; }
    
    /// <summary>
    /// 费用限制
    /// </summary>
    [JsonPropertyName("cost_limits")]
    public CostLimitsDto? CostLimits { get; set; }
    
    /// <summary>
    /// 速率限制
    /// </summary>
    [JsonPropertyName("rate_limits")]
    public RateLimitsDto? RateLimits { get; set; }
}

/// <summary>
/// 费用限制DTO
/// </summary>
public class CostLimitsDto
{
    /// <summary>
    /// 日费用限制
    /// </summary>
    [JsonPropertyName("daily_limit")]
    public decimal DailyLimit { get; set; }
    
    /// <summary>
    /// 月费用限制
    /// </summary>
    [JsonPropertyName("monthly_limit")]
    public decimal MonthlyLimit { get; set; }
    
    /// <summary>
    /// 总费用限制
    /// </summary>
    [JsonPropertyName("total_limit")]
    public decimal TotalLimit { get; set; }
}

/// <summary>
/// 速率限制DTO
/// </summary>
public class RateLimitsDto
{
    /// <summary>
    /// 速率限制窗口（秒）
    /// </summary>
    [JsonPropertyName("window_seconds")]
    public int WindowSeconds { get; set; }
    
    /// <summary>
    /// 窗口内最大请求数
    /// </summary>
    [JsonPropertyName("max_requests")]
    public int MaxRequests { get; set; }
    
    /// <summary>
    /// 并发限制
    /// </summary>
    [JsonPropertyName("concurrency_limit")]
    public int ConcurrencyLimit { get; set; }
}

/// <summary>
/// 时间范围DTO
/// </summary>
public class TimeRangeDto
{
    /// <summary>
    /// 开始时间
    /// </summary>
    [JsonPropertyName("start_time")]
    public DateTime StartTime { get; set; }
    
    /// <summary>
    /// 结束时间
    /// </summary>
    [JsonPropertyName("end_time")]
    public DateTime EndTime { get; set; }
    
    /// <summary>
    /// 时间范围描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// 请求统计DTO
/// </summary>
public class RequestStatisticsDto
{
    /// <summary>
    /// 总请求数
    /// </summary>
    [JsonPropertyName("total_requests")]
    public long TotalRequests { get; set; }
    
    /// <summary>
    /// 成功请求数
    /// </summary>
    [JsonPropertyName("successful_requests")]
    public long SuccessfulRequests { get; set; }
    
    /// <summary>
    /// 失败请求数
    /// </summary>
    [JsonPropertyName("failed_requests")]
    public long FailedRequests { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    [JsonPropertyName("success_rate")]
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 平均每分钟请求数
    /// </summary>
    [JsonPropertyName("requests_per_minute")]
    public double RequestsPerMinute { get; set; }
    
    /// <summary>
    /// 平均每小时请求数
    /// </summary>
    [JsonPropertyName("requests_per_hour")]
    public double RequestsPerHour { get; set; }
    
    /// <summary>
    /// 峰值每分钟请求数
    /// </summary>
    [JsonPropertyName("peak_requests_per_minute")]
    public double PeakRequestsPerMinute { get; set; }
}

/// <summary>
/// 费用统计DTO
/// </summary>
public class CostStatisticsDto
{
    /// <summary>
    /// 总费用
    /// </summary>
    [JsonPropertyName("total_cost")]
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 平均每请求费用
    /// </summary>
    [JsonPropertyName("average_cost_per_request")]
    public decimal AverageCostPerRequest { get; set; }
    
    /// <summary>
    /// 最高单次请求费用
    /// </summary>
    [JsonPropertyName("max_cost_per_request")]
    public decimal MaxCostPerRequest { get; set; }
    
    /// <summary>
    /// 格式化总费用
    /// </summary>
    [JsonPropertyName("formatted_total_cost")]
    public string FormattedTotalCost { get; set; } = string.Empty;
    
    /// <summary>
    /// 费用趋势
    /// </summary>
    [JsonPropertyName("cost_trend")]
    public string CostTrend { get; set; } = "stable";
}

/// <summary>
/// 性能统计DTO
/// </summary>
public class PerformanceStatisticsDto
{
    /// <summary>
    /// 平均响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 最小响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("min_response_time")]
    public double MinResponseTime { get; set; }
    
    /// <summary>
    /// 最大响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("max_response_time")]
    public double MaxResponseTime { get; set; }
    
    /// <summary>
    /// P95响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("p95_response_time")]
    public double P95ResponseTime { get; set; }
    
    /// <summary>
    /// P99响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("p99_response_time")]
    public double P99ResponseTime { get; set; }
    
    /// <summary>
    /// 当前并发连接数
    /// </summary>
    [JsonPropertyName("current_concurrent_connections")]
    public int CurrentConcurrentConnections { get; set; }
    
    /// <summary>
    /// 峰值并发连接数
    /// </summary>
    [JsonPropertyName("peak_concurrent_connections")]
    public int PeakConcurrentConnections { get; set; }
}

/// <summary>
/// 健康统计DTO
/// </summary>
public class HealthStatisticsDto
{
    /// <summary>
    /// 健康的API Key数量
    /// </summary>
    [JsonPropertyName("healthy_keys")]
    public int HealthyKeys { get; set; }
    
    /// <summary>
    /// 不健康的API Key数量
    /// </summary>
    [JsonPropertyName("unhealthy_keys")]
    public int UnhealthyKeys { get; set; }
    
    /// <summary>
    /// 未知状态的API Key数量
    /// </summary>
    [JsonPropertyName("unknown_keys")]
    public int UnknownKeys { get; set; }
    
    /// <summary>
    /// 健康率
    /// </summary>
    [JsonPropertyName("health_rate")]
    public double HealthRate { get; set; }
    
    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    [JsonPropertyName("last_health_check")]
    public DateTime? LastHealthCheck { get; set; }
    
    /// <summary>
    /// 健康检查间隔（秒）
    /// </summary>
    [JsonPropertyName("health_check_interval")]
    public int HealthCheckInterval { get; set; }
}
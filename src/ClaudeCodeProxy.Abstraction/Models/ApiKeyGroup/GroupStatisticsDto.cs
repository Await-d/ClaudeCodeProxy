using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 分组统计信息数据传输对象
/// </summary>
public class GroupStatisticsDto
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
    /// 总费用
    /// </summary>
    [JsonPropertyName("total_cost")]
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 平均响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 最后使用时间
    /// </summary>
    [JsonPropertyName("last_used_at")]
    public DateTime? LastUsedAt { get; set; }
    
    /// <summary>
    /// 统计开始时间
    /// </summary>
    [JsonPropertyName("statistics_start_time")]
    public DateTime? StatisticsStartTime { get; set; }
    
    /// <summary>
    /// 峰值并发连接数
    /// </summary>
    [JsonPropertyName("peak_concurrent_connections")]
    public int PeakConcurrentConnections { get; set; }
    
    /// <summary>
    /// 当前并发连接数
    /// </summary>
    [JsonPropertyName("current_concurrent_connections")]
    public int CurrentConcurrentConnections { get; set; }
    
    /// <summary>
    /// 每分钟请求数（最近1分钟）
    /// </summary>
    [JsonPropertyName("requests_per_minute")]
    public double RequestsPerMinute { get; set; }
    
    /// <summary>
    /// 每小时请求数（最近1小时）
    /// </summary>
    [JsonPropertyName("requests_per_hour")]
    public double RequestsPerHour { get; set; }
    
    /// <summary>
    /// 每日请求数（最近24小时）
    /// </summary>
    [JsonPropertyName("requests_per_day")]
    public double RequestsPerDay { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    [JsonPropertyName("success_rate")]
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 失败率
    /// </summary>
    [JsonPropertyName("failure_rate")]
    public double FailureRate { get; set; }
    
    /// <summary>
    /// 运行时间（秒）
    /// </summary>
    [JsonPropertyName("uptime_seconds")]
    public double UptimeSeconds { get; set; }
    
    /// <summary>
    /// 格式化的总费用
    /// </summary>
    [JsonPropertyName("formatted_total_cost")]
    public string FormattedTotalCost { get; set; } = "$0.00";
}
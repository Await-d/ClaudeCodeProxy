using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 分组类型分布DTO
/// </summary>
public class GroupTypeDistributionDto
{
    /// <summary>
    /// 分组类型
    /// </summary>
    [JsonPropertyName("group_type")]
    public string GroupType { get; set; } = string.Empty;
    
    /// <summary>
    /// 数量
    /// </summary>
    public int Count { get; set; }
    
    /// <summary>
    /// 百分比
    /// </summary>
    public double Percentage { get; set; }
    
    /// <summary>
    /// 类型描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// 负载均衡策略分布DTO
/// </summary>
public class LoadBalanceStrategyDistributionDto
{
    /// <summary>
    /// 策略名称
    /// </summary>
    public string Strategy { get; set; } = string.Empty;
    
    /// <summary>
    /// 使用数量
    /// </summary>
    public int Count { get; set; }
    
    /// <summary>
    /// 百分比
    /// </summary>
    public double Percentage { get; set; }
    
    /// <summary>
    /// 策略描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// 平均效率评分
    /// </summary>
    [JsonPropertyName("average_efficiency")]
    public double AverageEfficiency { get; set; }
}

/// <summary>
/// 整体分组统计DTO
/// </summary>
public class OverallGroupStatisticsDto
{
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
    /// 平均成功率
    /// </summary>
    [JsonPropertyName("average_success_rate")]
    public double AverageSuccessRate { get; set; }
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 总并发连接数
    /// </summary>
    [JsonPropertyName("total_concurrent_connections")]
    public int TotalConcurrentConnections { get; set; }
    
    /// <summary>
    /// 每分钟总请求数
    /// </summary>
    [JsonPropertyName("requests_per_minute")]
    public double RequestsPerMinute { get; set; }
    
    /// <summary>
    /// 格式化总费用
    /// </summary>
    [JsonPropertyName("formatted_total_cost")]
    public string FormattedTotalCost { get; set; } = string.Empty;
}

/// <summary>
/// 性能最佳分组DTO
/// </summary>
public class TopPerformingGroupDto
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
    /// 性能评分
    /// </summary>
    [JsonPropertyName("performance_score")]
    public double PerformanceScore { get; set; }
    
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
    /// 请求数
    /// </summary>
    [JsonPropertyName("request_count")]
    public long RequestCount { get; set; }
    
    /// <summary>
    /// 优势描述
    /// </summary>
    public string Strengths { get; set; } = string.Empty;
}

/// <summary>
/// 需要关注的分组DTO
/// </summary>
public class GroupNeedingAttentionDto
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
    /// 关注原因
    /// </summary>
    [JsonPropertyName("attention_reason")]
    public string AttentionReason { get; set; } = string.Empty;
    
    /// <summary>
    /// 严重程度：low, medium, high, critical
    /// </summary>
    public string Severity { get; set; } = "medium";
    
    /// <summary>
    /// 问题描述
    /// </summary>
    [JsonPropertyName("issue_description")]
    public string IssueDescription { get; set; } = string.Empty;
    
    /// <summary>
    /// 建议操作
    /// </summary>
    [JsonPropertyName("suggested_actions")]
    public List<string> SuggestedActions { get; set; } = new();
    
    /// <summary>
    /// 最后检测时间
    /// </summary>
    [JsonPropertyName("detected_at")]
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// 资源使用情况DTO
/// </summary>
public class ResourceUsageDto
{
    /// <summary>
    /// 内存使用情况
    /// </summary>
    [JsonPropertyName("memory_usage")]
    public MemoryUsageDto MemoryUsage { get; set; } = new();
    
    /// <summary>
    /// CPU使用情况
    /// </summary>
    [JsonPropertyName("cpu_usage")]
    public CpuUsageDto CpuUsage { get; set; } = new();
    
    /// <summary>
    /// 网络使用情况
    /// </summary>
    [JsonPropertyName("network_usage")]
    public NetworkUsageDto NetworkUsage { get; set; } = new();
    
    /// <summary>
    /// 存储使用情况
    /// </summary>
    [JsonPropertyName("storage_usage")]
    public StorageUsageDto StorageUsage { get; set; } = new();
}

/// <summary>
/// 内存使用DTO
/// </summary>
public class MemoryUsageDto
{
    /// <summary>
    /// 已使用内存（MB）
    /// </summary>
    [JsonPropertyName("used_mb")]
    public long UsedMb { get; set; }
    
    /// <summary>
    /// 总内存（MB）
    /// </summary>
    [JsonPropertyName("total_mb")]
    public long TotalMb { get; set; }
    
    /// <summary>
    /// 使用百分比
    /// </summary>
    [JsonPropertyName("usage_percentage")]
    public double UsagePercentage { get; set; }
}

/// <summary>
/// CPU使用DTO
/// </summary>
public class CpuUsageDto
{
    /// <summary>
    /// CPU使用百分比
    /// </summary>
    [JsonPropertyName("usage_percentage")]
    public double UsagePercentage { get; set; }
    
    /// <summary>
    /// 平均负载
    /// </summary>
    [JsonPropertyName("average_load")]
    public double AverageLoad { get; set; }
    
    /// <summary>
    /// 核心数量
    /// </summary>
    [JsonPropertyName("core_count")]
    public int CoreCount { get; set; }
}

/// <summary>
/// 网络使用DTO
/// </summary>
public class NetworkUsageDto
{
    /// <summary>
    /// 入站流量（KB/s）
    /// </summary>
    [JsonPropertyName("inbound_kbps")]
    public double InboundKbps { get; set; }
    
    /// <summary>
    /// 出站流量（KB/s）
    /// </summary>
    [JsonPropertyName("outbound_kbps")]
    public double OutboundKbps { get; set; }
    
    /// <summary>
    /// 连接数
    /// </summary>
    [JsonPropertyName("connection_count")]
    public int ConnectionCount { get; set; }
}

/// <summary>
/// 存储使用DTO
/// </summary>
public class StorageUsageDto
{
    /// <summary>
    /// 已使用存储（MB）
    /// </summary>
    [JsonPropertyName("used_mb")]
    public long UsedMb { get; set; }
    
    /// <summary>
    /// 总存储空间（MB）
    /// </summary>
    [JsonPropertyName("total_mb")]
    public long TotalMb { get; set; }
    
    /// <summary>
    /// 使用百分比
    /// </summary>
    [JsonPropertyName("usage_percentage")]
    public double UsagePercentage { get; set; }
}

/// <summary>
/// 最近活动摘要DTO
/// </summary>
public class RecentActivitySummaryDto
{
    /// <summary>
    /// 最近24小时请求数
    /// </summary>
    [JsonPropertyName("requests_24h")]
    public long Requests24h { get; set; }
    
    /// <summary>
    /// 最近24小时费用
    /// </summary>
    [JsonPropertyName("cost_24h")]
    public decimal Cost24h { get; set; }
    
    /// <summary>
    /// 最近24小时成功率
    /// </summary>
    [JsonPropertyName("success_rate_24h")]
    public double SuccessRate24h { get; set; }
    
    /// <summary>
    /// 最活跃的分组
    /// </summary>
    [JsonPropertyName("most_active_group")]
    public string? MostActiveGroup { get; set; }
    
    /// <summary>
    /// 新创建的分组数量
    /// </summary>
    [JsonPropertyName("new_groups_count")]
    public int NewGroupsCount { get; set; }
    
    /// <summary>
    /// 最近的健康检查数量
    /// </summary>
    [JsonPropertyName("recent_health_checks")]
    public int RecentHealthChecks { get; set; }
    
    /// <summary>
    /// 故障转移次数
    /// </summary>
    [JsonPropertyName("failover_count")]
    public int FailoverCount { get; set; }
}


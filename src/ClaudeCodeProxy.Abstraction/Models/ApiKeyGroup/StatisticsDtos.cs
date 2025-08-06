using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key使用分布DTO
/// </summary>
public class ApiKeyUsageDistributionDto
{
    /// <summary>
    /// API Key ID
    /// </summary>
    [JsonPropertyName("api_key_id")]
    public Guid ApiKeyId { get; set; }
    
    /// <summary>
    /// API Key名称
    /// </summary>
    [JsonPropertyName("api_key_name")]
    public string ApiKeyName { get; set; } = string.Empty;
    
    /// <summary>
    /// 请求数
    /// </summary>
    [JsonPropertyName("request_count")]
    public long RequestCount { get; set; }
    
    /// <summary>
    /// 使用百分比
    /// </summary>
    [JsonPropertyName("usage_percentage")]
    public double UsagePercentage { get; set; }
    
    /// <summary>
    /// 费用
    /// </summary>
    public decimal Cost { get; set; }
    
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
}

/// <summary>
/// 时间序列数据点DTO
/// </summary>
public class TimeSeriesDataPointDto
{
    /// <summary>
    /// 时间戳
    /// </summary>
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// 请求数
    /// </summary>
    [JsonPropertyName("request_count")]
    public long RequestCount { get; set; }
    
    /// <summary>
    /// 成功请求数
    /// </summary>
    [JsonPropertyName("success_count")]
    public long SuccessCount { get; set; }
    
    /// <summary>
    /// 失败请求数
    /// </summary>
    [JsonPropertyName("failure_count")]
    public long FailureCount { get; set; }
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 费用
    /// </summary>
    public decimal Cost { get; set; }
    
    /// <summary>
    /// 并发连接数
    /// </summary>
    [JsonPropertyName("concurrent_connections")]
    public int ConcurrentConnections { get; set; }
}

/// <summary>
/// 错误分布DTO
/// </summary>
public class ErrorDistributionDto
{
    /// <summary>
    /// 错误类型
    /// </summary>
    [JsonPropertyName("error_type")]
    public string ErrorType { get; set; } = string.Empty;
    
    /// <summary>
    /// 错误代码
    /// </summary>
    [JsonPropertyName("error_code")]
    public string? ErrorCode { get; set; }
    
    /// <summary>
    /// 发生次数
    /// </summary>
    public long Count { get; set; }
    
    /// <summary>
    /// 百分比
    /// </summary>
    public double Percentage { get; set; }
    
    /// <summary>
    /// 最后发生时间
    /// </summary>
    [JsonPropertyName("last_occurred")]
    public DateTime? LastOccurred { get; set; }
    
    /// <summary>
    /// 影响的API Key数量
    /// </summary>
    [JsonPropertyName("affected_keys")]
    public int AffectedKeys { get; set; }
}

/// <summary>
/// 模型使用DTO
/// </summary>
public class ModelUsageDto
{
    /// <summary>
    /// 模型名称
    /// </summary>
    [JsonPropertyName("model_name")]
    public string ModelName { get; set; } = string.Empty;
    
    /// <summary>
    /// 请求数
    /// </summary>
    [JsonPropertyName("request_count")]
    public long RequestCount { get; set; }
    
    /// <summary>
    /// 使用百分比
    /// </summary>
    [JsonPropertyName("usage_percentage")]
    public double UsagePercentage { get; set; }
    
    /// <summary>
    /// 总费用
    /// </summary>
    [JsonPropertyName("total_cost")]
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 输入Token数
    /// </summary>
    [JsonPropertyName("input_tokens")]
    public long InputTokens { get; set; }
    
    /// <summary>
    /// 输出Token数
    /// </summary>
    [JsonPropertyName("output_tokens")]
    public long OutputTokens { get; set; }
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    [JsonPropertyName("average_response_time")]
    public double AverageResponseTime { get; set; }
}

/// <summary>
/// 负载均衡效率DTO
/// </summary>
public class LoadBalanceEfficiencyDto
{
    /// <summary>
    /// 负载均衡策略
    /// </summary>
    [JsonPropertyName("strategy")]
    public string Strategy { get; set; } = string.Empty;
    
    /// <summary>
    /// 分布均匀度（0-1，越接近1越均匀）
    /// </summary>
    [JsonPropertyName("distribution_evenness")]
    public double DistributionEvenness { get; set; }
    
    /// <summary>
    /// 资源利用率
    /// </summary>
    [JsonPropertyName("resource_utilization")]
    public double ResourceUtilization { get; set; }
    
    /// <summary>
    /// 故障转移次数
    /// </summary>
    [JsonPropertyName("failover_count")]
    public long FailoverCount { get; set; }
    
    /// <summary>
    /// 平均权重利用率
    /// </summary>
    [JsonPropertyName("average_weight_utilization")]
    public double AverageWeightUtilization { get; set; }
    
    /// <summary>
    /// 最不均匀的API Key
    /// </summary>
    [JsonPropertyName("most_uneven_key")]
    public string? MostUnevenKey { get; set; }
    
    /// <summary>
    /// 建议优化方案
    /// </summary>
    public List<string> Recommendations { get; set; } = new();
}

/// <summary>
/// 分组健康详情DTO
/// </summary>
public class GroupHealthDetailDto
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
    /// 健康状态
    /// </summary>
    [JsonPropertyName("health_status")]
    public string HealthStatus { get; set; } = string.Empty;
    
    /// <summary>
    /// 检查耗时（毫秒）
    /// </summary>
    [JsonPropertyName("check_duration_ms")]
    public long CheckDurationMs { get; set; }
    
    /// <summary>
    /// API Key检查结果
    /// </summary>
    [JsonPropertyName("api_key_checks")]
    public List<ApiKeyHealthCheckDto> ApiKeyChecks { get; set; } = new();
    
    /// <summary>
    /// 检查错误信息
    /// </summary>
    [JsonPropertyName("check_errors")]
    public List<string> CheckErrors { get; set; } = new();
    
    /// <summary>
    /// 健康评分（0-100）
    /// </summary>
    [JsonPropertyName("health_score")]
    public int HealthScore { get; set; }
}

/// <summary>
/// API Key健康检查DTO
/// </summary>
public class ApiKeyHealthCheckDto
{
    /// <summary>
    /// API Key ID
    /// </summary>
    [JsonPropertyName("api_key_id")]
    public Guid ApiKeyId { get; set; }
    
    /// <summary>
    /// API Key名称
    /// </summary>
    [JsonPropertyName("api_key_name")]
    public string ApiKeyName { get; set; } = string.Empty;
    
    /// <summary>
    /// 健康状态
    /// </summary>
    [JsonPropertyName("health_status")]
    public string HealthStatus { get; set; } = string.Empty;
    
    /// <summary>
    /// 响应时间（毫秒）
    /// </summary>
    [JsonPropertyName("response_time_ms")]
    public long? ResponseTimeMs { get; set; }
    
    /// <summary>
    /// 错误信息
    /// </summary>
    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; set; }
    
    /// <summary>
    /// 最后检查时间
    /// </summary>
    [JsonPropertyName("last_checked")]
    public DateTime LastChecked { get; set; }
}
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 分组摘要DTO
/// </summary>
public class ApiKeyGroupSummaryDto
{
    /// <summary>
    /// 总分组数
    /// </summary>
    [JsonPropertyName("total_groups")]
    public int TotalGroups { get; set; }
    
    /// <summary>
    /// 启用的分组数
    /// </summary>
    [JsonPropertyName("enabled_groups")]
    public int EnabledGroups { get; set; }
    
    /// <summary>
    /// 健康的分组数
    /// </summary>
    [JsonPropertyName("healthy_groups")]
    public int HealthyGroups { get; set; }
    
    /// <summary>
    /// 总API Key数
    /// </summary>
    [JsonPropertyName("total_api_keys")]
    public int TotalApiKeys { get; set; }
    
    /// <summary>
    /// 平均每组Key数量
    /// </summary>
    [JsonPropertyName("average_keys_per_group")]
    public double AverageKeysPerGroup { get; set; }
    
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
    /// 整体成功率
    /// </summary>
    [JsonPropertyName("overall_success_rate")]
    public double OverallSuccessRate { get; set; }
}



/// <summary>
/// 健康检查错误DTO
/// </summary>
public class HealthCheckErrorDto
{
    /// <summary>
    /// 错误类型
    /// </summary>
    [JsonPropertyName("error_type")]
    public string ErrorType { get; set; } = string.Empty;
    
    /// <summary>
    /// 错误消息
    /// </summary>
    [JsonPropertyName("error_message")]
    public string ErrorMessage { get; set; } = string.Empty;
    
    /// <summary>
    /// 错误代码
    /// </summary>
    [JsonPropertyName("error_code")]
    public string? ErrorCode { get; set; }
    
    /// <summary>
    /// 发生时间
    /// </summary>
    [JsonPropertyName("occurred_at")]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 影响的分组ID
    /// </summary>
    [JsonPropertyName("group_id")]
    public Guid? GroupId { get; set; }
    
    /// <summary>
    /// 影响的API Key ID
    /// </summary>
    [JsonPropertyName("api_key_id")]
    public Guid? ApiKeyId { get; set; }
    
    /// <summary>
    /// 错误严重程度
    /// </summary>
    public string Severity { get; set; } = "medium";
}

/// <summary>
/// 健康检查警告DTO
/// </summary>
public class HealthCheckWarningDto
{
    /// <summary>
    /// 警告类型
    /// </summary>
    [JsonPropertyName("warning_type")]
    public string WarningType { get; set; } = string.Empty;
    
    /// <summary>
    /// 警告消息
    /// </summary>
    [JsonPropertyName("warning_message")]
    public string WarningMessage { get; set; } = string.Empty;
    
    /// <summary>
    /// 发生时间
    /// </summary>
    [JsonPropertyName("occurred_at")]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 影响的分组ID
    /// </summary>
    [JsonPropertyName("group_id")]
    public Guid? GroupId { get; set; }
    
    /// <summary>
    /// 建议操作
    /// </summary>
    [JsonPropertyName("suggested_action")]
    public string? SuggestedAction { get; set; }
}

/// <summary>
/// 健康检查建议DTO
/// </summary>
public class HealthCheckRecommendationDto
{
    /// <summary>
    /// 建议类型
    /// </summary>
    [JsonPropertyName("recommendation_type")]
    public string RecommendationType { get; set; } = string.Empty;
    
    /// <summary>
    /// 建议标题
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// 建议描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// 优先级
    /// </summary>
    public string Priority { get; set; } = "medium";
    
    /// <summary>
    /// 影响的分组
    /// </summary>
    [JsonPropertyName("affected_groups")]
    public List<Guid> AffectedGroups { get; set; } = new();
    
    /// <summary>
    /// 预期效果
    /// </summary>
    [JsonPropertyName("expected_impact")]
    public string ExpectedImpact { get; set; } = string.Empty;
    
    /// <summary>
    /// 具体操作步骤
    /// </summary>
    public List<string> Actions { get; set; } = new();
}

/// <summary>
/// 分页信息DTO
/// </summary>
public class PaginationInfoDto
{
    /// <summary>
    /// 当前页码
    /// </summary>
    [JsonPropertyName("current_page")]
    public int CurrentPage { get; set; }
    
    /// <summary>
    /// 每页大小
    /// </summary>
    [JsonPropertyName("page_size")]
    public int PageSize { get; set; }
    
    /// <summary>
    /// 总记录数
    /// </summary>
    [JsonPropertyName("total_records")]
    public int TotalRecords { get; set; }
    
    /// <summary>
    /// 总页数
    /// </summary>
    [JsonPropertyName("total_pages")]
    public int TotalPages { get; set; }
    
    /// <summary>
    /// 是否有上一页
    /// </summary>
    [JsonPropertyName("has_previous")]
    public bool HasPrevious { get; set; }
    
    /// <summary>
    /// 是否有下一页
    /// </summary>
    [JsonPropertyName("has_next")]
    public bool HasNext { get; set; }
    
    /// <summary>
    /// 开始记录索引
    /// </summary>
    [JsonPropertyName("start_index")]
    public int StartIndex { get; set; }
    
    /// <summary>
    /// 结束记录索引
    /// </summary>
    [JsonPropertyName("end_index")]
    public int EndIndex { get; set; }
}

/// <summary>
/// 操作结果DTO
/// </summary>
public class OperationResultDto
{
    /// <summary>
    /// 是否成功
    /// </summary>
    public bool Success { get; set; }
    
    /// <summary>
    /// 消息
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// 错误代码
    /// </summary>
    [JsonPropertyName("error_code")]
    public string? ErrorCode { get; set; }
    
    /// <summary>
    /// 详细信息
    /// </summary>
    public Dictionary<string, object>? Details { get; set; }
    
    /// <summary>
    /// 操作时间
    /// </summary>
    [JsonPropertyName("operation_time")]
    public DateTime OperationTime { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 影响的记录数
    /// </summary>
    [JsonPropertyName("affected_records")]
    public int AffectedRecords { get; set; }
}

/// <summary>
/// 批量操作结果DTO
/// </summary>
public class BatchOperationResultDto
{
    /// <summary>
    /// 总操作数
    /// </summary>
    [JsonPropertyName("total_operations")]
    public int TotalOperations { get; set; }
    
    /// <summary>
    /// 成功数
    /// </summary>
    [JsonPropertyName("successful_operations")]
    public int SuccessfulOperations { get; set; }
    
    /// <summary>
    /// 失败数
    /// </summary>
    [JsonPropertyName("failed_operations")]
    public int FailedOperations { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    [JsonPropertyName("success_rate")]
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 操作结果详情
    /// </summary>
    public List<OperationResultDto> Results { get; set; } = new();
    
    /// <summary>
    /// 总耗时（毫秒）
    /// </summary>
    [JsonPropertyName("total_duration_ms")]
    public long TotalDurationMs { get; set; }
    
    /// <summary>
    /// 批量操作摘要
    /// </summary>
    public string Summary { get; set; } = string.Empty;
}
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组健康检查请求模型
/// </summary>
public class ApiKeyGroupHealthCheckRequest
{
    /// <summary>
    /// 是否强制检查所有分组（忽略检查间隔）
    /// </summary>
    [JsonPropertyName("force_check")]
    public bool ForceCheck { get; set; } = false;
    
    /// <summary>
    /// 指定要检查的分组ID列表（为空则检查所有分组）
    /// </summary>
    [JsonPropertyName("group_ids")]
    public List<Guid>? GroupIds { get; set; }
    
    /// <summary>
    /// 健康检查超时时间（秒）
    /// </summary>
    [Range(1, 300, ErrorMessage = "超时时间必须在1-300秒之间")]
    [JsonPropertyName("timeout_seconds")]
    public int TimeoutSeconds { get; set; } = 30;
    
    /// <summary>
    /// 是否异步执行检查
    /// </summary>
    [JsonPropertyName("async_check")]
    public bool AsyncCheck { get; set; } = false;
    
    /// <summary>
    /// 检查类型：basic(基础检查), full(完整检查)
    /// </summary>
    [Required(ErrorMessage = "检查类型不能为空")]
    [JsonPropertyName("check_type")]
    public string CheckType { get; set; } = "basic";
    
    /// <summary>
    /// 是否更新统计信息
    /// </summary>
    [JsonPropertyName("update_statistics")]
    public bool UpdateStatistics { get; set; } = true;
    
    /// <summary>
    /// 失败重试次数
    /// </summary>
    [Range(0, 5, ErrorMessage = "重试次数必须在0-5之间")]
    [JsonPropertyName("retry_count")]
    public int RetryCount { get; set; } = 1;
}
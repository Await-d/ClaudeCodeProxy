using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 更新API Key映射关系请求模型
/// </summary>
public class UpdateApiKeyMappingRequest
{
    /// <summary>
    /// 在分组中的权重（用于加权负载均衡）
    /// </summary>
    [Range(1, 100, ErrorMessage = "权重必须在1-100之间")]
    public int? Weight { get; set; }
    
    /// <summary>
    /// 是否为分组中的主Key
    /// </summary>
    [JsonPropertyName("is_primary")]
    public bool? IsPrimary { get; set; }
    
    /// <summary>
    /// 在分组中的顺序
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "顺序不能为负数")]
    public int? Order { get; set; }
    
    /// <summary>
    /// 是否启用此映射
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool? IsEnabled { get; set; }
    
    /// <summary>
    /// 重置统计信息
    /// </summary>
    [JsonPropertyName("reset_statistics")]
    public bool ResetStatistics { get; set; } = false;
    
    /// <summary>
    /// 重置健康状态
    /// </summary>
    [JsonPropertyName("reset_health")]
    public bool ResetHealth { get; set; } = false;
}
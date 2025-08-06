using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 添加API Key到分组请求模型
/// </summary>
public class AddApiKeyToGroupRequest
{
    /// <summary>
    /// API Key ID
    /// </summary>
    [Required(ErrorMessage = "API Key ID不能为空")]
    [JsonPropertyName("api_key_id")]
    public Guid ApiKeyId { get; set; }
    
    /// <summary>
    /// 在分组中的权重（用于加权负载均衡）
    /// </summary>
    [Range(1, 100, ErrorMessage = "权重必须在1-100之间")]
    public int Weight { get; set; } = 1;
    
    /// <summary>
    /// 是否为分组中的主Key
    /// </summary>
    [JsonPropertyName("is_primary")]
    public bool IsPrimary { get; set; } = false;
    
    /// <summary>
    /// 在分组中的顺序
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "顺序不能为负数")]
    public int Order { get; set; } = 0;
    
    /// <summary>
    /// 是否启用此映射
    /// </summary>
    [JsonPropertyName("is_enabled")]
    public bool IsEnabled { get; set; } = true;
}
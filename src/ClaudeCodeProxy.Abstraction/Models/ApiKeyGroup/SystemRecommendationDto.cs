using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 系统推荐DTO
/// </summary>
public class SystemRecommendationDto
{
    /// <summary>
    /// 推荐ID
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>
    /// 推荐类型：optimization, security, maintenance, configuration
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// 推荐标题
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// 推荐描述
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// 优先级：low, medium, high, critical
    /// </summary>
    public string Priority { get; set; } = "medium";
    
    /// <summary>
    /// 预期收益描述
    /// </summary>
    [JsonPropertyName("expected_benefit")]
    public string ExpectedBenefit { get; set; } = string.Empty;
    
    /// <summary>
    /// 实施复杂度：easy, medium, hard
    /// </summary>
    [JsonPropertyName("implementation_complexity")]
    public string ImplementationComplexity { get; set; } = "medium";
    
    /// <summary>
    /// 相关分组ID（如果适用）
    /// </summary>
    [JsonPropertyName("related_group_ids")]
    public List<Guid> RelatedGroupIds { get; set; } = new();
    
    /// <summary>
    /// 推荐生成时间
    /// </summary>
    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 是否已应用
    /// </summary>
    [JsonPropertyName("is_applied")]
    public bool IsApplied { get; set; } = false;
    
    /// <summary>
    /// 应用时间
    /// </summary>
    [JsonPropertyName("applied_at")]
    public DateTime? AppliedAt { get; set; }
}
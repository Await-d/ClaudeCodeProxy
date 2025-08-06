using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// API Key分组概览响应模型
/// </summary>
public class ApiKeyGroupOverviewResponse
{
    /// <summary>
    /// 分组摘要信息
    /// </summary>
    public ApiKeyGroupSummaryDto Summary { get; set; } = new();
    
    /// <summary>
    /// 分组列表
    /// </summary>
    public List<ApiKeyGroupResponse> Groups { get; set; } = new();
    
    /// <summary>
    /// 系统健康状态
    /// </summary>
    [JsonPropertyName("system_health")]
    public object SystemHealth { get; set; } = new();
    
    /// <summary>
    /// 分组类型分布
    /// </summary>
    [JsonPropertyName("group_type_distribution")]
    public List<GroupTypeDistributionDto> GroupTypeDistribution { get; set; } = new();
    
    /// <summary>
    /// 负载均衡策略分布
    /// </summary>
    [JsonPropertyName("load_balance_strategy_distribution")]
    public List<LoadBalanceStrategyDistributionDto> LoadBalanceStrategyDistribution { get; set; } = new();
    
    /// <summary>
    /// 总体统计信息
    /// </summary>
    [JsonPropertyName("overall_statistics")]
    public OverallGroupStatisticsDto OverallStatistics { get; set; } = new();
    
    /// <summary>
    /// 性能最佳的前5个分组
    /// </summary>
    [JsonPropertyName("top_performing_groups")]
    public List<TopPerformingGroupDto> TopPerformingGroups { get; set; } = new();
    
    /// <summary>
    /// 需要关注的分组
    /// </summary>
    [JsonPropertyName("groups_needing_attention")]
    public List<GroupNeedingAttentionDto> GroupsNeedingAttention { get; set; } = new();
    
    /// <summary>
    /// 数据生成时间
    /// </summary>
    [JsonPropertyName("generated_at")]
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
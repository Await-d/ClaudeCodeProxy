namespace ClaudeCodeProxy.Domain;

/// <summary>
/// API Key与分组的映射关系
/// </summary>
public class ApiKeyGroupMapping : Entity<Guid>
{
    /// <summary>
    /// API Key ID
    /// </summary>
    public Guid ApiKeyId { get; set; }
    
    /// <summary>
    /// 分组ID
    /// </summary>
    public Guid GroupId { get; set; }
    
    /// <summary>
    /// 在分组中的权重（用于加权负载均衡）
    /// </summary>
    public int Weight { get; set; } = 1;
    
    /// <summary>
    /// 是否为分组中的主Key
    /// </summary>
    public bool IsPrimary { get; set; } = false;
    
    /// <summary>
    /// 在分组中的顺序
    /// </summary>
    public int Order { get; set; } = 0;
    
    /// <summary>
    /// 是否启用此映射
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// 当前连接数（用于最少连接负载均衡）
    /// </summary>
    public int CurrentConnections { get; set; } = 0;
    
    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }
    
    /// <summary>
    /// 总使用次数
    /// </summary>
    public long TotalUsageCount { get; set; } = 0;
    
    /// <summary>
    /// 成功请求次数
    /// </summary>
    public long SuccessfulRequests { get; set; } = 0;
    
    /// <summary>
    /// 失败请求次数
    /// </summary>
    public long FailedRequests { get; set; } = 0;
    
    /// <summary>
    /// 平均响应时间（毫秒）
    /// </summary>
    public double AverageResponseTime { get; set; } = 0;
    
    /// <summary>
    /// 健康状态：healthy, unhealthy, unknown
    /// </summary>
    public string HealthStatus { get; set; } = "unknown";
    
    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    public DateTime? LastHealthCheckAt { get; set; }
    
    /// <summary>
    /// 连续失败次数
    /// </summary>
    public int ConsecutiveFailures { get; set; } = 0;
    
    /// <summary>
    /// 禁用截止时间（用于临时禁用）
    /// </summary>
    public DateTime? DisabledUntil { get; set; }
    
    /// <summary>
    /// 导航属性 - API Key
    /// </summary>
    public ApiKey? ApiKey { get; set; }
    
    /// <summary>
    /// 导航属性 - 分组
    /// </summary>
    public ApiKeyGroup? Group { get; set; }
    
    /// <summary>
    /// 检查映射是否可用
    /// </summary>
    public bool IsAvailable()
    {
        if (!IsEnabled || ApiKey == null || Group == null)
            return false;
            
        // 检查是否被临时禁用
        if (DisabledUntil.HasValue && DisabledUntil.Value > DateTime.UtcNow)
            return false;
            
        // 检查API Key是否有效
        if (!ApiKey.IsValid())
            return false;
            
        // 检查健康状态
        if (HealthStatus == "unhealthy")
            return false;
            
        return true;
    }
    
    /// <summary>
    /// 记录请求成功
    /// </summary>
    public void RecordSuccess(double responseTimeMs)
    {
        TotalUsageCount++;
        SuccessfulRequests++;
        ConsecutiveFailures = 0;
        LastUsedAt = DateTime.UtcNow;
        
        // 更新平均响应时间
        if (AverageResponseTime == 0)
        {
            AverageResponseTime = responseTimeMs;
        }
        else
        {
            // 使用移动平均
            AverageResponseTime = (AverageResponseTime * 0.9) + (responseTimeMs * 0.1);
        }
    }
    
    /// <summary>
    /// 记录请求失败
    /// </summary>
    public void RecordFailure()
    {
        TotalUsageCount++;
        FailedRequests++;
        ConsecutiveFailures++;
        LastUsedAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 重置健康状态
    /// </summary>
    public void ResetHealth()
    {
        HealthStatus = "unknown";
        ConsecutiveFailures = 0;
        DisabledUntil = null;
        LastHealthCheckAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 标记为不健康
    /// </summary>
    public void MarkUnhealthy(int disableSeconds = 300)
    {
        HealthStatus = "unhealthy";
        DisabledUntil = DateTime.UtcNow.AddSeconds(disableSeconds);
        LastHealthCheckAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 标记为健康
    /// </summary>
    public void MarkHealthy()
    {
        HealthStatus = "healthy";
        ConsecutiveFailures = 0;
        DisabledUntil = null;
        LastHealthCheckAt = DateTime.UtcNow;
    }
    
    /// <summary>
    /// 获取成功率
    /// </summary>
    public double GetSuccessRate()
    {
        return TotalUsageCount > 0 ? (double)SuccessfulRequests / TotalUsageCount : 0;
    }
    
    /// <summary>
    /// 获取权重分数（用于负载均衡）
    /// </summary>
    public double GetWeightScore()
    {
        double score = Weight;
        
        // 根据成功率调整权重
        var successRate = GetSuccessRate();
        score *= (0.5 + successRate * 0.5); // 0.5-1.0的系数
        
        // 根据连续失败次数降低权重
        if (ConsecutiveFailures > 0)
        {
            score *= Math.Max(0.1, 1.0 - (ConsecutiveFailures * 0.1));
        }
        
        // 根据响应时间调整权重
        if (AverageResponseTime > 0)
        {
            // 响应时间越长，权重越低
            var responseTimeFactor = Math.Max(0.1, 1.0 - (AverageResponseTime / 10000.0)); // 10秒为基准
            score *= responseTimeFactor;
        }
        
        return Math.Max(0.1, score); // 确保最小权重
    }
}
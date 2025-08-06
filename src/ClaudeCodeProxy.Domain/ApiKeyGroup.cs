namespace ClaudeCodeProxy.Domain;

/// <summary>
/// API Key分组实体
/// </summary>
public class ApiKeyGroup : Entity<Guid>
{
    /// <summary>
    /// 分组名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 分组描述
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 分组类型：default(默认), custom(自定义), system(系统)
    /// </summary>
    public string GroupType { get; set; } = "custom";
    
    /// <summary>
    /// 分组标签（用于分类和过滤）
    /// </summary>
    public List<string>? Tags { get; set; }
    
    /// <summary>
    /// 分组优先级（1-100，数字越小优先级越高）
    /// </summary>
    public int Priority { get; set; } = 50;
    
    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// 分组总费用限制
    /// </summary>
    public decimal? GroupCostLimit { get; set; }
    
    /// <summary>
    /// 分组总请求数限制
    /// </summary>
    public long? GroupRequestLimit { get; set; }
    
    /// <summary>
    /// 负载均衡策略：round_robin(轮询), weighted(加权), least_connections(最少连接)
    /// </summary>
    public string LoadBalanceStrategy { get; set; } = "round_robin";
    
    /// <summary>
    /// 故障转移策略：failover(故障转移), failfast(快速失败)
    /// </summary>
    public string FailoverStrategy { get; set; } = "failover";
    
    /// <summary>
    /// 健康检查间隔（秒）
    /// </summary>
    public int HealthCheckInterval { get; set; } = 30;
    
    /// <summary>
    /// 分组中的API Key数量
    /// </summary>
    public int ApiKeyCount { get; set; } = 0;
    
    /// <summary>
    /// 分组统计信息
    /// </summary>
    public GroupStatistics? Statistics { get; set; }
    
    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    public DateTime? LastHealthCheckAt { get; set; }
    
    /// <summary>
    /// 健康状态：healthy, unhealthy, unknown
    /// </summary>
    public string HealthStatus { get; set; } = "unknown";
    
    /// <summary>
    /// 当前轮询索引（用于轮询负载均衡）
    /// </summary>
    public int CurrentRoundRobinIndex { get; set; } = 0;
    
    /// <summary>
    /// 检查分组是否健康
    /// </summary>
    public bool IsHealthy()
    {
        return HealthStatus == "healthy" && IsEnabled;
    }
    
    /// <summary>
    /// 检查分组是否可以接受请求
    /// </summary>
    public bool CanAcceptRequest()
    {
        if (!IsHealthy() || ApiKeyCount == 0)
            return false;
            
        // 检查分组级别限制
        if (GroupRequestLimit.HasValue && Statistics?.TotalRequests >= GroupRequestLimit.Value)
            return false;
            
        if (GroupCostLimit.HasValue && Statistics?.TotalCost >= GroupCostLimit.Value)
            return false;
            
        return true;
    }
    
    /// <summary>
    /// 获取分组的使用率信息
    /// </summary>
    public GroupUsageInfo GetUsageInfo()
    {
        return new GroupUsageInfo
        {
            RequestUsage = GroupRequestLimit.HasValue && Statistics?.TotalRequests > 0 
                ? (double)Statistics.TotalRequests / GroupRequestLimit.Value 
                : 0,
            CostUsage = GroupCostLimit.HasValue && Statistics?.TotalCost > 0 
                ? (double)Statistics.TotalCost / (double)GroupCostLimit.Value 
                : 0,
            TotalRequests = Statistics?.TotalRequests ?? 0,
            TotalCost = Statistics?.TotalCost ?? 0,
            SuccessRate = Statistics?.SuccessRate ?? 0,
            AverageResponseTime = Statistics?.AverageResponseTime ?? 0,
            HealthyKeyCount = ApiKeyCount,
            LastUsedAt = Statistics?.LastUsedAt
        };
    }
}

/// <summary>
/// 分组使用率信息
/// </summary>
public class GroupUsageInfo
{
    /// <summary>
    /// 请求使用率
    /// </summary>
    public double RequestUsage { get; set; }
    
    /// <summary>
    /// 费用使用率
    /// </summary>
    public double CostUsage { get; set; }
    
    /// <summary>
    /// 总请求数
    /// </summary>
    public long TotalRequests { get; set; }
    
    /// <summary>
    /// 总费用
    /// </summary>
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 健康的Key数量
    /// </summary>
    public int HealthyKeyCount { get; set; }
    
    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }
}
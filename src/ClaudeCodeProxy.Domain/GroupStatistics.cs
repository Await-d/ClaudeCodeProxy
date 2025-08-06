using System.Text.Json;

namespace ClaudeCodeProxy.Domain;

/// <summary>
/// 分组统计信息
/// </summary>
public class GroupStatistics
{
    /// <summary>
    /// 总请求数
    /// </summary>
    public long TotalRequests { get; set; }
    
    /// <summary>
    /// 成功请求数
    /// </summary>
    public long SuccessfulRequests { get; set; }
    
    /// <summary>
    /// 失败请求数
    /// </summary>
    public long FailedRequests { get; set; }
    
    /// <summary>
    /// 总费用
    /// </summary>
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 平均响应时间（毫秒）
    /// </summary>
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }
    
    /// <summary>
    /// 统计开始时间
    /// </summary>
    public DateTime? StatisticsStartTime { get; set; }
    
    /// <summary>
    /// 峰值并发连接数
    /// </summary>
    public int PeakConcurrentConnections { get; set; }
    
    /// <summary>
    /// 当前并发连接数
    /// </summary>
    public int CurrentConcurrentConnections { get; set; }
    
    /// <summary>
    /// 每分钟请求数（最近1分钟）
    /// </summary>
    public double RequestsPerMinute { get; set; }
    
    /// <summary>
    /// 每小时请求数（最近1小时）
    /// </summary>
    public double RequestsPerHour { get; set; }
    
    /// <summary>
    /// 每日请求数（最近24小时）
    /// </summary>
    public double RequestsPerDay { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    public double SuccessRate => TotalRequests > 0 ? (double)SuccessfulRequests / TotalRequests : 0;
    
    /// <summary>
    /// 失败率
    /// </summary>
    public double FailureRate => TotalRequests > 0 ? (double)FailedRequests / TotalRequests : 0;
    
    /// <summary>
    /// 记录请求
    /// </summary>
    public void RecordRequest(bool success, decimal cost, double responseTimeMs)
    {
        TotalRequests++;
        LastUsedAt = DateTime.UtcNow;
        
        if (StatisticsStartTime == null)
        {
            StatisticsStartTime = DateTime.UtcNow;
        }
        
        if (success)
        {
            SuccessfulRequests++;
        }
        else
        {
            FailedRequests++;
        }
        
        TotalCost += cost;
        
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
    /// 重置统计信息
    /// </summary>
    public void Reset()
    {
        TotalRequests = 0;
        SuccessfulRequests = 0;
        FailedRequests = 0;
        TotalCost = 0;
        AverageResponseTime = 0;
        LastUsedAt = null;
        StatisticsStartTime = DateTime.UtcNow;
        PeakConcurrentConnections = 0;
        CurrentConcurrentConnections = 0;
        RequestsPerMinute = 0;
        RequestsPerHour = 0;
        RequestsPerDay = 0;
    }
    
    /// <summary>
    /// 获取统计摘要
    /// </summary>
    public StatisticsSummary GetSummary()
    {
        return new StatisticsSummary
        {
            TotalRequests = TotalRequests,
            SuccessfulRequests = SuccessfulRequests,
            FailedRequests = FailedRequests,
            TotalCost = TotalCost,
            AverageResponseTime = AverageResponseTime,
            SuccessRate = SuccessRate,
            FailureRate = FailureRate,
            Uptime = StatisticsStartTime != null 
                ? (DateTime.UtcNow - StatisticsStartTime.Value).TotalSeconds 
                : 0,
            RequestsPerMinute = RequestsPerMinute,
            RequestsPerHour = RequestsPerHour,
            RequestsPerDay = RequestsPerDay,
            CurrentConcurrentConnections = CurrentConcurrentConnections,
            PeakConcurrentConnections = PeakConcurrentConnections
        };
    }
    
    /// <summary>
    /// 序列化为JSON
    /// </summary>
    public string ToJson()
    {
        return JsonSerializer.Serialize(this);
    }
    
    /// <summary>
    /// 从JSON反序列化
    /// </summary>
    public static GroupStatistics? FromJson(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<GroupStatistics>(json);
        }
        catch
        {
            return null;
        }
    }
}

/// <summary>
/// 统计摘要
/// </summary>
public class StatisticsSummary
{
    /// <summary>
    /// 总请求数
    /// </summary>
    public long TotalRequests { get; set; }
    
    /// <summary>
    /// 成功请求数
    /// </summary>
    public long SuccessfulRequests { get; set; }
    
    /// <summary>
    /// 失败请求数
    /// </summary>
    public long FailedRequests { get; set; }
    
    /// <summary>
    /// 总费用
    /// </summary>
    public decimal TotalCost { get; set; }
    
    /// <summary>
    /// 平均响应时间
    /// </summary>
    public double AverageResponseTime { get; set; }
    
    /// <summary>
    /// 成功率
    /// </summary>
    public double SuccessRate { get; set; }
    
    /// <summary>
    /// 失败率
    /// </summary>
    public double FailureRate { get; set; }
    
    /// <summary>
    /// 运行时间（秒）
    /// </summary>
    public double Uptime { get; set; }
    
    /// <summary>
    /// 每分钟请求数
    /// </summary>
    public double RequestsPerMinute { get; set; }
    
    /// <summary>
    /// 每小时请求数
    /// </summary>
    public double RequestsPerHour { get; set; }
    
    /// <summary>
    /// 每日请求数
    /// </summary>
    public double RequestsPerDay { get; set; }
    
    /// <summary>
    /// 当前并发连接数
    /// </summary>
    public int CurrentConcurrentConnections { get; set; }
    
    /// <summary>
    /// 峰值并发连接数
    /// </summary>
    public int PeakConcurrentConnections { get; set; }
}
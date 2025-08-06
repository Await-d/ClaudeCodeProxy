using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 故障转移策略枚举
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FailoverStrategy
{
    /// <summary>
    /// 故障转移：失败时自动切换到其他API Key
    /// </summary>
    Failover = 0,
    
    /// <summary>
    /// 快速失败：失败时立即返回错误
    /// </summary>
    FailFast = 1,
    
    /// <summary>
    /// 重试：失败时重试指定次数
    /// </summary>
    Retry = 2,
    
    /// <summary>
    /// 熔断：失败率过高时暂时停止使用
    /// </summary>
    CircuitBreaker = 3
}

/// <summary>
/// 故障转移策略扩展方法
/// </summary>
public static class FailoverStrategyExtensions
{
    /// <summary>
    /// 转换为字符串
    /// </summary>
    public static string ToStringValue(this FailoverStrategy strategy)
    {
        return strategy switch
        {
            FailoverStrategy.Failover => "failover",
            FailoverStrategy.FailFast => "failfast",
            FailoverStrategy.Retry => "retry",
            FailoverStrategy.CircuitBreaker => "circuit_breaker",
            _ => "failover"
        };
    }
    
    /// <summary>
    /// 从字符串解析
    /// </summary>
    public static FailoverStrategy FromStringValue(string value)
    {
        return value?.ToLowerInvariant() switch
        {
            "failover" => FailoverStrategy.Failover,
            "failfast" => FailoverStrategy.FailFast,
            "retry" => FailoverStrategy.Retry,
            "circuit_breaker" => FailoverStrategy.CircuitBreaker,
            _ => FailoverStrategy.Failover
        };
    }
    
    /// <summary>
    /// 获取策略描述
    /// </summary>
    public static string GetDescription(this FailoverStrategy strategy)
    {
        return strategy switch
        {
            FailoverStrategy.Failover => "故障转移：失败时自动切换到其他可用的API Key",
            FailoverStrategy.FailFast => "快速失败：失败时立即返回错误，不进行重试",
            FailoverStrategy.Retry => "重试：失败时重试指定次数后再返回错误",
            FailoverStrategy.CircuitBreaker => "熔断：失败率过高时暂时停止使用该分组",
            _ => "未知策略"
        };
    }
}
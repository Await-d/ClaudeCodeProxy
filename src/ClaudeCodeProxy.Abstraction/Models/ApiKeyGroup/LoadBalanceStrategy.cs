using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 负载均衡策略枚举
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LoadBalanceStrategy
{
    /// <summary>
    /// 轮询
    /// </summary>
    RoundRobin = 0,
    
    /// <summary>
    /// 加权轮询
    /// </summary>
    Weighted = 1,
    
    /// <summary>
    /// 最少连接
    /// </summary>
    LeastConnections = 2,
    
    /// <summary>
    /// 随机
    /// </summary>
    Random = 3,
    
    /// <summary>
    /// 哈希
    /// </summary>
    Hash = 4,
    
    /// <summary>
    /// 最快响应
    /// </summary>
    FastestResponse = 5
}

/// <summary>
/// 负载均衡策略扩展方法
/// </summary>
public static class LoadBalanceStrategyExtensions
{
    /// <summary>
    /// 转换为字符串
    /// </summary>
    public static string ToStringValue(this LoadBalanceStrategy strategy)
    {
        return strategy switch
        {
            LoadBalanceStrategy.RoundRobin => "round_robin",
            LoadBalanceStrategy.Weighted => "weighted",
            LoadBalanceStrategy.LeastConnections => "least_connections",
            LoadBalanceStrategy.Random => "random",
            LoadBalanceStrategy.Hash => "hash",
            LoadBalanceStrategy.FastestResponse => "fastest_response",
            _ => "round_robin"
        };
    }
    
    /// <summary>
    /// 从字符串解析
    /// </summary>
    public static LoadBalanceStrategy FromStringValue(string value)
    {
        return value?.ToLowerInvariant() switch
        {
            "round_robin" => LoadBalanceStrategy.RoundRobin,
            "weighted" => LoadBalanceStrategy.Weighted,
            "least_connections" => LoadBalanceStrategy.LeastConnections,
            "random" => LoadBalanceStrategy.Random,
            "hash" => LoadBalanceStrategy.Hash,
            "fastest_response" => LoadBalanceStrategy.FastestResponse,
            _ => LoadBalanceStrategy.RoundRobin
        };
    }
    
    /// <summary>
    /// 获取策略描述
    /// </summary>
    public static string GetDescription(this LoadBalanceStrategy strategy)
    {
        return strategy switch
        {
            LoadBalanceStrategy.RoundRobin => "轮询：依次分配请求到每个API Key",
            LoadBalanceStrategy.Weighted => "加权轮询：根据权重分配请求",
            LoadBalanceStrategy.LeastConnections => "最少连接：分配请求到连接数最少的API Key",
            LoadBalanceStrategy.Random => "随机：随机选择API Key处理请求",
            LoadBalanceStrategy.Hash => "哈希：根据请求特征哈希选择API Key",
            LoadBalanceStrategy.FastestResponse => "最快响应：选择响应时间最短的API Key",
            _ => "未知策略"
        };
    }
}
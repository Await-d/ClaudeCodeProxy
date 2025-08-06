using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 健康状态枚举
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum HealthStatus
{
    /// <summary>
    /// 未知状态
    /// </summary>
    Unknown = 0,
    
    /// <summary>
    /// 健康
    /// </summary>
    Healthy = 1,
    
    /// <summary>
    /// 不健康
    /// </summary>
    Unhealthy = 2,
    
    /// <summary>
    /// 警告
    /// </summary>
    Warning = 3,
    
    /// <summary>
    /// 降级服务
    /// </summary>
    Degraded = 4,
    
    /// <summary>
    /// 维护中
    /// </summary>
    Maintenance = 5
}

/// <summary>
/// 健康状态扩展方法
/// </summary>
public static class HealthStatusExtensions
{
    /// <summary>
    /// 转换为字符串
    /// </summary>
    public static string ToStringValue(this HealthStatus status)
    {
        return status switch
        {
            HealthStatus.Unknown => "unknown",
            HealthStatus.Healthy => "healthy",
            HealthStatus.Unhealthy => "unhealthy",
            HealthStatus.Warning => "warning",
            HealthStatus.Degraded => "degraded",
            HealthStatus.Maintenance => "maintenance",
            _ => "unknown"
        };
    }
    
    /// <summary>
    /// 从字符串解析
    /// </summary>
    public static HealthStatus FromStringValue(string value)
    {
        return value?.ToLowerInvariant() switch
        {
            "healthy" => HealthStatus.Healthy,
            "unhealthy" => HealthStatus.Unhealthy,
            "warning" => HealthStatus.Warning,
            "degraded" => HealthStatus.Degraded,
            "maintenance" => HealthStatus.Maintenance,
            _ => HealthStatus.Unknown
        };
    }
    
    /// <summary>
    /// 获取状态描述
    /// </summary>
    public static string GetDescription(this HealthStatus status)
    {
        return status switch
        {
            HealthStatus.Unknown => "未知：尚未进行健康检查",
            HealthStatus.Healthy => "健康：所有功能正常",
            HealthStatus.Unhealthy => "不健康：存在严重问题",
            HealthStatus.Warning => "警告：存在轻微问题",
            HealthStatus.Degraded => "降级：功能受限但可用",
            HealthStatus.Maintenance => "维护：正在维护中",
            _ => "未知状态"
        };
    }
    
    /// <summary>
    /// 获取状态颜色（用于UI显示）
    /// </summary>
    public static string GetStatusColor(this HealthStatus status)
    {
        return status switch
        {
            HealthStatus.Healthy => "green",
            HealthStatus.Unhealthy => "red",
            HealthStatus.Warning => "yellow",
            HealthStatus.Degraded => "orange",
            HealthStatus.Maintenance => "blue",
            _ => "gray"
        };
    }
    
    /// <summary>
    /// 检查状态是否可用
    /// </summary>
    public static bool IsAvailable(this HealthStatus status)
    {
        return status is HealthStatus.Healthy or HealthStatus.Warning or HealthStatus.Degraded;
    }
}
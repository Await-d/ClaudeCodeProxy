using System.Text.Json.Serialization;

namespace ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;

/// <summary>
/// 分组类型枚举
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum GroupType
{
    /// <summary>
    /// 默认分组
    /// </summary>
    Default = 0,
    
    /// <summary>
    /// 自定义分组
    /// </summary>
    Custom = 1,
    
    /// <summary>
    /// 系统分组
    /// </summary>
    System = 2,
    
    /// <summary>
    /// 临时分组
    /// </summary>
    Temporary = 3,
    
    /// <summary>
    /// 备份分组
    /// </summary>
    Backup = 4
}

/// <summary>
/// 分组类型扩展方法
/// </summary>
public static class GroupTypeExtensions
{
    /// <summary>
    /// 转换为字符串
    /// </summary>
    public static string ToStringValue(this GroupType type)
    {
        return type switch
        {
            GroupType.Default => "default",
            GroupType.Custom => "custom",
            GroupType.System => "system",
            GroupType.Temporary => "temporary",
            GroupType.Backup => "backup",
            _ => "custom"
        };
    }
    
    /// <summary>
    /// 从字符串解析
    /// </summary>
    public static GroupType FromStringValue(string value)
    {
        return value?.ToLowerInvariant() switch
        {
            "default" => GroupType.Default,
            "custom" => GroupType.Custom,
            "system" => GroupType.System,
            "temporary" => GroupType.Temporary,
            "backup" => GroupType.Backup,
            _ => GroupType.Custom
        };
    }
    
    /// <summary>
    /// 获取类型描述
    /// </summary>
    public static string GetDescription(this GroupType type)
    {
        return type switch
        {
            GroupType.Default => "默认分组：系统自动创建的默认分组",
            GroupType.Custom => "自定义分组：用户创建的自定义分组",
            GroupType.System => "系统分组：系统内置的分组，不可删除",
            GroupType.Temporary => "临时分组：临时创建的分组，可自动清理",
            GroupType.Backup => "备份分组：用于故障转移的备份分组",
            _ => "未知类型"
        };
    }
    
    /// <summary>
    /// 检查是否可以删除
    /// </summary>
    public static bool CanBeDeleted(this GroupType type)
    {
        return type is not (GroupType.Default or GroupType.System);
    }
    
    /// <summary>
    /// 检查是否可以修改
    /// </summary>
    public static bool CanBeModified(this GroupType type)
    {
        return type is not GroupType.System;
    }
}
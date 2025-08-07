﻿namespace ClaudeCodeProxy.Domain;

/// <summary>
/// 账户信息实体类
/// </summary>
public sealed class Accounts : Entity<string>
{
    /// <summary>
    /// 平台类型：claude, claude-console, gemini, openai, thor
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    /// 账户名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 账户描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 账户类型：shared(共享) 或 dedicated(专属)
    /// </summary>
    public string AccountType { get; set; } = "shared";

    /// <summary>
    /// 调度优先级 (1-100)，数字越小优先级越高
    /// </summary>
    public int Priority { get; set; } = 50;

    /// <summary>
    /// Gemini项目编号（Gemini平台使用）
    /// </summary>
    public string? ProjectId { get; set; }

    /// <summary>
    /// API URL（Claude Console平台使用）
    /// </summary>
    public string? ApiUrl { get; set; }

    /// <summary>
    /// API Key（Claude Console平台使用）
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// 自定义User-Agent（Claude Console平台使用）
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 限流时间，单位分钟（Claude Console平台使用）
    /// </summary>
    public int RateLimitDuration { get; set; } = 60;

    /// <summary>
    /// 支持的模型映射表（Claude Console平台使用）
    /// JSON格式存储模型映射关系
    /// </summary>
    public List<string>? SupportedModels { get; set; }

    /// <summary>
    /// Claude AI OAuth信息（Claude平台使用）
    /// JSON格式存储OAuth令牌信息
    /// </summary>
    public ClaudeAiOauth? ClaudeAiOauth { get; set; }

    /// <summary>
    /// Gemini OAuth信息（Gemini平台使用）
    /// JSON格式存储OAuth令牌信息
    /// </summary>
    public string? GeminiOauth { get; set; }

    /// <summary>
    /// 代理配置信息
    /// JSON格式存储代理设置
    /// </summary>
    public ProxyConfig? Proxy { get; set; }

    /// <summary>
    /// 账户是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 账户状态：active, rate_limited, error, disabled
    /// </summary>
    public string Status { get; set; } = "active";

    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// 最后错误信息
    /// </summary>
    public string? LastError { get; set; }

    /// <summary>
    /// 限流解除时间
    /// </summary>
    public DateTime? RateLimitedUntil { get; set; }

    /// <summary>
    /// 使用次数统计
    /// </summary>
    public long UsageCount { get; set; } = 0;

    /// <summary>
    /// 账号池分组标识（用于权限控制）
    /// </summary>
    public string? PoolGroup { get; set; }

    /// <summary>
    /// 账户标签列表（用于分类和筛选）
    /// </summary>
    public List<string>? Tags { get; set; }

    /// <summary>
    /// 账户权重（用于负载均衡，数字越大权重越高）
    /// </summary>
    public int Weight { get; set; } = 1;

    /// <summary>
    /// 最大并发数限制
    /// </summary>
    public int MaxConcurrency { get; set; } = 10;

    public bool IsClaudeConsole => Platform.Equals("claude-console", StringComparison.OrdinalIgnoreCase);

    public bool IsGemini => Platform.Equals("gemini", StringComparison.OrdinalIgnoreCase);

    public bool IsClaude => Platform.Equals("claude", StringComparison.OrdinalIgnoreCase);

    public bool IsOpenAI => Platform.Equals("openai", StringComparison.OrdinalIgnoreCase);

    public bool IsThor => Platform.Equals("thor", StringComparison.OrdinalIgnoreCase);
}
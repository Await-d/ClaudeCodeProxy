using ClaudeCodeProxy.Domain;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// API Key分组服务接口
/// 提供分组管理、负载均衡、故障转移和健康监控功能
/// </summary>
public interface IApiKeyGroupService
{
    #region 分组管理

    /// <summary>
    /// 获取所有API Key分组
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分组列表</returns>
    Task<List<ApiKeyGroup>> GetAllGroupsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据ID获取API Key分组
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分组信息</returns>
    Task<ApiKeyGroup?> GetGroupByIdAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据名称获取API Key分组
    /// </summary>
    /// <param name="groupName">分组名称</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分组信息</returns>
    Task<ApiKeyGroup?> GetGroupByNameAsync(string groupName, CancellationToken cancellationToken = default);

    /// <summary>
    /// 创建新的API Key分组
    /// </summary>
    /// <param name="name">分组名称</param>
    /// <param name="description">分组描述</param>
    /// <param name="groupType">分组类型</param>
    /// <param name="priority">优先级</param>
    /// <param name="loadBalanceStrategy">负载均衡策略</param>
    /// <param name="failoverStrategy">故障转移策略</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>创建的分组</returns>
    Task<ApiKeyGroup> CreateGroupAsync(
        string name,
        string? description = null,
        string groupType = "custom",
        int priority = 50,
        string loadBalanceStrategy = "round_robin",
        string failoverStrategy = "failover",
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新API Key分组
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="name">新名称</param>
    /// <param name="description">新描述</param>
    /// <param name="priority">新优先级</param>
    /// <param name="loadBalanceStrategy">负载均衡策略</param>
    /// <param name="failoverStrategy">故障转移策略</param>
    /// <param name="tags">标签</param>
    /// <param name="groupCostLimit">分组费用限制</param>
    /// <param name="groupRequestLimit">分组请求限制</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新后的分组</returns>
    Task<ApiKeyGroup?> UpdateGroupAsync(
        Guid groupId,
        string? name = null,
        string? description = null,
        int? priority = null,
        string? loadBalanceStrategy = null,
        string? failoverStrategy = null,
        List<string>? tags = null,
        decimal? groupCostLimit = null,
        long? groupRequestLimit = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除API Key分组
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否删除成功</returns>
    Task<bool> DeleteGroupAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 启用或禁用分组
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="isEnabled">是否启用</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否操作成功</returns>
    Task<bool> ToggleGroupEnabledAsync(Guid groupId, bool isEnabled, CancellationToken cancellationToken = default);

    #endregion

    #region API Key映射管理

    /// <summary>
    /// 获取分组中的所有API Key映射
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>映射列表</returns>
    Task<List<ApiKeyGroupMapping>> GetGroupMappingsAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取API Key的所有分组映射
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>映射列表</returns>
    Task<List<ApiKeyGroupMapping>> GetApiKeyMappingsAsync(Guid apiKeyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 添加API Key到分组
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="weight">权重</param>
    /// <param name="order">顺序</param>
    /// <param name="isPrimary">是否为主Key</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>创建的映射</returns>
    Task<ApiKeyGroupMapping> AddApiKeyToGroupAsync(
        Guid groupId,
        Guid apiKeyId,
        int weight = 1,
        int order = 0,
        bool isPrimary = false,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 从分组中移除API Key
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否移除成功</returns>
    Task<bool> RemoveApiKeyFromGroupAsync(Guid groupId, Guid apiKeyId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新API Key在分组中的配置
    /// </summary>
    /// <param name="mappingId">映射ID</param>
    /// <param name="weight">新权重</param>
    /// <param name="order">新顺序</param>
    /// <param name="isPrimary">是否为主Key</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>更新后的映射</returns>
    Task<ApiKeyGroupMapping?> UpdateMappingAsync(
        Guid mappingId,
        int? weight = null,
        int? order = null,
        bool? isPrimary = null,
        CancellationToken cancellationToken = default);

    #endregion

    #region 负载均衡和选择

    /// <summary>
    /// 从分组中选择最佳的API Key
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选择的API Key</returns>
    Task<ApiKey?> SelectBestApiKeyFromGroupAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 根据负载均衡策略选择API Key
    /// </summary>
    /// <param name="group">分组信息</param>
    /// <param name="availableMappings">可用的映射列表</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选择的映射</returns>
    Task<ApiKeyGroupMapping?> SelectApiKeyMappingAsync(
        ApiKeyGroup group,
        List<ApiKeyGroupMapping> availableMappings,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取分组中所有健康的API Key
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>健康的API Key列表</returns>
    Task<List<ApiKey>> GetHealthyApiKeysInGroupAsync(Guid groupId, CancellationToken cancellationToken = default);

    #endregion

    #region 健康监控

    /// <summary>
    /// 检查分组的健康状态
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否健康</returns>
    Task<bool> CheckGroupHealthAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 检查分组中API Key的健康状态
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>健康检查结果</returns>
    Task<Dictionary<Guid, bool>> CheckApiKeysHealthInGroupAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新分组健康状态
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="healthStatus">健康状态</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否更新成功</returns>
    Task<bool> UpdateGroupHealthStatusAsync(Guid groupId, string healthStatus, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新映射健康状态
    /// </summary>
    /// <param name="mappingId">映射ID</param>
    /// <param name="healthStatus">健康状态</param>
    /// <param name="disableSeconds">禁用时长（秒）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否更新成功</returns>
    Task<bool> UpdateMappingHealthStatusAsync(
        Guid mappingId,
        string healthStatus,
        int disableSeconds = 0,
        CancellationToken cancellationToken = default);

    #endregion

    #region 统计和分析

    /// <summary>
    /// 记录分组中API Key的使用情况
    /// </summary>
    /// <param name="mappingId">映射ID</param>
    /// <param name="success">是否成功</param>
    /// <param name="cost">费用</param>
    /// <param name="responseTimeMs">响应时间（毫秒）</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否记录成功</returns>
    Task<bool> RecordApiKeyUsageAsync(
        Guid mappingId,
        bool success,
        decimal cost = 0,
        double responseTimeMs = 0,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取分组统计信息
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>统计信息</returns>
    Task<GroupStatistics?> GetGroupStatisticsAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新分组统计信息
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否更新成功</returns>
    Task<bool> RefreshGroupStatisticsAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取分组使用率信息
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>使用率信息</returns>
    Task<GroupUsageInfo?> GetGroupUsageInfoAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取所有分组的概览信息
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分组概览列表</returns>
    Task<List<GroupOverviewInfo>> GetGroupsOverviewAsync(CancellationToken cancellationToken = default);

    #endregion

    #region 故障处理

    /// <summary>
    /// 处理API Key故障
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="groupId">分组ID</param>
    /// <param name="errorMessage">错误信息</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否处理成功</returns>
    Task<bool> HandleApiKeyFailureAsync(
        Guid apiKeyId,
        Guid groupId,
        string? errorMessage = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 恢复API Key
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否恢复成功</returns>
    Task<bool> RecoverApiKeyAsync(Guid apiKeyId, Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 执行故障转移
    /// </summary>
    /// <param name="failedApiKeyId">故障的API Key ID</param>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>故障转移到的API Key</returns>
    Task<ApiKey?> PerformFailoverAsync(Guid failedApiKeyId, Guid groupId, CancellationToken cancellationToken = default);

    #endregion

    #region 兼容性方法（为了兼容现有代码）

    /// <summary>
    /// 从分组中选择API Key（兼容方法）
    /// </summary>
    /// <param name="groupId">分组ID</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选择的API Key</returns>
    Task<ApiKey?> SelectApiKeyFromGroupAsync(Guid groupId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 记录成功请求（兼容方法）
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="groupId">分组ID</param>
    /// <param name="cost">费用</param>
    /// <param name="responseTimeMs">响应时间</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否记录成功</returns>
    Task<bool> RecordSuccessAsync(
        Guid apiKeyId,
        Guid groupId,
        decimal cost = 0,
        double responseTimeMs = 0,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 记录失败请求（兼容方法）
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="groupId">分组ID</param>
    /// <param name="errorMessage">错误信息</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>是否记录成功</returns>
    Task<bool> RecordFailureAsync(
        Guid apiKeyId,
        Guid groupId,
        string? errorMessage = null,
        CancellationToken cancellationToken = default);

    #endregion
}

/// <summary>
/// 分组概览信息
/// </summary>
public class GroupOverviewInfo
{
    /// <summary>
    /// 分组ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 分组名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 分组描述
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 分组类型
    /// </summary>
    public string GroupType { get; set; } = "custom";

    /// <summary>
    /// 优先级
    /// </summary>
    public int Priority { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; }

    /// <summary>
    /// 健康状态
    /// </summary>
    public string HealthStatus { get; set; } = "unknown";

    /// <summary>
    /// API Key数量
    /// </summary>
    public int ApiKeyCount { get; set; }

    /// <summary>
    /// 健康的API Key数量
    /// </summary>
    public int HealthyApiKeyCount { get; set; }

    /// <summary>
    /// 负载均衡策略
    /// </summary>
    public string LoadBalanceStrategy { get; set; } = "round_robin";

    /// <summary>
    /// 使用率信息
    /// </summary>
    public GroupUsageInfo? Usage { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最后使用时间
    /// </summary>
    public DateTime? LastUsedAt { get; set; }

    /// <summary>
    /// 最后健康检查时间
    /// </summary>
    public DateTime? LastHealthCheckAt { get; set; }
}
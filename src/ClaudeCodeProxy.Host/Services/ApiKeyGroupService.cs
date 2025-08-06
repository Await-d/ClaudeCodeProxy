using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// API Key分组服务实现
/// 提供分组管理、负载均衡、故障转移和健康监控功能
/// </summary>
public class ApiKeyGroupService : IApiKeyGroupService
{
    private readonly IContext _context;
    private readonly ILogger<ApiKeyGroupService> _logger;
    private readonly ConcurrentDictionary<Guid, DateTime> _lastHealthCheckCache = new();
    private readonly ConcurrentDictionary<Guid, int> _roundRobinIndexCache = new();

    public ApiKeyGroupService(IContext context, ILogger<ApiKeyGroupService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region 分组管理

    /// <summary>
    /// 获取所有API Key分组
    /// </summary>
    public async Task<List<ApiKeyGroup>> GetAllGroupsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ApiKeyGroups
                .AsNoTracking()
                .OrderBy(x => x.Priority)
                .ThenBy(x => x.Name)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取所有API Key分组时发生错误");
            throw;
        }
    }

    /// <summary>
    /// 根据ID获取API Key分组
    /// </summary>
    public async Task<ApiKeyGroup?> GetGroupByIdAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ApiKeyGroups
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == groupId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "根据ID获取API Key分组时发生错误: {GroupId}", groupId);
            throw;
        }
    }

    /// <summary>
    /// 根据名称获取API Key分组
    /// </summary>
    public async Task<ApiKeyGroup?> GetGroupByNameAsync(string groupName, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ApiKeyGroups
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Name == groupName, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "根据名称获取API Key分组时发生错误: {GroupName}", groupName);
            throw;
        }
    }

    /// <summary>
    /// 创建新的API Key分组
    /// </summary>
    public async Task<ApiKeyGroup> CreateGroupAsync(
        string name,
        string? description = null,
        string groupType = "custom",
        int priority = 50,
        string loadBalanceStrategy = "round_robin",
        string failoverStrategy = "failover",
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 检查名称是否已存在
            var existingGroup = await GetGroupByNameAsync(name, cancellationToken);
            if (existingGroup != null)
            {
                throw new InvalidOperationException($"名称为 '{name}' 的分组已存在");
            }

            var group = new ApiKeyGroup
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = description,
                GroupType = groupType,
                Priority = priority,
                LoadBalanceStrategy = loadBalanceStrategy,
                FailoverStrategy = failoverStrategy,
                Statistics = new GroupStatistics(),
                CreatedAt = DateTime.UtcNow
            };

            _context.ApiKeyGroups.Add(group);
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功创建API Key分组: {GroupName} (ID: {GroupId})", name, group.Id);
            return group;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "创建API Key分组时发生错误: {GroupName}", name);
            throw;
        }
    }

    /// <summary>
    /// 更新API Key分组
    /// </summary>
    public async Task<ApiKeyGroup?> UpdateGroupAsync(
        Guid groupId,
        string? name = null,
        string? description = null,
        int? priority = null,
        string? loadBalanceStrategy = null,
        string? failoverStrategy = null,
        List<string>? tags = null,
        decimal? groupCostLimit = null,
        long? groupRequestLimit = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _context.ApiKeyGroups.FirstOrDefaultAsync(x => x.Id == groupId, cancellationToken);
            if (group == null)
            {
                return null;
            }

            // 检查新名称是否与其他分组冲突
            if (!string.IsNullOrEmpty(name) && name != group.Name)
            {
                var existingGroup = await GetGroupByNameAsync(name, cancellationToken);
                if (existingGroup != null && existingGroup.Id != groupId)
                {
                    throw new InvalidOperationException($"名称为 '{name}' 的分组已存在");
                }
                group.Name = name;
            }

            if (description != null) group.Description = description;
            if (priority.HasValue) group.Priority = priority.Value;
            if (!string.IsNullOrEmpty(loadBalanceStrategy)) group.LoadBalanceStrategy = loadBalanceStrategy;
            if (!string.IsNullOrEmpty(failoverStrategy)) group.FailoverStrategy = failoverStrategy;
            if (tags != null) group.Tags = tags;
            if (groupCostLimit.HasValue) group.GroupCostLimit = groupCostLimit.Value;
            if (groupRequestLimit.HasValue) group.GroupRequestLimit = groupRequestLimit.Value;

            group.ModifiedAt = DateTime.UtcNow;
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功更新API Key分组: {GroupId}", groupId);
            return group;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新API Key分组时发生错误: {GroupId}", groupId);
            throw;
        }
    }

    /// <summary>
    /// 删除API Key分组
    /// </summary>
    public async Task<bool> DeleteGroupAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _context.ApiKeyGroups.FirstOrDefaultAsync(x => x.Id == groupId, cancellationToken);
            if (group == null)
            {
                return false;
            }

            // 检查是否为系统分组
            if (group.GroupType == "system")
            {
                throw new InvalidOperationException("不能删除系统分组");
            }

            // 先删除相关映射
            var mappings = await _context.ApiKeyGroupMappings
                .Where(x => x.GroupId == groupId)
                .ToListAsync(cancellationToken);

            if (mappings.Any())
            {
                _context.ApiKeyGroupMappings.RemoveRange(mappings);
            }

            _context.ApiKeyGroups.Remove(group);
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功删除API Key分组: {GroupId}", groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "删除API Key分组时发生错误: {GroupId}", groupId);
            throw;
        }
    }

    /// <summary>
    /// 启用或禁用分组
    /// </summary>
    public async Task<bool> ToggleGroupEnabledAsync(Guid groupId, bool isEnabled, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await _context.ApiKeyGroups.FirstOrDefaultAsync(x => x.Id == groupId, cancellationToken);
            if (group == null)
            {
                return false;
            }

            group.IsEnabled = isEnabled;
            group.ModifiedAt = DateTime.UtcNow;
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功{Action}API Key分组: {GroupId}", isEnabled ? "启用" : "禁用", groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "切换API Key分组状态时发生错误: {GroupId}", groupId);
            throw;
        }
    }

    #endregion

    #region API Key映射管理

    /// <summary>
    /// 获取分组中的所有API Key映射
    /// </summary>
    public async Task<List<ApiKeyGroupMapping>> GetGroupMappingsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ApiKeyGroupMappings
                .Include(x => x.ApiKey)
                .Where(x => x.GroupId == groupId)
                .OrderBy(x => x.Order)
                .ThenByDescending(x => x.IsPrimary)
                .ThenByDescending(x => x.Weight)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分组映射时发生错误: {GroupId}", groupId);
            throw;
        }
    }

    /// <summary>
    /// 获取API Key的所有分组映射
    /// </summary>
    public async Task<List<ApiKeyGroupMapping>> GetApiKeyMappingsAsync(Guid apiKeyId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ApiKeyGroupMappings
                .Include(x => x.Group)
                .Where(x => x.ApiKeyId == apiKeyId)
                .OrderBy(x => x.Group!.Priority)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取API Key映射时发生错误: {ApiKeyId}", apiKeyId);
            throw;
        }
    }

    /// <summary>
    /// 添加API Key到分组
    /// </summary>
    public async Task<ApiKeyGroupMapping> AddApiKeyToGroupAsync(
        Guid groupId,
        Guid apiKeyId,
        int weight = 1,
        int order = 0,
        bool isPrimary = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 检查分组是否存在
            var group = await GetGroupByIdAsync(groupId, cancellationToken);
            if (group == null)
            {
                throw new ArgumentException($"分组不存在: {groupId}");
            }

            // 检查API Key是否存在
            var apiKey = await _context.ApiKeys.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == apiKeyId, cancellationToken);
            if (apiKey == null)
            {
                throw new ArgumentException($"API Key不存在: {apiKeyId}");
            }

            // 检查映射是否已存在
            var existingMapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.GroupId == groupId && x.ApiKeyId == apiKeyId, cancellationToken);
            if (existingMapping != null)
            {
                throw new InvalidOperationException("API Key已存在于该分组中");
            }

            // 如果设置为主Key，需要取消其他主Key
            if (isPrimary)
            {
                await _context.ApiKeyGroupMappings
                    .Where(x => x.GroupId == groupId && x.IsPrimary)
                    .ExecuteUpdateAsync(x => x.SetProperty(m => m.IsPrimary, false), cancellationToken);
            }

            var mapping = new ApiKeyGroupMapping
            {
                Id = Guid.NewGuid(),
                GroupId = groupId,
                ApiKeyId = apiKeyId,
                Weight = weight,
                Order = order,
                IsPrimary = isPrimary,
                CreatedAt = DateTime.UtcNow
            };

            _context.ApiKeyGroupMappings.Add(mapping);

            // 更新分组中的API Key数量
            await _context.ApiKeyGroups
                .Where(x => x.Id == groupId)
                .ExecuteUpdateAsync(x => x.SetProperty(g => g.ApiKeyCount, g => g.ApiKeyCount + 1), cancellationToken);

            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功添加API Key到分组: ApiKey={ApiKeyId}, Group={GroupId}", apiKeyId, groupId);
            return mapping;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "添加API Key到分组时发生错误: ApiKey={ApiKeyId}, Group={GroupId}", apiKeyId, groupId);
            throw;
        }
    }

    /// <summary>
    /// 从分组中移除API Key
    /// </summary>
    public async Task<bool> RemoveApiKeyFromGroupAsync(Guid groupId, Guid apiKeyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.GroupId == groupId && x.ApiKeyId == apiKeyId, cancellationToken);
            if (mapping == null)
            {
                return false;
            }

            _context.ApiKeyGroupMappings.Remove(mapping);

            // 更新分组中的API Key数量
            await _context.ApiKeyGroups
                .Where(x => x.Id == groupId)
                .ExecuteUpdateAsync(x => x.SetProperty(g => g.ApiKeyCount, g => g.ApiKeyCount - 1), cancellationToken);

            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功从分组中移除API Key: ApiKey={ApiKeyId}, Group={GroupId}", apiKeyId, groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "从分组中移除API Key时发生错误: ApiKey={ApiKeyId}, Group={GroupId}", apiKeyId, groupId);
            throw;
        }
    }

    /// <summary>
    /// 更新API Key在分组中的配置
    /// </summary>
    public async Task<ApiKeyGroupMapping?> UpdateMappingAsync(
        Guid mappingId,
        int? weight = null,
        int? order = null,
        bool? isPrimary = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.Id == mappingId, cancellationToken);
            if (mapping == null)
            {
                return null;
            }

            // 如果设置为主Key，需要取消同分组其他主Key
            if (isPrimary == true && !mapping.IsPrimary)
            {
                await _context.ApiKeyGroupMappings
                    .Where(x => x.GroupId == mapping.GroupId && x.IsPrimary && x.Id != mappingId)
                    .ExecuteUpdateAsync(x => x.SetProperty(m => m.IsPrimary, false), cancellationToken);
            }

            if (weight.HasValue) mapping.Weight = weight.Value;
            if (order.HasValue) mapping.Order = order.Value;
            if (isPrimary.HasValue) mapping.IsPrimary = isPrimary.Value;

            mapping.ModifiedAt = DateTime.UtcNow;
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功更新映射配置: {MappingId}", mappingId);
            return mapping;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新映射配置时发生错误: {MappingId}", mappingId);
            throw;
        }
    }

    #endregion

    #region 负载均衡和选择

    /// <summary>
    /// 从分组中选择最佳的API Key
    /// </summary>
    public async Task<ApiKey?> SelectBestApiKeyFromGroupAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await GetGroupByIdAsync(groupId, cancellationToken);
            if (group == null || !group.CanAcceptRequest())
            {
                return null;
            }

            var availableMappings = await GetAvailableMappingsAsync(groupId, cancellationToken);
            if (!availableMappings.Any())
            {
                return null;
            }

            var selectedMapping = await SelectApiKeyMappingAsync(group, availableMappings, cancellationToken);
            return selectedMapping?.ApiKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "从分组中选择API Key时发生错误: {GroupId}", groupId);
            return null;
        }
    }

    /// <summary>
    /// 根据负载均衡策略选择API Key
    /// </summary>
    public async Task<ApiKeyGroupMapping?> SelectApiKeyMappingAsync(
        ApiKeyGroup group,
        List<ApiKeyGroupMapping> availableMappings,
        CancellationToken cancellationToken = default)
    {
        if (!availableMappings.Any())
        {
            return null;
        }

        try
        {
            return group.LoadBalanceStrategy.ToLowerInvariant() switch
            {
                "round_robin" => await SelectRoundRobinAsync(group, availableMappings),
                "weighted" => await SelectWeightedAsync(availableMappings),
                "least_connections" => await SelectLeastConnectionsAsync(availableMappings),
                _ => await SelectRoundRobinAsync(group, availableMappings)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "选择API Key映射时发生错误: GroupId={GroupId}, Strategy={Strategy}", 
                group.Id, group.LoadBalanceStrategy);
            // 降级到轮询策略
            return await SelectRoundRobinAsync(group, availableMappings);
        }
    }

    /// <summary>
    /// 获取分组中所有健康的API Key
    /// </summary>
    public async Task<List<ApiKey>> GetHealthyApiKeysInGroupAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var availableMappings = await GetAvailableMappingsAsync(groupId, cancellationToken);
            return availableMappings.Select(x => x.ApiKey!).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分组健康API Key时发生错误: {GroupId}", groupId);
            return new List<ApiKey>();
        }
    }

    #endregion

    #region 健康监控

    /// <summary>
    /// 检查分组的健康状态
    /// </summary>
    public async Task<bool> CheckGroupHealthAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await GetGroupByIdAsync(groupId, cancellationToken);
            if (group == null || !group.IsEnabled)
            {
                return false;
            }

            var healthyKeys = await GetHealthyApiKeysInGroupAsync(groupId, cancellationToken);
            var isHealthy = healthyKeys.Any();

            var newHealthStatus = isHealthy ? "healthy" : "unhealthy";
            if (group.HealthStatus != newHealthStatus)
            {
                await UpdateGroupHealthStatusAsync(groupId, newHealthStatus, cancellationToken);
            }

            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查分组健康状态时发生错误: {GroupId}", groupId);
            return false;
        }
    }

    /// <summary>
    /// 检查分组中API Key的健康状态
    /// </summary>
    public async Task<Dictionary<Guid, bool>> CheckApiKeysHealthInGroupAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var mappings = await GetGroupMappingsAsync(groupId, cancellationToken);
            var healthResults = new Dictionary<Guid, bool>();

            foreach (var mapping in mappings)
            {
                if (mapping.ApiKey == null) continue;

                var isHealthy = IsApiKeyHealthy(mapping.ApiKey, mapping);
                healthResults[mapping.ApiKeyId] = isHealthy;

                // 更新映射健康状态
                var newStatus = isHealthy ? "healthy" : "unhealthy";
                if (mapping.HealthStatus != newStatus)
                {
                    await UpdateMappingHealthStatusAsync(mapping.Id, newStatus, cancellationToken: cancellationToken);
                }
            }

            return healthResults;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查分组中API Key健康状态时发生错误: {GroupId}", groupId);
            return new Dictionary<Guid, bool>();
        }
    }

    /// <summary>
    /// 更新分组健康状态
    /// </summary>
    public async Task<bool> UpdateGroupHealthStatusAsync(Guid groupId, string healthStatus, CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.ApiKeyGroups
                .Where(x => x.Id == groupId)
                .ExecuteUpdateAsync(x => x
                    .SetProperty(g => g.HealthStatus, healthStatus)
                    .SetProperty(g => g.LastHealthCheckAt, DateTime.UtcNow), cancellationToken);

            _lastHealthCheckCache[groupId] = DateTime.UtcNow;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新分组健康状态时发生错误: {GroupId}", groupId);
            return false;
        }
    }

    /// <summary>
    /// 更新映射健康状态
    /// </summary>
    public async Task<bool> UpdateMappingHealthStatusAsync(
        Guid mappingId,
        string healthStatus,
        int disableSeconds = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var disabledUntil = disableSeconds > 0 ? DateTime.UtcNow.AddSeconds(disableSeconds) : (DateTime?)null;

            await _context.ApiKeyGroupMappings
                .Where(x => x.Id == mappingId)
                .ExecuteUpdateAsync(x => x
                    .SetProperty(m => m.HealthStatus, healthStatus)
                    .SetProperty(m => m.LastHealthCheckAt, DateTime.UtcNow)
                    .SetProperty(m => m.DisabledUntil, disabledUntil), cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "更新映射健康状态时发生错误: {MappingId}", mappingId);
            return false;
        }
    }

    #endregion

    #region 统计和分析

    /// <summary>
    /// 记录分组中API Key的使用情况
    /// </summary>
    public async Task<bool> RecordApiKeyUsageAsync(
        Guid mappingId,
        bool success,
        decimal cost = 0,
        double responseTimeMs = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .Include(x => x.Group)
                .FirstOrDefaultAsync(x => x.Id == mappingId, cancellationToken);
            if (mapping == null) return false;

            // 更新映射统计
            if (success)
            {
                mapping.RecordSuccess(responseTimeMs);
            }
            else
            {
                mapping.RecordFailure();
            }

            // 更新分组统计
            if (mapping.Group?.Statistics != null)
            {
                mapping.Group.Statistics.RecordRequest(success, cost, responseTimeMs);
            }

            await _context.SaveAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "记录API Key使用情况时发生错误: {MappingId}", mappingId);
            return false;
        }
    }

    /// <summary>
    /// 获取分组统计信息
    /// </summary>
    public async Task<GroupStatistics?> GetGroupStatisticsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await GetGroupByIdAsync(groupId, cancellationToken);
            return group?.Statistics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分组统计信息时发生错误: {GroupId}", groupId);
            return null;
        }
    }

    /// <summary>
    /// 更新分组统计信息
    /// </summary>
    public async Task<bool> RefreshGroupStatisticsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var mappings = await GetGroupMappingsAsync(groupId, cancellationToken);
            if (!mappings.Any()) return false;

            var statistics = new GroupStatistics();

            foreach (var mapping in mappings)
            {
                statistics.TotalRequests += mapping.TotalUsageCount;
                statistics.SuccessfulRequests += mapping.SuccessfulRequests;
                statistics.FailedRequests += mapping.FailedRequests;

                if (mapping.LastUsedAt.HasValue && 
                    (statistics.LastUsedAt == null || mapping.LastUsedAt > statistics.LastUsedAt))
                {
                    statistics.LastUsedAt = mapping.LastUsedAt;
                }

                statistics.CurrentConcurrentConnections += mapping.CurrentConnections;
            }

            // 计算平均响应时间
            if (mappings.Count > 0)
            {
                statistics.AverageResponseTime = mappings.Average(x => x.AverageResponseTime);
            }

            await _context.ApiKeyGroups
                .Where(x => x.Id == groupId)
                .ExecuteUpdateAsync(x => x.SetProperty(g => g.Statistics, statistics), cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "刷新分组统计信息时发生错误: {GroupId}", groupId);
            return false;
        }
    }

    /// <summary>
    /// 获取分组使用率信息
    /// </summary>
    public async Task<GroupUsageInfo?> GetGroupUsageInfoAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await GetGroupByIdAsync(groupId, cancellationToken);
            return group?.GetUsageInfo();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分组使用率信息时发生错误: {GroupId}", groupId);
            return null;
        }
    }

    /// <summary>
    /// 获取所有分组的概览信息
    /// </summary>
    public async Task<List<GroupOverviewInfo>> GetGroupsOverviewAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var groups = await GetAllGroupsAsync(cancellationToken);
            var overviews = new List<GroupOverviewInfo>();

            foreach (var group in groups)
            {
                var healthyCount = await GetHealthyApiKeysInGroupAsync(group.Id, cancellationToken);
                
                overviews.Add(new GroupOverviewInfo
                {
                    Id = group.Id,
                    Name = group.Name,
                    Description = group.Description,
                    GroupType = group.GroupType,
                    Priority = group.Priority,
                    IsEnabled = group.IsEnabled,
                    HealthStatus = group.HealthStatus,
                    ApiKeyCount = group.ApiKeyCount,
                    HealthyApiKeyCount = healthyCount.Count,
                    LoadBalanceStrategy = group.LoadBalanceStrategy,
                    Usage = group.GetUsageInfo(),
                    CreatedAt = group.CreatedAt,
                    LastUsedAt = group.Statistics?.LastUsedAt,
                    LastHealthCheckAt = group.LastHealthCheckAt
                });
            }

            return overviews;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取分组概览信息时发生错误");
            return new List<GroupOverviewInfo>();
        }
    }

    #endregion

    #region 故障处理

    /// <summary>
    /// 处理API Key故障
    /// </summary>
    public async Task<bool> HandleApiKeyFailureAsync(
        Guid apiKeyId,
        Guid groupId,
        string? errorMessage = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.ApiKeyId == apiKeyId && x.GroupId == groupId, cancellationToken);
            if (mapping == null) return false;

            mapping.RecordFailure();

            // 如果连续失败次数过多，临时禁用
            if (mapping.ConsecutiveFailures >= 3)
            {
                mapping.MarkUnhealthy(300); // 禁用5分钟
                _logger.LogWarning("API Key因连续失败被临时禁用: ApiKeyId={ApiKeyId}, GroupId={GroupId}, Failures={Failures}", 
                    apiKeyId, groupId, mapping.ConsecutiveFailures);
            }

            await _context.SaveAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "处理API Key故障时发生错误: ApiKeyId={ApiKeyId}, GroupId={GroupId}", apiKeyId, groupId);
            return false;
        }
    }

    /// <summary>
    /// 恢复API Key
    /// </summary>
    public async Task<bool> RecoverApiKeyAsync(Guid apiKeyId, Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.ApiKeyId == apiKeyId && x.GroupId == groupId, cancellationToken);
            if (mapping == null) return false;

            mapping.MarkHealthy();
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("API Key已恢复健康状态: ApiKeyId={ApiKeyId}, GroupId={GroupId}", apiKeyId, groupId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "恢复API Key时发生错误: ApiKeyId={ApiKeyId}, GroupId={GroupId}", apiKeyId, groupId);
            return false;
        }
    }

    /// <summary>
    /// 执行故障转移
    /// </summary>
    public async Task<ApiKey?> PerformFailoverAsync(Guid failedApiKeyId, Guid groupId, CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await GetGroupByIdAsync(groupId, cancellationToken);
            if (group == null || group.FailoverStrategy == "failfast")
            {
                return null;
            }

            // 处理故障
            await HandleApiKeyFailureAsync(failedApiKeyId, groupId, cancellationToken: cancellationToken);

            // 选择替代的API Key
            var availableMappings = await GetAvailableMappingsAsync(groupId, cancellationToken);
            availableMappings = availableMappings.Where(x => x.ApiKeyId != failedApiKeyId).ToList();

            if (!availableMappings.Any())
            {
                _logger.LogWarning("分组中没有可用的API Key进行故障转移: GroupId={GroupId}", groupId);
                return null;
            }

            var fallbackMapping = await SelectApiKeyMappingAsync(group, availableMappings, cancellationToken);
            if (fallbackMapping?.ApiKey != null)
            {
                _logger.LogInformation("故障转移成功: 从 {FailedApiKeyId} 转移到 {FallbackApiKeyId} (GroupId={GroupId})", 
                    failedApiKeyId, fallbackMapping.ApiKeyId, groupId);
            }

            return fallbackMapping?.ApiKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "执行故障转移时发生错误: FailedApiKeyId={FailedApiKeyId}, GroupId={GroupId}", 
                failedApiKeyId, groupId);
            return null;
        }
    }

    #endregion

    #region 私有辅助方法

    /// <summary>
    /// 获取分组中可用的映射
    /// </summary>
    private async Task<List<ApiKeyGroupMapping>> GetAvailableMappingsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        var mappings = await GetGroupMappingsAsync(groupId, cancellationToken);
        return mappings.Where(x => x.IsAvailable()).ToList();
    }

    /// <summary>
    /// 轮询选择
    /// </summary>
    private async Task<ApiKeyGroupMapping?> SelectRoundRobinAsync(ApiKeyGroup group, List<ApiKeyGroupMapping> mappings)
    {
        if (!mappings.Any()) return null;

        var currentIndex = _roundRobinIndexCache.GetOrAdd(group.Id, 0);
        var selectedMapping = mappings[currentIndex % mappings.Count];
        
        _roundRobinIndexCache[group.Id] = (currentIndex + 1) % mappings.Count;
        
        // 更新数据库中的轮询索引
        await _context.ApiKeyGroups
            .Where(x => x.Id == group.Id)
            .ExecuteUpdateAsync(x => x.SetProperty(g => g.CurrentRoundRobinIndex, _roundRobinIndexCache[group.Id]));

        return selectedMapping;
    }

    /// <summary>
    /// 加权选择
    /// </summary>
    private Task<ApiKeyGroupMapping?> SelectWeightedAsync(List<ApiKeyGroupMapping> mappings)
    {
        if (!mappings.Any()) return Task.FromResult<ApiKeyGroupMapping?>(null);

        var weightedMappings = mappings.Select(x => new
        {
            Mapping = x,
            Weight = x.GetWeightScore()
        }).ToList();

        var totalWeight = weightedMappings.Sum(x => x.Weight);
        if (totalWeight <= 0) return Task.FromResult(mappings.First());

        var random = new Random().NextDouble() * totalWeight;
        var currentWeight = 0.0;

        foreach (var item in weightedMappings)
        {
            currentWeight += item.Weight;
            if (random <= currentWeight)
            {
                return Task.FromResult<ApiKeyGroupMapping?>(item.Mapping);
            }
        }

        return Task.FromResult<ApiKeyGroupMapping?>(mappings.First());
    }

    /// <summary>
    /// 最少连接选择
    /// </summary>
    private Task<ApiKeyGroupMapping?> SelectLeastConnectionsAsync(List<ApiKeyGroupMapping> mappings)
    {
        if (!mappings.Any()) return Task.FromResult<ApiKeyGroupMapping?>(null);

        var selected = mappings.OrderBy(x => x.CurrentConnections)
                              .ThenByDescending(x => x.GetWeightScore())
                              .First();
        
        return Task.FromResult<ApiKeyGroupMapping?>(selected);
    }

    /// <summary>
    /// 检查API Key是否健康
    /// </summary>
    private bool IsApiKeyHealthy(ApiKey apiKey, ApiKeyGroupMapping mapping)
    {
        // 检查API Key本身是否有效
        if (!apiKey.IsValid()) return false;

        // 检查映射是否被临时禁用
        if (mapping.DisabledUntil.HasValue && mapping.DisabledUntil.Value > DateTime.UtcNow)
            return false;

        // 检查连续失败次数
        if (mapping.ConsecutiveFailures >= 5)
            return false;

        // 检查成功率
        if (mapping.TotalUsageCount > 10 && mapping.GetSuccessRate() < 0.5)
            return false;

        return true;
    }

    #endregion

    #region 兼容性方法实现

    /// <summary>
    /// 从分组中选择API Key（兼容方法）
    /// </summary>
    public async Task<ApiKey?> SelectApiKeyFromGroupAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        return await SelectBestApiKeyFromGroupAsync(groupId, cancellationToken);
    }

    /// <summary>
    /// 记录成功请求（兼容方法）
    /// </summary>
    public async Task<bool> RecordSuccessAsync(
        Guid apiKeyId,
        Guid groupId,
        decimal cost = 0,
        double responseTimeMs = 0,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.ApiKeyId == apiKeyId && x.GroupId == groupId, cancellationToken);
                
            if (mapping == null) return false;
            
            return await RecordApiKeyUsageAsync(mapping.Id, true, cost, responseTimeMs, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "记录成功请求时发生错误: ApiKeyId={ApiKeyId}, GroupId={GroupId}", apiKeyId, groupId);
            return false;
        }
    }

    /// <summary>
    /// 记录失败请求（兼容方法）
    /// </summary>
    public async Task<bool> RecordFailureAsync(
        Guid apiKeyId,
        Guid groupId,
        string? errorMessage = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await _context.ApiKeyGroupMappings
                .FirstOrDefaultAsync(x => x.ApiKeyId == apiKeyId && x.GroupId == groupId, cancellationToken);
                
            if (mapping == null) return false;
            
            var success = await RecordApiKeyUsageAsync(mapping.Id, false, 0, 0, cancellationToken);
            
            // 处理API Key故障
            await HandleApiKeyFailureAsync(apiKeyId, groupId, errorMessage, cancellationToken);
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "记录失败请求时发生错误: ApiKeyId={ApiKeyId}, GroupId={GroupId}", apiKeyId, groupId);
            return false;
        }
    }

    #endregion
}
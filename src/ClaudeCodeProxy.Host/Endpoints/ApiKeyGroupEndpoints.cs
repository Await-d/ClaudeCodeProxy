using ClaudeCodeProxy.Abstraction.Models.ApiKeyGroup;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using System.Linq;

namespace ClaudeCodeProxy.Host.Endpoints;

/// <summary>
/// API Key分组管理相关端点
/// </summary>
public static class ApiKeyGroupEndpoints
{
    /// <summary>
    /// 配置API Key分组相关路由
    /// </summary>
    public static void MapApiKeyGroupEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/apikey-groups")
            .WithTags("ApiKeyGroup")
            .WithOpenApi();

        #region 核心分组管理端点

        // 获取分组列表（支持分页和过滤）
        group.MapPost("/", GetGroups)
            .WithName("GetApiKeyGroups")
            .WithSummary("获取API Key分组列表")
            .WithDescription("获取分页的API Key分组列表，支持按类型、状态、标签等过滤")
            .Produces<ApiKeyGroupListResponse>();

        // 创建新分组
        group.MapPost("/create", CreateGroup)
            .WithName("CreateApiKeyGroup")
            .WithSummary("创建新的API Key分组")
            .WithDescription("创建一个新的API Key分组，可指定负载均衡策略和故障转移策略")
            .Produces<ApiKeyGroupResponse>(201)
            .Produces<string>(400);

        // 根据ID获取分组详情
        group.MapGet("/{id:guid}", GetGroupById)
            .WithName("GetApiKeyGroupById")
            .WithSummary("根据ID获取API Key分组详情")
            .WithDescription("获取指定分组的详细信息，包括关联的API Key和使用统计")
            .Produces<ApiKeyGroupResponse>()
            .Produces<string>(404);

        // 更新分组
        group.MapPut("/{id:guid}", UpdateGroup)
            .WithName("UpdateApiKeyGroup")
            .WithSummary("更新API Key分组")
            .WithDescription("更新分组的配置信息，包括名称、策略、限制等")
            .Produces<ApiKeyGroupResponse>()
            .Produces<string>(404)
            .Produces<string>(400);

        // 删除分组
        group.MapDelete("/{id:guid}", DeleteGroup)
            .WithName("DeleteApiKeyGroup")
            .WithSummary("删除API Key分组")
            .WithDescription("删除指定的分组及其所有关联的API Key映射")
            .Produces(204)
            .Produces<string>(404);

        // 启用/禁用分组
        group.MapPost("/{id:guid}/enable", ToggleGroupEnabled)
            .WithName("ToggleApiKeyGroupEnabled")
            .WithSummary("启用/禁用API Key分组")
            .WithDescription("切换分组的启用状态")
            .Produces<string>(200)
            .Produces<string>(404);

        #endregion

        #region API Key映射管理端点

        // 添加API Key到分组
        group.MapPost("/{groupId:guid}/apikeys", AddApiKeyToGroup)
            .WithName("AddApiKeyToGroup")
            .WithSummary("添加API Key到分组")
            .WithDescription("将指定的API Key添加到分组中，可设置权重和优先级")
            .Produces<ApiKeyGroupMappingResponse>(201)
            .Produces<string>(400);

        // 从分组中移除API Key
        group.MapDelete("/{groupId:guid}/apikeys/{apiKeyId:guid}", RemoveApiKeyFromGroup)
            .WithName("RemoveApiKeyFromGroup")
            .WithSummary("从分组中移除API Key")
            .WithDescription("将指定的API Key从分组中移除")
            .Produces(204)
            .Produces<string>(404);

        // 更新API Key在分组中的配置
        group.MapPut("/{groupId:guid}/apikeys/{apiKeyId:guid}", UpdateApiKeyMapping)
            .WithName("UpdateApiKeyMapping")
            .WithSummary("更新API Key在分组中的配置")
            .WithDescription("更新API Key在分组中的权重、顺序等配置")
            .Produces<ApiKeyGroupMappingResponse>()
            .Produces<string>(404)
            .Produces<string>(400);

        // 获取分组中的API Key列表
        group.MapGet("/{groupId:guid}/apikeys", GetApiKeysInGroup)
            .WithName("GetApiKeysInGroup")
            .WithSummary("获取分组中的API Key列表")
            .WithDescription("获取指定分组中所有API Key的映射信息")
            .Produces<List<ApiKeyGroupMappingResponse>>()
            .Produces<string>(404);

        #endregion

        #region 健康监控端点

        // 触发分组健康检查
        group.MapPost("/{id:guid}/health-check", TriggerHealthCheck)
            .WithName("TriggerApiKeyGroupHealthCheck")
            .WithSummary("触发分组健康检查")
            .WithDescription("手动触发指定分组的健康检查")
            .Produces<string>(200)
            .Produces<string>(404);

        // 获取分组健康状态
        group.MapGet("/{id:guid}/health", GetGroupHealth)
            .WithName("GetApiKeyGroupHealth")
            .WithSummary("获取分组健康状态")
            .WithDescription("获取分组及其包含的API Key的健康状态信息")
            .Produces<ApiKeyGroupHealthResponse>()
            .Produces<string>(404);

        // 获取分组统计信息
        group.MapGet("/{id:guid}/statistics", GetGroupStatistics)
            .WithName("GetApiKeyGroupStatistics")
            .WithSummary("获取分组统计信息")
            .WithDescription("获取分组的详细使用统计和性能数据")
            .Produces<ApiKeyGroupStatisticsResponse>()
            .Produces<string>(404);

        #endregion

        #region 系统概览端点

        // 获取系统概览
        group.MapGet("/overview", GetSystemOverview)
            .WithName("GetApiKeyGroupSystemOverview")
            .WithSummary("获取系统概览")
            .WithDescription("获取所有分组的概览信息和系统级统计")
            .Produces<ApiKeyGroupOverviewResponse>();

        // 批量健康检查
        group.MapPost("/batch-health-check", BatchHealthCheck)
            .WithName("BatchApiKeyGroupHealthCheck")
            .WithSummary("批量健康检查")
            .WithDescription("对所有启用的分组执行健康检查")
            .Produces<Dictionary<Guid, bool>>();

        #endregion
    }

    #region 核心分组管理端点实现

    /// <summary>
    /// 获取分组列表（支持分页和过滤）
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupListResponse>, BadRequest<string>>> GetGroups(
        GetApiKeyGroupsRequest? request,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            request ??= new GetApiKeyGroupsRequest();
            
            var allGroups = await apiKeyGroupService.GetAllGroupsAsync(cancellationToken);
            
            // 应用过滤
            var filteredGroups = allGroups.AsQueryable();
            
            if (!string.IsNullOrEmpty(request.GroupType))
            {
                filteredGroups = filteredGroups.Where(g => g.GroupType == request.GroupType);
            }
            
            if (request.IsEnabled.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.IsEnabled == request.IsEnabled.Value);
            }
            
            if (!string.IsNullOrEmpty(request.HealthStatus))
            {
                filteredGroups = filteredGroups.Where(g => g.HealthStatus == request.HealthStatus);
            }
            
            if (!string.IsNullOrEmpty(request.LoadBalanceStrategy))
            {
                filteredGroups = filteredGroups.Where(g => g.LoadBalanceStrategy == request.LoadBalanceStrategy);
            }
            
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                filteredGroups = filteredGroups.Where(g => 
                    g.Name.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                    (g.Description != null && g.Description.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase)));
            }
            
            if (request.Tags != null && request.Tags.Any())
            {
                filteredGroups = filteredGroups.Where(g => 
                    g.Tags != null && request.Tags.Any(tag => g.Tags.Contains(tag)));
            }
            
            if (request.MinApiKeyCount.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.ApiKeyCount >= request.MinApiKeyCount.Value);
            }
            
            if (request.MaxApiKeyCount.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.ApiKeyCount <= request.MaxApiKeyCount.Value);
            }
            
            if (request.PriorityMin.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.Priority >= request.PriorityMin.Value);
            }
            
            if (request.PriorityMax.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.Priority <= request.PriorityMax.Value);
            }
            
            if (request.CreatedAfter.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.CreatedAt >= request.CreatedAfter.Value);
            }
            
            if (request.CreatedBefore.HasValue)
            {
                filteredGroups = filteredGroups.Where(g => g.CreatedAt <= request.CreatedBefore.Value);
            }
            
            var totalCount = filteredGroups.Count();
            
            // 应用排序
            filteredGroups = request.SortBy?.ToLowerInvariant() switch
            {
                "name" => request.SortDirection == "desc" 
                    ? filteredGroups.OrderByDescending(g => g.Name)
                    : filteredGroups.OrderBy(g => g.Name),
                "priority" => request.SortDirection == "desc"
                    ? filteredGroups.OrderByDescending(g => g.Priority)
                    : filteredGroups.OrderBy(g => g.Priority),
                "createdat" => request.SortDirection == "desc"
                    ? filteredGroups.OrderByDescending(g => g.CreatedAt)
                    : filteredGroups.OrderBy(g => g.CreatedAt),
                "apikeycount" => request.SortDirection == "desc"
                    ? filteredGroups.OrderByDescending(g => g.ApiKeyCount)
                    : filteredGroups.OrderBy(g => g.ApiKeyCount),
                _ => filteredGroups.OrderBy(g => g.Priority).ThenBy(g => g.Name)
            };
            
            // 应用分页
            var pagedGroups = filteredGroups
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();
            
            var response = new ApiKeyGroupListResponse
            {
                Data = pagedGroups.Select(g => MapToResponse(g, request.IncludeStatistics, request.IncludeApiKeys)).ToList(),
                Total = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
            };
            
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取分组列表失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 创建新分组
    /// </summary>
    private static async Task<Results<Created<ApiKeyGroupResponse>, BadRequest<string>>> CreateGroup(
        CreateApiKeyGroupRequest request,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await apiKeyGroupService.CreateGroupAsync(
                name: request.Name,
                description: request.Description,
                groupType: request.GroupType,
                priority: request.Priority,
                loadBalanceStrategy: "round_robin", // 默认策略
                failoverStrategy: "failover", // 默认策略
                cancellationToken: cancellationToken);

            // 更新额外属性
            if (request.GroupCostLimit.HasValue || request.GroupRequestLimit.HasValue || request.Tags != null)
            {
                group = await apiKeyGroupService.UpdateGroupAsync(
                    groupId: group.Id,
                    tags: request.Tags,
                    groupCostLimit: request.GroupCostLimit,
                    groupRequestLimit: request.GroupRequestLimit,
                    cancellationToken: cancellationToken);
            }

            var response = MapToResponse(group!);
            return TypedResults.Created($"/api/apikey-groups/{group!.Id}", response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"创建分组失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 根据ID获取分组详情
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupResponse>, NotFound<string>>> GetGroupById(
        Guid id,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await apiKeyGroupService.GetGroupByIdAsync(id, cancellationToken);
            if (group == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的分组");
            }
            
            var response = MapToResponse(group, true, false); // Include statistics for detail view
            
            // 获取分组中的API Key信息
            var mappings = await apiKeyGroupService.GetGroupMappingsAsync(id, cancellationToken);
            response.ApiKeys = mappings.Select(MapToMappingDto).ToList();
            
            // 获取使用率信息
            response.UsageInfo = MapToUsageInfoDto(group.GetUsageInfo());
            
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取分组详情失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 更新分组
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupResponse>, NotFound<string>, BadRequest<string>>> UpdateGroup(
        Guid id,
        UpdateApiKeyGroupRequest request,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await apiKeyGroupService.UpdateGroupAsync(
                groupId: id,
                name: request.Name,
                description: request.Description,
                priority: request.Priority,
                tags: request.Tags,
                groupCostLimit: request.GroupCostLimit,
                groupRequestLimit: request.GroupRequestLimit,
                cancellationToken: cancellationToken);

            if (group == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的分组");
            }

            var response = MapToResponse(group, false, false);
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"更新分组失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 删除分组
    /// </summary>
    private static async Task<Results<NoContent, NotFound<string>>> DeleteGroup(
        Guid id,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await apiKeyGroupService.DeleteGroupAsync(id, cancellationToken);
            if (!success)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的分组");
            }

            return TypedResults.NoContent();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"删除分组失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 启用/禁用分组
    /// </summary>
    private static async Task<Results<Ok<string>, NotFound<string>>> ToggleGroupEnabled(
        Guid id,
        bool isEnabled,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await apiKeyGroupService.ToggleGroupEnabledAsync(id, isEnabled, cancellationToken);
            if (!success)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的分组");
            }

            var action = isEnabled ? "启用" : "禁用";
            return TypedResults.Ok($"成功{action}分组");
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"切换分组状态失败: {ex.Message}");
        }
    }

    #endregion

    #region API Key映射管理端点实现

    /// <summary>
    /// 添加API Key到分组
    /// </summary>
    private static async Task<Results<Created<ApiKeyGroupMappingResponse>, BadRequest<string>>> AddApiKeyToGroup(
        Guid groupId,
        AddApiKeyToGroupRequest request,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var mapping = await apiKeyGroupService.AddApiKeyToGroupAsync(
                groupId: groupId,
                apiKeyId: request.ApiKeyId,
                weight: request.Weight,
                order: request.Order,
                isPrimary: request.IsPrimary,
                cancellationToken: cancellationToken);

            var response = MapToMappingResponse(mapping);
            return TypedResults.Created($"/api/apikey-groups/{groupId}/apikeys/{request.ApiKeyId}", response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"添加API Key到分组失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 从分组中移除API Key
    /// </summary>
    private static async Task<Results<NoContent, NotFound<string>>> RemoveApiKeyFromGroup(
        Guid groupId,
        Guid apiKeyId,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var success = await apiKeyGroupService.RemoveApiKeyFromGroupAsync(groupId, apiKeyId, cancellationToken);
            if (!success)
            {
                return TypedResults.NotFound($"未找到指定的API Key映射");
            }

            return TypedResults.NoContent();
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"移除API Key失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 更新API Key在分组中的配置
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupMappingResponse>, NotFound<string>, BadRequest<string>>> UpdateApiKeyMapping(
        Guid groupId,
        Guid apiKeyId,
        UpdateApiKeyMappingRequest request,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 首先获取映射
            var mappings = await apiKeyGroupService.GetGroupMappingsAsync(groupId, cancellationToken);
            var mapping = mappings.FirstOrDefault(m => m.ApiKeyId == apiKeyId);
            
            if (mapping == null)
            {
                return TypedResults.NotFound($"未找到指定的API Key映射");
            }

            var updatedMapping = await apiKeyGroupService.UpdateMappingAsync(
                mappingId: mapping.Id,
                weight: request.Weight,
                order: request.Order,
                isPrimary: request.IsPrimary,
                cancellationToken: cancellationToken);

            if (updatedMapping == null)
            {
                return TypedResults.NotFound($"更新映射失败");
            }

            var response = MapToMappingResponse(updatedMapping);
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"更新API Key映射失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取分组中的API Key列表
    /// </summary>
    private static async Task<Results<Ok<List<ApiKeyGroupMappingResponse>>, NotFound<string>>> GetApiKeysInGroup(
        Guid groupId,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await apiKeyGroupService.GetGroupByIdAsync(groupId, cancellationToken);
            if (group == null)
            {
                return TypedResults.NotFound($"未找到ID为 {groupId} 的分组");
            }

            var mappings = await apiKeyGroupService.GetGroupMappingsAsync(groupId, cancellationToken);
            var response = mappings.Select(MapToMappingResponse).ToList();
            
            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取分组中的API Key列表失败: {ex.Message}");
        }
    }

    #endregion

    #region 健康监控端点实现

    /// <summary>
    /// 触发分组健康检查
    /// </summary>
    private static async Task<Results<Ok<string>, NotFound<string>>> TriggerHealthCheck(
        Guid id,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var isHealthy = await apiKeyGroupService.CheckGroupHealthAsync(id, cancellationToken);
            var status = isHealthy ? "健康" : "不健康";
            
            return TypedResults.Ok($"健康检查完成，分组状态：{status}");
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"执行健康检查失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取分组健康状态
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupHealthResponse>, NotFound<string>>> GetGroupHealth(
        Guid id,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await apiKeyGroupService.GetGroupByIdAsync(id, cancellationToken);
            if (group == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的分组");
            }

            var apiKeyHealthResults = await apiKeyGroupService.CheckApiKeysHealthInGroupAsync(id, cancellationToken);
            
            var response = new ApiKeyGroupHealthResponse
            {
                GroupId = group.Id,
                GroupName = group.Name,
                OverallHealthStatus = group.HealthStatus,
                IsEnabled = group.IsEnabled,
                LastHealthCheckAt = group.LastHealthCheckAt,
                TotalApiKeys = group.ApiKeyCount,
                HealthyApiKeys = apiKeyHealthResults.Count(x => x.Value),
                UnhealthyApiKeys = apiKeyHealthResults.Count(x => !x.Value),
                ApiKeyHealthDetails = apiKeyHealthResults.ToDictionary(
                    kvp => kvp.Key, 
                    kvp => (object)new { IsHealthy = kvp.Value, Status = kvp.Value ? "healthy" : "unhealthy" })
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取分组健康状态失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 获取分组统计信息
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupStatisticsResponse>, NotFound<string>>> GetGroupStatistics(
        Guid id,
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var group = await apiKeyGroupService.GetGroupByIdAsync(id, cancellationToken);
            if (group == null)
            {
                return TypedResults.NotFound($"未找到ID为 {id} 的分组");
            }

            var statistics = await apiKeyGroupService.GetGroupStatisticsAsync(id, cancellationToken);
            
            var response = new ApiKeyGroupStatisticsResponse
            {
                GroupId = group.Id,
                GroupName = group.Name,
                TimeRange = new TimeRangeDto
                {
                    StartTime = statistics?.StatisticsStartTime ?? group.CreatedAt,
                    EndTime = DateTime.UtcNow,
                    Description = "统计周期"
                },
                RequestStats = new RequestStatisticsDto
                {
                    TotalRequests = statistics?.TotalRequests ?? 0,
                    SuccessfulRequests = statistics?.SuccessfulRequests ?? 0,
                    FailedRequests = statistics?.FailedRequests ?? 0,
                    SuccessRate = statistics != null && statistics.TotalRequests > 0 
                        ? (double)statistics.SuccessfulRequests / statistics.TotalRequests * 100 
                        : 0
                }
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.NotFound($"获取分组统计信息失败: {ex.Message}");
        }
    }

    #endregion

    #region 系统概览端点实现

    /// <summary>
    /// 获取系统概览
    /// </summary>
    private static async Task<Results<Ok<ApiKeyGroupOverviewResponse>, BadRequest<string>>> GetSystemOverview(
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var groupsOverview = await apiKeyGroupService.GetGroupsOverviewAsync(cancellationToken);
            
            var response = new ApiKeyGroupOverviewResponse
            {
                Summary = new ApiKeyGroupSummaryDto
                {
                    TotalGroups = groupsOverview.Count,
                    EnabledGroups = groupsOverview.Count(g => g.IsEnabled),
                    HealthyGroups = groupsOverview.Count(g => g.HealthStatus == "healthy"),
                    TotalApiKeys = groupsOverview.Sum(g => g.ApiKeyCount),
                    AverageKeysPerGroup = groupsOverview.Count > 0 
                        ? (double)groupsOverview.Sum(g => g.ApiKeyCount) / groupsOverview.Count 
                        : 0,
                    TotalRequests = groupsOverview.Sum(g => g.Usage?.TotalRequests ?? 0)
                },
                Groups = groupsOverview.Select(MapToOverviewResponse).ToList(),
                SystemHealth = new
                {
                    OverallStatus = DetermineOverallSystemHealth(groupsOverview),
                    ActiveGroups = groupsOverview.Count(g => g.IsEnabled && g.HealthStatus == "healthy"),
                    LastUpdate = DateTime.UtcNow
                }
            };

            return TypedResults.Ok(response);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"获取系统概览失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 批量健康检查
    /// </summary>
    private static async Task<Results<Ok<Dictionary<Guid, bool>>, BadRequest<string>>> BatchHealthCheck(
        IApiKeyGroupService apiKeyGroupService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var allGroups = await apiKeyGroupService.GetAllGroupsAsync(cancellationToken);
            var enabledGroups = allGroups.Where(g => g.IsEnabled).ToList();
            
            var healthResults = new Dictionary<Guid, bool>();
            
            foreach (var group in enabledGroups)
            {
                try
                {
                    var isHealthy = await apiKeyGroupService.CheckGroupHealthAsync(group.Id, cancellationToken);
                    healthResults[group.Id] = isHealthy;
                }
                catch
                {
                    healthResults[group.Id] = false;
                }
            }

            return TypedResults.Ok(healthResults);
        }
        catch (Exception ex)
        {
            return TypedResults.BadRequest($"批量健康检查失败: {ex.Message}");
        }
    }

    #endregion

    #region 辅助方法

    /// <summary>
    /// 映射到分组响应模型
    /// </summary>
    private static ApiKeyGroupResponse MapToResponse(ApiKeyGroup group, bool includeStatistics = false, bool includeApiKeys = false)
    {
        var response = new ApiKeyGroupResponse
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            GroupType = group.GroupType,
            Tags = group.Tags,
            Priority = group.Priority,
            IsEnabled = group.IsEnabled,
            GroupCostLimit = group.GroupCostLimit,
            GroupRequestLimit = group.GroupRequestLimit,
            LoadBalanceStrategy = group.LoadBalanceStrategy,
            FailoverStrategy = group.FailoverStrategy,
            HealthCheckInterval = group.HealthCheckInterval,
            ApiKeyCount = group.ApiKeyCount,
            HealthyApiKeyCount = group.ApiKeyCount, // 简化处理，实际应该查询健康的数量
            LastHealthCheckAt = group.LastHealthCheckAt,
            HealthStatus = group.HealthStatus,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.ModifiedAt ?? group.CreatedAt,
            CanAcceptRequest = group.CanAcceptRequest()
        };

        if (includeStatistics && group.Statistics != null)
        {
            response.Statistics = MapToStatisticsDto(group.Statistics);
        }

        return response;
    }

    /// <summary>
    /// 映射到映射响应模型
    /// </summary>
    private static ApiKeyGroupMappingResponse MapToMappingResponse(ApiKeyGroupMapping mapping)
    {
        return new ApiKeyGroupMappingResponse
        {
            Id = mapping.Id,
            ApiKeyId = mapping.ApiKeyId,
            ApiKeyName = mapping.ApiKey?.Name ?? string.Empty,
            GroupId = mapping.GroupId,
            GroupName = mapping.Group?.Name ?? string.Empty,
            Weight = mapping.Weight,
            IsPrimary = mapping.IsPrimary,
            Order = mapping.Order,
            IsEnabled = mapping.IsEnabled,
            CurrentConnections = mapping.CurrentConnections,
            LastUsedAt = mapping.LastUsedAt,
            TotalUsageCount = mapping.TotalUsageCount,
            SuccessfulRequests = mapping.SuccessfulRequests,
            FailedRequests = mapping.FailedRequests
        };
    }

    /// <summary>
    /// 映射到映射DTO
    /// </summary>
    private static ApiKeyGroupMappingDto MapToMappingDto(ApiKeyGroupMapping mapping)
    {
        return new ApiKeyGroupMappingDto
        {
            Id = mapping.Id,
            ApiKeyId = mapping.ApiKeyId,
            ApiKeyName = mapping.ApiKey?.Name ?? string.Empty,
            GroupId = mapping.GroupId,
            Weight = mapping.Weight,
            IsPrimary = mapping.IsPrimary,
            Order = mapping.Order,
            IsEnabled = mapping.IsEnabled,
            CurrentConnections = mapping.CurrentConnections,
            LastUsedAt = mapping.LastUsedAt,
            TotalUsageCount = mapping.TotalUsageCount,
            SuccessfulRequests = mapping.SuccessfulRequests,
            FailedRequests = mapping.FailedRequests
        };
    }

    /// <summary>
    /// 映射到统计DTO
    /// </summary>
    private static GroupStatisticsDto? MapToStatisticsDto(GroupStatistics? statistics)
    {
        if (statistics == null) return null;

        return new GroupStatisticsDto
        {
            TotalRequests = statistics.TotalRequests,
            SuccessfulRequests = statistics.SuccessfulRequests,
            FailedRequests = statistics.FailedRequests,
            TotalCost = statistics.TotalCost,
            AverageResponseTime = statistics.AverageResponseTime,
            LastUsedAt = statistics.LastUsedAt,
            StatisticsStartTime = statistics.StatisticsStartTime,
            PeakConcurrentConnections = statistics.PeakConcurrentConnections,
            CurrentConcurrentConnections = statistics.CurrentConcurrentConnections
        };
    }

    /// <summary>
    /// 映射到使用率信息DTO
    /// </summary>
    private static GroupUsageInfoDto MapToUsageInfoDto(GroupUsageInfo usageInfo)
    {
        return new GroupUsageInfoDto
        {
            RequestUsage = usageInfo.RequestUsage,
            CostUsage = usageInfo.CostUsage,
            TotalRequests = usageInfo.TotalRequests,
            TotalCost = usageInfo.TotalCost,
            SuccessRate = usageInfo.SuccessRate,
            AverageResponseTime = usageInfo.AverageResponseTime,
            HealthyKeyCount = usageInfo.HealthyKeyCount,
            LastUsedAt = usageInfo.LastUsedAt
        };
    }

    /// <summary>
    /// 映射到概览响应模型
    /// </summary>
    private static ApiKeyGroupResponse MapToOverviewResponse(GroupOverviewInfo overview)
    {
        return new ApiKeyGroupResponse
        {
            Id = overview.Id,
            Name = overview.Name,
            Description = overview.Description,
            GroupType = overview.GroupType,
            Priority = overview.Priority,
            IsEnabled = overview.IsEnabled,
            HealthStatus = overview.HealthStatus,
            ApiKeyCount = overview.ApiKeyCount,
            HealthyApiKeyCount = overview.HealthyApiKeyCount,
            LoadBalanceStrategy = overview.LoadBalanceStrategy,
            FailoverStrategy = "failover", // Default value since not in overview
            HealthCheckInterval = 30, // Default value
            CreatedAt = overview.CreatedAt,
            UpdatedAt = overview.LastUsedAt ?? overview.CreatedAt,
            LastHealthCheckAt = overview.LastHealthCheckAt,
            UsageInfo = overview.Usage != null ? MapToUsageInfoDto(overview.Usage) : null,
            CanAcceptRequest = overview.IsEnabled && overview.HealthStatus == "healthy"
        };
    }

    /// <summary>
    /// 确定系统整体健康状态
    /// </summary>
    private static string DetermineOverallSystemHealth(List<GroupOverviewInfo> groups)
    {
        if (!groups.Any()) return "unknown";
        
        var enabledGroups = groups.Where(g => g.IsEnabled).ToList();
        if (!enabledGroups.Any()) return "disabled";
        
        var healthyCount = enabledGroups.Count(g => g.HealthStatus == "healthy");
        var healthyRatio = (double)healthyCount / enabledGroups.Count;
        
        return healthyRatio switch
        {
            >= 0.8 => "healthy",
            >= 0.5 => "degraded",
            > 0 => "unhealthy",
            _ => "critical"
        };
    }

    #endregion
}
using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// API Key 账号池权限管理服务实现
/// 提供权限管理、账户过滤、智能选择和多种负载均衡策略
/// </summary>
public class ApiKeyAccountPermissionService : IApiKeyAccountPermissionService
{
    private readonly IContext _context;
    private readonly ILogger<ApiKeyAccountPermissionService> _logger;
    private readonly AccountsService _accountsService;
    
    // 缓存和计数器用于负载均衡
    private readonly ConcurrentDictionary<string, int> _roundRobinCounters = new();
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, AccountMetrics>> _accountMetrics = new();
    
    // 会话一致性缓存
    private readonly ConcurrentDictionary<string, string> _sessionAccountMappings = new();

    public ApiKeyAccountPermissionService(
        IContext context, 
        ILogger<ApiKeyAccountPermissionService> logger,
        AccountsService accountsService)
    {
        _context = context;
        _logger = logger;
        _accountsService = accountsService;
    }

    /// <summary>
    /// 为API Key添加账号池权限
    /// </summary>
    public async Task<ApiKeyAccountPoolPermission> AddPermissionAsync(
        Guid apiKeyId,
        string accountPoolGroup,
        string[] allowedPlatforms,
        string[]? allowedAccountIds = null,
        string selectionStrategy = "priority",
        int priority = 50,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("为API Key {ApiKeyId} 添加账号池权限: {AccountPoolGroup}", 
                apiKeyId, accountPoolGroup);

            // 验证输入参数
            await ValidatePermissionParametersAsync(apiKeyId, accountPoolGroup, allowedPlatforms, cancellationToken);

            // 检查是否已存在相同的权限规则
            var existingPermission = await _context.ApiKeyAccountPoolPermissions
                .FirstOrDefaultAsync(p => p.ApiKeyId == apiKeyId && 
                                        p.AccountPoolGroup == accountPoolGroup, 
                    cancellationToken);

            if (existingPermission != null)
            {
                throw new InvalidOperationException(
                    $"API Key {apiKeyId} 已存在对账号池 '{accountPoolGroup}' 的权限规则");
            }

            var permission = new ApiKeyAccountPoolPermission
            {
                Id = Guid.NewGuid(),
                ApiKeyId = apiKeyId,
                AccountPoolGroup = accountPoolGroup,
                AllowedPlatforms = allowedPlatforms,
                AllowedAccountIds = allowedAccountIds,
                SelectionStrategy = selectionStrategy,
                Priority = priority,
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ApiKeyAccountPoolPermissions.Add(permission);
            await _context.SaveAsync(cancellationToken);

            _logger.LogInformation("成功添加API Key账号池权限: {ApiKeyId} -> {AccountPoolGroup}", 
                apiKeyId, accountPoolGroup);

            return permission;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "添加API Key账号池权限时发生错误: {ApiKeyId}, {AccountPoolGroup}", 
                apiKeyId, accountPoolGroup);
            throw;
        }
    }

    /// <summary>
    /// 移除API Key的账号池权限
    /// </summary>
    public async Task<bool> RemovePermissionAsync(
        Guid apiKeyId,
        string accountPoolGroup,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("移除API Key {ApiKeyId} 对账号池 {AccountPoolGroup} 的权限", 
                apiKeyId, accountPoolGroup);

            var permission = await _context.ApiKeyAccountPoolPermissions
                .FirstOrDefaultAsync(p => p.ApiKeyId == apiKeyId && 
                                        p.AccountPoolGroup == accountPoolGroup, 
                    cancellationToken);

            if (permission == null)
            {
                _logger.LogWarning("未找到要移除的权限规则: {ApiKeyId} -> {AccountPoolGroup}", 
                    apiKeyId, accountPoolGroup);
                return false;
            }

            _context.ApiKeyAccountPoolPermissions.Remove(permission);
            await _context.SaveAsync(cancellationToken);

            // 清除相关缓存
            ClearAccountCacheForApiKey(apiKeyId);

            _logger.LogInformation("成功移除API Key账号池权限: {ApiKeyId} -> {AccountPoolGroup}", 
                apiKeyId, accountPoolGroup);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "移除API Key账号池权限时发生错误: {ApiKeyId}, {AccountPoolGroup}", 
                apiKeyId, accountPoolGroup);
            throw;
        }
    }

    /// <summary>
    /// 获取API Key的所有账号池权限
    /// </summary>
    public async Task<List<ApiKeyAccountPoolPermission>> GetPermissionsAsync(
        Guid apiKeyId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.ApiKeyAccountPoolPermissions
                .AsNoTracking()
                .Where(p => p.ApiKeyId == apiKeyId)
                .OrderBy(p => p.Priority)
                .ThenBy(p => p.AccountPoolGroup)
                .ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取API Key权限列表时发生错误: {ApiKeyId}", apiKeyId);
            throw;
        }
    }

    /// <summary>
    /// 根据权限获取API Key可访问的账户列表
    /// </summary>
    public async Task<List<Accounts>> GetAllowedAccountsAsync(
        Guid apiKeyId,
        string platform,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("获取API Key {ApiKeyId} 在平台 {Platform} 的允许账户", apiKeyId, platform);

            // 获取API Key的生效权限，按优先级排序
            var permissions = await GetEffectivePermissionsAsync(apiKeyId, platform, cancellationToken);

            if (!permissions.Any())
            {
                _logger.LogWarning("API Key {ApiKeyId} 没有针对平台 {Platform} 的有效权限", apiKeyId, platform);
                return [];
            }

            var allowedAccounts = new List<Accounts>();
            var processedGroups = new HashSet<string>();

            // 按优先级处理每个权限规则
            foreach (var permission in permissions)
            {
                // 避免重复处理相同的分组
                if (processedGroups.Contains(permission.AccountPoolGroup))
                    continue;

                processedGroups.Add(permission.AccountPoolGroup);

                // 获取该分组下的所有可用账户
                var groupAccounts = await GetAccountsByPoolGroupAsync(
                    permission.AccountPoolGroup, platform, cancellationToken);

                // 如果权限指定了具体的账户ID，则过滤
                if (permission.AllowedAccountIds?.Length > 0)
                {
                    groupAccounts = groupAccounts
                        .Where(a => permission.AllowedAccountIds.Contains(a.Id, StringComparer.OrdinalIgnoreCase))
                        .ToList();
                }

                allowedAccounts.AddRange(groupAccounts);
            }

            // 去重并按账户优先级排序
            var distinctAccounts = allowedAccounts
                .GroupBy(a => a.Id)
                .Select(g => g.First())
                .OrderBy(a => a.Priority)
                .ThenByDescending(a => a.Weight)
                .ToList();

            _logger.LogDebug("API Key {ApiKeyId} 在平台 {Platform} 有 {Count} 个可用账户", 
                apiKeyId, platform, distinctAccounts.Count);

            return distinctAccounts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取允许访问的账户列表时发生错误: {ApiKeyId}, {Platform}", 
                apiKeyId, platform);
            throw;
        }
    }

    /// <summary>
    /// 从允许的账户中选择最佳账户（智能负载均衡）
    /// </summary>
    public async Task<Accounts?> SelectBestAccountAsync(
        Guid apiKeyId,
        string platform,
        string? sessionHash = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("为API Key {ApiKeyId} 选择最佳账户，平台: {Platform}, 会话: {SessionHash}", 
                apiKeyId, platform, sessionHash);

            // 1. 如果有会话哈希，尝试获取会话固定的账户
            if (!string.IsNullOrEmpty(sessionHash))
            {
                var sessionAccount = await GetSessionFixedAccountAsync(
                    apiKeyId, platform, sessionHash, cancellationToken);
                if (sessionAccount != null)
                {
                    _logger.LogDebug("使用会话固定账户: {AccountId} ({AccountName})", 
                        sessionAccount.Id, sessionAccount.Name);
                    return sessionAccount;
                }
            }

            // 2. 获取所有可用的账户
            var allowedAccounts = await GetAllowedAccountsAsync(apiKeyId, platform, cancellationToken);
            if (!allowedAccounts.Any())
            {
                _logger.LogWarning("API Key {ApiKeyId} 没有可用的账户权限", apiKeyId);
                return null;
            }

            // 3. 过滤出真正可用（未限流、状态正常）的账户
            var availableAccounts = new List<Accounts>();
            foreach (var account in allowedAccounts)
            {
                if (await _accountsService.IsAccountAvailableAsync(account, cancellationToken))
                {
                    availableAccounts.Add(account);
                }
            }

            if (!availableAccounts.Any())
            {
                _logger.LogWarning("API Key {ApiKeyId} 的所有允许账户都不可用", apiKeyId);
                return null;
            }

            // 4. 获取最高优先级权限的选择策略
            var topPriorityPermission = await GetTopPriorityPermissionAsync(apiKeyId, platform, cancellationToken);
            var strategy = topPriorityPermission?.SelectionStrategy ?? "priority";

            // 5. 根据策略选择账户
            var selectedAccount = await SelectAccountByStrategyAsync(
                apiKeyId, availableAccounts, strategy, sessionHash, cancellationToken);

            // 6. 如果有会话哈希且选择成功，建立会话映射
            if (selectedAccount != null && !string.IsNullOrEmpty(sessionHash))
            {
                SetSessionAccountMapping(apiKeyId, platform, sessionHash, selectedAccount.Id);
            }

            _logger.LogInformation("选择账户: {AccountId} ({AccountName}) 策略: {Strategy} for API Key {ApiKeyId}",
                selectedAccount?.Id, selectedAccount?.Name, strategy, apiKeyId);

            return selectedAccount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "选择最佳账户时发生错误: {ApiKeyId}, {Platform}", apiKeyId, platform);
            return null;
        }
    }

    /// <summary>
    /// 检查API Key是否有权限访问指定账户
    /// </summary>
    public async Task<bool> HasPermissionAsync(
        Guid apiKeyId,
        string accountId,
        string platform,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var allowedAccounts = await GetAllowedAccountsAsync(apiKeyId, platform, cancellationToken);
            var hasPermission = allowedAccounts.Any(a => string.Equals(a.Id, accountId, StringComparison.OrdinalIgnoreCase));
            
            _logger.LogDebug("权限检查结果: API Key {ApiKeyId} 访问账户 {AccountId}: {HasPermission}",
                apiKeyId, accountId, hasPermission);
                
            return hasPermission;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "检查账户访问权限时发生错误: {ApiKeyId}, {AccountId}, {Platform}", 
                apiKeyId, accountId, platform);
            return false;
        }
    }

    /// <summary>
    /// 批量更新API Key权限
    /// </summary>
    public async Task<bool> BatchUpdatePermissionsAsync(
        Guid apiKeyId,
        List<ApiKeyAccountPoolPermissionRequest> permissions,
        CancellationToken cancellationToken = default)
    {
        using var transaction = await ((DbContext)_context).Database.BeginTransactionAsync(cancellationToken);
        try
        {
            _logger.LogInformation("开始批量更新API Key {ApiKeyId} 的权限，共 {Count} 条", 
                apiKeyId, permissions.Count);

            // 验证API Key存在
            var apiKeyExists = await _context.ApiKeys.AnyAsync(k => k.Id == apiKeyId, cancellationToken);
            if (!apiKeyExists)
            {
                throw new ArgumentException($"API Key {apiKeyId} 不存在");
            }

            // 删除现有权限
            var existingPermissions = await _context.ApiKeyAccountPoolPermissions
                .Where(p => p.ApiKeyId == apiKeyId)
                .ToListAsync(cancellationToken);

            if (existingPermissions.Any())
            {
                _context.ApiKeyAccountPoolPermissions.RemoveRange(existingPermissions);
                _logger.LogDebug("删除了 {Count} 条现有权限", existingPermissions.Count);
            }

            // 添加新权限
            var newPermissions = new List<ApiKeyAccountPoolPermission>();
            foreach (var permissionRequest in permissions)
            {
                // 验证权限请求
                ValidatePermissionRequest(permissionRequest);

                var permission = new ApiKeyAccountPoolPermission
                {
                    Id = Guid.NewGuid(),
                    ApiKeyId = apiKeyId,
                    AccountPoolGroup = permissionRequest.AccountPoolGroup,
                    AllowedPlatforms = permissionRequest.AllowedPlatforms,
                    AllowedAccountIds = permissionRequest.AllowedAccountIds,
                    SelectionStrategy = permissionRequest.SelectionStrategy,
                    Priority = permissionRequest.Priority,
                    IsEnabled = permissionRequest.IsEnabled,
                    EffectiveFrom = permissionRequest.EffectiveFrom,
                    EffectiveTo = permissionRequest.EffectiveTo,
                    CreatedAt = DateTime.UtcNow
                };

                newPermissions.Add(permission);
            }

            if (newPermissions.Any())
            {
                await _context.ApiKeyAccountPoolPermissions.AddRangeAsync(newPermissions, cancellationToken);
                _logger.LogDebug("添加了 {Count} 条新权限", newPermissions.Count);
            }

            await _context.SaveAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // 清除相关缓存
            ClearAccountCacheForApiKey(apiKeyId);

            _logger.LogInformation("成功批量更新API Key {ApiKeyId} 的权限", apiKeyId);
            return true;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "批量更新API Key权限时发生错误: {ApiKeyId}", apiKeyId);
            throw;
        }
    }

    #region 私有方法 - 权限验证和查询

    /// <summary>
    /// 验证权限参数
    /// </summary>
    private async Task ValidatePermissionParametersAsync(
        Guid apiKeyId, 
        string accountPoolGroup, 
        string[] allowedPlatforms,
        CancellationToken cancellationToken)
    {
        // 检查API Key是否存在
        var apiKey = await _context.ApiKeys.FindAsync(apiKeyId, cancellationToken);
        if (apiKey == null)
        {
            throw new ArgumentException($"API Key {apiKeyId} 不存在");
        }

        // 验证账号池分组名称
        if (string.IsNullOrWhiteSpace(accountPoolGroup))
        {
            throw new ArgumentException("账号池分组名称不能为空");
        }

        // 验证平台列表
        if (allowedPlatforms == null || allowedPlatforms.Length == 0)
        {
            throw new ArgumentException("允许的平台列表不能为空");
        }

        var validPlatforms = new[] { "claude", "claude-console", "gemini", "openai", "thor", "all" };
        foreach (var platform in allowedPlatforms)
        {
            if (!validPlatforms.Contains(platform.ToLowerInvariant()))
            {
                throw new ArgumentException($"不支持的平台类型: {platform}");
            }
        }

        // 验证账号池分组是否存在对应的账户
        var hasAccounts = await _context.Accounts
            .AnyAsync(a => a.PoolGroup == accountPoolGroup && a.IsEnabled, cancellationToken);
        
        if (!hasAccounts)
        {
            _logger.LogWarning("账号池分组 '{AccountPoolGroup}' 中没有可用的账户", accountPoolGroup);
        }
    }

    /// <summary>
    /// 验证权限请求
    /// </summary>
    private static void ValidatePermissionRequest(ApiKeyAccountPoolPermissionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AccountPoolGroup))
        {
            throw new ArgumentException("账号池分组名称不能为空");
        }

        if (request.AllowedPlatforms == null || request.AllowedPlatforms.Length == 0)
        {
            throw new ArgumentException("允许的平台列表不能为空");
        }

        if (request.Priority < 0 || request.Priority > 100)
        {
            throw new ArgumentException("优先级必须在0-100之间");
        }

        var validStrategies = new[] { "priority", "round_robin", "random", "performance", "least_used", "weighted" };
        if (!validStrategies.Contains(request.SelectionStrategy.ToLowerInvariant()))
        {
            throw new ArgumentException($"不支持的选择策略: {request.SelectionStrategy}");
        }
    }

    /// <summary>
    /// 获取有效的权限列表
    /// </summary>
    private async Task<List<ApiKeyAccountPoolPermission>> GetEffectivePermissionsAsync(
        Guid apiKeyId, 
        string platform, 
        CancellationToken cancellationToken)
    {
        return await _context.ApiKeyAccountPoolPermissions
            .AsNoTracking()
            .Where(p => p.ApiKeyId == apiKeyId && 
                       p.IsEnabled &&
                       (p.EffectiveFrom == null || p.EffectiveFrom <= DateTime.UtcNow) &&
                       (p.EffectiveTo == null || p.EffectiveTo > DateTime.UtcNow))
            .Where(p => p.AllowedPlatforms.Contains("all") || p.AllowedPlatforms.Contains(platform))
            .OrderBy(p => p.Priority)
            .ThenBy(p => p.AccountPoolGroup)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 获取最高优先级的权限
    /// </summary>
    private async Task<ApiKeyAccountPoolPermission?> GetTopPriorityPermissionAsync(
        Guid apiKeyId, 
        string platform, 
        CancellationToken cancellationToken)
    {
        return await _context.ApiKeyAccountPoolPermissions
            .AsNoTracking()
            .Where(p => p.ApiKeyId == apiKeyId && p.IsEnabled)
            .Where(p => p.AllowedPlatforms.Contains("all") || p.AllowedPlatforms.Contains(platform))
            .OrderBy(p => p.Priority)
            .FirstOrDefaultAsync(cancellationToken);
    }

    /// <summary>
    /// 根据分组获取账户
    /// </summary>
    private async Task<List<Accounts>> GetAccountsByPoolGroupAsync(
        string poolGroup, 
        string platform, 
        CancellationToken cancellationToken)
    {
        return await _context.Accounts
            .AsNoTracking()
            .Where(a => a.PoolGroup == poolGroup && 
                       a.Platform == platform && 
                       a.IsEnabled)
            .OrderBy(a => a.Priority)
            .ThenByDescending(a => a.Weight)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region 私有方法 - 账户选择策略

    /// <summary>
    /// 根据策略选择账户
    /// </summary>
    private async Task<Accounts> SelectAccountByStrategyAsync(
        Guid apiKeyId,
        List<Accounts> availableAccounts,
        string strategy,
        string? sessionHash,
        CancellationToken cancellationToken)
    {
        return strategy.ToLowerInvariant() switch
        {
            "priority" => SelectByPriority(availableAccounts),
            "round_robin" => SelectByRoundRobin(apiKeyId, availableAccounts),
            "random" => SelectByRandom(availableAccounts),
            "performance" => SelectByPerformance(availableAccounts),
            "least_used" => SelectByLeastUsed(availableAccounts),
            "weighted" => SelectByWeight(availableAccounts),
            "consistent_hash" when !string.IsNullOrEmpty(sessionHash) => 
                SelectByConsistentHash(availableAccounts, sessionHash),
            _ => SelectByPriority(availableAccounts)
        };
    }

    /// <summary>
    /// 优先级策略：选择优先级最高的账户
    /// </summary>
    private Accounts SelectByPriority(List<Accounts> accounts)
    {
        return accounts
            .OrderBy(a => a.Priority)
            .ThenByDescending(a => a.Weight)
            .ThenBy(a => a.UsageCount)
            .First();
    }

    /// <summary>
    /// 轮询策略：按顺序依次选择账户
    /// </summary>
    private Accounts SelectByRoundRobin(Guid apiKeyId, List<Accounts> accounts)
    {
        var key = $"rr_{apiKeyId}";
        var currentIndex = _roundRobinCounters.AddOrUpdate(key, 0, (k, v) => (v + 1) % accounts.Count);
        
        // 确保索引在有效范围内
        if (currentIndex >= accounts.Count)
        {
            currentIndex = 0;
            _roundRobinCounters.TryUpdate(key, currentIndex, _roundRobinCounters[key]);
        }
        
        return accounts[currentIndex];
    }

    /// <summary>
    /// 随机策略：随机选择账户
    /// </summary>
    private Accounts SelectByRandom(List<Accounts> accounts)
    {
        var random = new Random();
        return accounts[random.Next(accounts.Count)];
    }

    /// <summary>
    /// 性能策略：选择权重最高、使用次数最少的账户
    /// </summary>
    private Accounts SelectByPerformance(List<Accounts> accounts)
    {
        return accounts
            .OrderByDescending(a => a.Weight)
            .ThenBy(a => a.UsageCount)
            .ThenBy(a => a.Priority)
            .First();
    }

    /// <summary>
    /// 最少使用策略：选择使用次数最少的账户
    /// </summary>
    private Accounts SelectByLeastUsed(List<Accounts> accounts)
    {
        return accounts
            .OrderBy(a => a.UsageCount)
            .ThenBy(a => a.Priority)
            .ThenByDescending(a => a.Weight)
            .First();
    }

    /// <summary>
    /// 权重策略：根据权重随机选择
    /// </summary>
    private Accounts SelectByWeight(List<Accounts> accounts)
    {
        var totalWeight = accounts.Sum(a => Math.Max(a.Weight, 1));
        var random = new Random();
        var randomValue = random.NextDouble() * totalWeight;
        
        var currentWeight = 0.0;
        foreach (var account in accounts)
        {
            currentWeight += Math.Max(account.Weight, 1);
            if (randomValue <= currentWeight)
            {
                return account;
            }
        }
        
        // 兜底返回第一个
        return accounts.First();
    }

    /// <summary>
    /// 一致性哈希策略：基于会话哈希选择固定账户
    /// </summary>
    private Accounts SelectByConsistentHash(List<Accounts> accounts, string sessionHash)
    {
        var hash = sessionHash.GetHashCode();
        var index = Math.Abs(hash) % accounts.Count;
        return accounts[index];
    }

    #endregion

    #region 私有方法 - 会话管理

    /// <summary>
    /// 获取会话固定的账户
    /// </summary>
    private async Task<Accounts?> GetSessionFixedAccountAsync(
        Guid apiKeyId, 
        string platform, 
        string sessionHash, 
        CancellationToken cancellationToken)
    {
        var sessionKey = $"{apiKeyId}_{platform}_{sessionHash}";
        
        if (_sessionAccountMappings.TryGetValue(sessionKey, out var accountId))
        {
            var account = await _accountsService.GetAccountByIdAsync(accountId, cancellationToken);
            if (account != null && await _accountsService.IsAccountAvailableAsync(account, cancellationToken))
            {
                // 检查账户是否仍在权限范围内
                var hasPermission = await HasPermissionAsync(apiKeyId, accountId, platform, cancellationToken);
                if (hasPermission)
                {
                    return account;
                }
            }
            
            // 如果账户不可用或无权限，清除映射
            _sessionAccountMappings.TryRemove(sessionKey, out _);
        }
        
        return null;
    }

    /// <summary>
    /// 设置会话账户映射
    /// </summary>
    private void SetSessionAccountMapping(Guid apiKeyId, string platform, string sessionHash, string accountId)
    {
        var sessionKey = $"{apiKeyId}_{platform}_{sessionHash}";
        _sessionAccountMappings.AddOrUpdate(sessionKey, accountId, (k, v) => accountId);
        
        // 定期清理过期的映射（简单实现，生产环境建议使用更复杂的缓存策略）
        if (_sessionAccountMappings.Count > 10000)
        {
            var toRemove = _sessionAccountMappings.Take(1000).ToList();
            foreach (var item in toRemove)
            {
                _sessionAccountMappings.TryRemove(item.Key, out _);
            }
        }
    }

    #endregion

    #region 私有方法 - 缓存管理

    /// <summary>
    /// 清除API Key相关的缓存
    /// </summary>
    private void ClearAccountCacheForApiKey(Guid apiKeyId)
    {
        var keysToRemove = new List<string>();
        
        // 清除轮询计数器
        var roundRobinKey = $"rr_{apiKeyId}";
        _roundRobinCounters.TryRemove(roundRobinKey, out _);
        
        // 清除会话映射
        foreach (var sessionKey in _sessionAccountMappings.Keys.ToList())
        {
            if (sessionKey.StartsWith($"{apiKeyId}_"))
            {
                keysToRemove.Add(sessionKey);
            }
        }
        
        foreach (var key in keysToRemove)
        {
            _sessionAccountMappings.TryRemove(key, out _);
        }
        
        // 清除账户指标
        _accountMetrics.TryRemove(apiKeyId.ToString(), out _);
        
        _logger.LogDebug("清除API Key {ApiKeyId} 的相关缓存", apiKeyId);
    }

    #endregion

    #region 内部类

    /// <summary>
    /// 账户性能指标
    /// </summary>
    private class AccountMetrics
    {
        public long RequestCount { get; set; }
        public long SuccessCount { get; set; }
        public long FailureCount { get; set; }
        public double AverageResponseTime { get; set; }
        public DateTime LastUsedAt { get; set; }
        public DateTime LastUpdatedAt { get; set; }
        
        public double SuccessRate => RequestCount > 0 ? (double)SuccessCount / RequestCount : 0.0;
        public double FailureRate => RequestCount > 0 ? (double)FailureCount / RequestCount : 0.0;
    }

    #endregion
}
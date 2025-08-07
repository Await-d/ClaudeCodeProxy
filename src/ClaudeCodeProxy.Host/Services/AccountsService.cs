using System.Text;
using System.Text.Json;
using ClaudeCodeProxy.Core;
using ClaudeCodeProxy.Domain;
using ClaudeCodeProxy.Host.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// 账户服务实现
/// </summary>
public class AccountsService(IContext context, IMemoryCache memoryCache, ILogger<AccountsService> logger)
{
    /// <summary>
    /// 获取所有账户
    /// </summary>
    public async Task<List<Accounts>> GetAllAccountsAsync(CancellationToken cancellationToken = default)
    {
        return await context.Accounts
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 根据ID获取账户
    /// </summary>
    public async Task<Accounts?> GetAccountByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await context.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    /// <summary>
    /// 根据平台获取账户
    /// </summary>
    public async Task<List<Accounts>> GetAccountsByPlatformAsync(string platform,
        CancellationToken cancellationToken = default)
    {
        return await context.Accounts
            .AsNoTracking()
            .Where(x => x.Platform == platform)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 创建新账户
    /// </summary>
    public async Task<Accounts> CreateAccountAsync(
        string platform,
        CreateAccountRequest request, CancellationToken cancellationToken = default)
    {
        var account = new Accounts
        {
            Id = Guid.NewGuid().ToString(),
            Platform = platform,
            Name = request.Name,
            Description = request.Description,
            IsEnabled = true,
            CreatedAt = DateTime.Now,
            ApiKey = request.ApiKey,
            ApiUrl = request.ApiUrl,
            Proxy = request.Proxy,
            ClaudeAiOauth = request.ClaudeAiOauth,
            Priority = request.Priority,
            AccountType = request.AccountType,
        };

        await context.Accounts.AddAsync(account, cancellationToken);
        await context.SaveAsync(cancellationToken);

        return account;
    }

    /// <summary>
    /// 更新账户
    /// </summary>
    public async Task<Accounts?> UpdateAccountAsync(string id, UpdateAccountRequest request,
        CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return null;
        }

        if (!string.IsNullOrEmpty(request.Name))
            account.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Description))
            account.Description = request.Description;

        if (request.IsActive.HasValue)
            account.IsEnabled = request.IsActive.Value;

        if (!string.IsNullOrEmpty(request.AccountType))
            account.AccountType = request.AccountType;

        if (request.Priority.HasValue)
            account.Priority = request.Priority.Value;

        if (!string.IsNullOrEmpty(request.ProjectId))
            account.ProjectId = request.ProjectId;

        if (!string.IsNullOrEmpty(request.ApiUrl))
            account.ApiUrl = request.ApiUrl;

        if (!string.IsNullOrEmpty(request.ApiKey))
            account.ApiKey = request.ApiKey;

        if (!string.IsNullOrEmpty(request.UserAgent))
            account.UserAgent = request.UserAgent;

        if (request.RateLimitDuration.HasValue)
            account.RateLimitDuration = request.RateLimitDuration.Value;

        if (request.SupportedModels != null)
        {
            // 将字典格式的模型映射转换为 List<string> 格式存储
            account.SupportedModels = request.SupportedModels
                .Where(kvp => !string.IsNullOrEmpty(kvp.Key) && !string.IsNullOrEmpty(kvp.Value))
                .Select(kvp => $"{kvp.Key}:{kvp.Value}")
                .ToList();

            // 确保转换后的数据格式正确 - 这应该生成 ["key:value", "key2:value2"] 的List<string>
            logger.LogDebug("SupportedModels转换结果: {SupportedModels}",
                string.Join(", ", account.SupportedModels.Select(x => $"\"{x}\"")));
        }

        account.ClaudeAiOauth = request.ClaudeAiOauth;

        if (request.GeminiOauth != null)
        {
            // 将对象序列化为JSON字符串存储
            if (request.GeminiOauth is string geminiOauthString)
            {
                account.GeminiOauth = geminiOauthString;
            }
            else
            {
                account.GeminiOauth = System.Text.Json.JsonSerializer.Serialize(request.GeminiOauth);
            }
        }

        account.Proxy = request.Proxy;

        account.ModifiedAt = DateTime.Now;

        await context.SaveAsync(cancellationToken);
        return account;
    }

    /// <summary>
    /// 删除账户
    /// </summary>
    public async Task<bool> DeleteAccountAsync(string id, CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        context.Accounts.Remove(account);
        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 更新账户状态
    /// </summary>
    public async Task<bool> UpdateAccountStatusAsync(string id, string status,
        CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        account.Status = status;
        account.ModifiedAt = DateTime.Now;

        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 启用账户
    /// </summary>
    public async Task<bool> EnableAccountAsync(string id, CancellationToken cancellationToken = default)
    {
        await context.Accounts.Where(x => x.Id == id)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsEnabled, true)
                .SetProperty(a => a.ModifiedAt, DateTime.Now), cancellationToken);

        // 检查是否有记录被更新
        var account = await context.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return account != null;
    }

    /// <summary>
    /// 禁用账户
    /// </summary>
    public async Task<bool> DisableAccountAsync(string id, CancellationToken cancellationToken = default)
    {
        await context.Accounts.Where(x => x.Id == id)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsEnabled, false)
                .SetProperty(a => a.ModifiedAt, DateTime.Now), cancellationToken);

        // 检查是否有记录被更新
        var account = await context.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        return account != null;
    }

    /// <summary>
    /// 切换账户启用状态
    /// </summary>
    public async Task<bool> ToggleAccountEnabledAsync(string id, CancellationToken cancellationToken = default)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (account == null)
        {
            return false;
        }

        account.IsEnabled = !account.IsEnabled;
        account.ModifiedAt = DateTime.Now;

        await context.SaveAsync(cancellationToken);
        return true;
    }

    /// <summary>
    /// 更新账户最后使用时间
    /// </summary>
    public async Task<bool> UpdateLastUsedAsync(string id, CancellationToken cancellationToken = default)
    {
        await context.Accounts.Where(x => x.Id == id)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.LastUsedAt, DateTime.Now)
                .SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                .SetProperty(a => a.ModifiedAt, DateTime.Now), cancellationToken);
        return true;
    }

    /// <summary>
    /// 设置账户限流状态
    /// </summary>
    public async Task<bool> SetRateLimitAsync(string id, DateTime rateLimitedUntil, string? error = null,
        CancellationToken cancellationToken = default)
    {
        await context.Accounts.Where(x => x.Id == id)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.Status, "rate_limited")
                .SetProperty(a => a.RateLimitedUntil, rateLimitedUntil)
                .SetProperty(a => a.LastError, error)
                .SetProperty(a => a.ModifiedAt, DateTime.Now), cancellationToken);

        return true;
    }

    /// <summary>
    /// 获取可用的账户（启用且未限流）
    /// </summary>
    public async Task<List<Accounts>> GetAvailableAccountsAsync(string? platform = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.Accounts
            .AsNoTracking()
            .Where(x => x.IsEnabled &&
                        x.Status == "active" &&
                        (x.RateLimitedUntil == null || x.RateLimitedUntil < DateTime.Now));

        if (!string.IsNullOrEmpty(platform))
        {
            query = query.Where(x => x.Platform == platform);
        }

        return await query
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.LastUsedAt ?? DateTime.MinValue)
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// 根据算法获取一个可用账户
    /// </summary>
    /// <param name="apiKeyValue">API Key值</param>
    /// <param name="sessionHash">会话哈希</param>
    /// <param name="requestedModel">请求的模型</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选中的账户</returns>
    public async Task<Accounts?> SelectAccountForApiKey(ApiKey apiKeyValue, string sessionHash,
        string? requestedModel = null, CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. 如果API Key绑定了专属Claude OAuth账户，优先使用
            if (!string.IsNullOrEmpty(apiKeyValue.ClaudeAccountId))
            {
                var boundAccount = await GetAccountByIdAsync(apiKeyValue.ClaudeAccountId, cancellationToken);
                if (boundAccount != null && await IsAccountAvailableAsync(boundAccount, cancellationToken))
                {
                    logger.LogInformation(
                        "🎯 使用绑定的专属Claude OAuth账户: {AccountName} ({AccountId}) for API key {ApiKeyName}",
                        boundAccount.Name, apiKeyValue.ClaudeAccountId, apiKeyValue.Name);

                    await UpdateLastUsedAsync(boundAccount.Id, cancellationToken);
                    return boundAccount;
                }
                else
                {
                    logger.LogWarning("⚠️ 绑定的Claude OAuth账户 {AccountId} 不可用，回退到账户池", apiKeyValue.ClaudeAccountId);
                }
            }

            // 2. 检查Claude Console账户绑定
            if (!string.IsNullOrEmpty(apiKeyValue.ClaudeConsoleAccountId))
            {
                var boundConsoleAccount =
                    await GetAccountByIdAsync(apiKeyValue.ClaudeConsoleAccountId, cancellationToken);
                if (boundConsoleAccount != null &&
                    await IsAccountAvailableAsync(boundConsoleAccount, cancellationToken))
                {
                    logger.LogInformation(
                        "🎯 使用绑定的专属Claude Console账户: {AccountName} ({AccountId}) for API key {ApiKeyName}",
                        boundConsoleAccount.Name, apiKeyValue.ClaudeConsoleAccountId, apiKeyValue.Name);

                    await UpdateLastUsedAsync(boundConsoleAccount.Id, cancellationToken);
                    return boundConsoleAccount;
                }
                else
                {
                    logger.LogWarning("⚠️ 绑定的Claude Console账户 {AccountId} 不可用，回退到账户池",
                        apiKeyValue.ClaudeConsoleAccountId);
                }
            }

            // 3. 如果有会话哈希，检查是否有已映射的账户
            if (!string.IsNullOrEmpty(sessionHash))
            {
                var mappedAccount = await GetSessionMappingAsync(sessionHash, cancellationToken);
                if (mappedAccount != null)
                {
                    // 验证映射的账户是否仍然可用
                    if (await IsAccountAvailableAsync(mappedAccount, cancellationToken))
                    {
                        logger.LogInformation("🎯 使用粘性会话账户: {AccountName} ({AccountId}) for session {SessionHash}",
                            mappedAccount.Name, mappedAccount.Id, sessionHash);

                        await UpdateLastUsedAsync(mappedAccount.Id, cancellationToken);
                        return mappedAccount;
                    }
                    else
                    {
                        logger.LogWarning("⚠️ 映射的账户 {AccountId} 不再可用，选择新账户", mappedAccount.Id);
                        await DeleteSessionMappingAsync(sessionHash);
                    }
                }
            }

            // 4. 获取所有可用账户（传递请求的模型进行过滤）
            var availableAccounts = await GetAllAvailableAccountsAsync(apiKeyValue, requestedModel, cancellationToken);

            if (availableAccounts.Count == 0)
            {
                // 提供更详细的错误信息
                var errorMessage = !string.IsNullOrEmpty(requestedModel)
                    ? $"没有可用的Claude账户支持请求的模型: {requestedModel}"
                    : "没有可用的Claude账户（官方或Console）";

                logger.LogError("❌ {ErrorMessage}", errorMessage);
                throw new InvalidOperationException(errorMessage);
            }

            // 5. 按优先级和最后使用时间排序
            var sortedAccounts = SortAccountsByPriority(availableAccounts);

            // 6. 选择第一个账户
            var selectedAccount = sortedAccounts.First();

            // 7. 如果有会话哈希，建立新的映射
            if (!string.IsNullOrEmpty(sessionHash))
            {
                await SetSessionMappingAsync(sessionHash, selectedAccount, cancellationToken);
                logger.LogInformation("🎯 创建新的粘性会话映射: {AccountName} ({AccountId}) for session {SessionHash}",
                    selectedAccount.Name, selectedAccount.Id, sessionHash);
            }

            logger.LogInformation("🎯 选择账户: {AccountName} ({AccountId}) 优先级 {Priority} for API key {ApiKeyName}",
                selectedAccount.Name, selectedAccount.Id, selectedAccount.Priority, apiKeyValue.Name);

            await UpdateLastUsedAsync(selectedAccount.Id, cancellationToken);
            return selectedAccount;
        }
        catch (Exception error)
        {
            logger.LogError(error, "❌ 为API key选择账户失败");
            throw;
        }
    }

    /// <summary>
    /// 根据API Key的分组配置选择账户（支持分组管理）
    /// </summary>
    /// <param name="apiKeyValue">API Key值</param>
    /// <param name="sessionHash">会话哈希</param>
    /// <param name="requestedModel">请求的模型</param>
    /// <param name="apiKeyGroupService">API Key分组服务</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选中的账户</returns>
    public async Task<Accounts?> SelectAccountForApiKeyWithGroup(ApiKey apiKeyValue, string sessionHash,
        string? requestedModel = null, IApiKeyGroupService? apiKeyGroupService = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 如果API Key启用了分组管理且提供了分组服务
            if (apiKeyValue.IsGroupManaged && apiKeyGroupService != null && apiKeyValue.GroupIds.Count > 0)
            {
                logger.LogInformation("🔄 API Key {ApiKeyName} 启用分组管理，尝试使用分组选择策略", apiKeyValue.Name);

                // 遍历API Key所属的分组，按优先级选择
                foreach (var groupId in apiKeyValue.GroupIds.OrderBy(x => x))
                {
                    try
                    {
                        var selectedApiKey = await apiKeyGroupService.SelectApiKeyFromGroupAsync(
                            groupId, cancellationToken);

                        if (selectedApiKey != null)
                        {
                            // 使用选中的API Key获取对应的账户
                            var account = await GetAccountForApiKeyAsync(selectedApiKey, cancellationToken);
                            if (account != null && await IsAccountAvailableAsync(account, cancellationToken))
                            {
                                logger.LogInformation(
                                    "🎯 通过分组 {GroupId} 选择账户: {AccountName} ({AccountId}) for API key {ApiKeyName}",
                                    groupId, account.Name, account.Id, apiKeyValue.Name);

                                await UpdateLastUsedAsync(account.Id, cancellationToken);
                                
                                // 更新分组统计
                                await UpdateGroupUsageStatsAsync(selectedApiKey, true, apiKeyGroupService, cancellationToken);
                                
                                return account;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning("⚠️ 分组 {GroupId} 选择失败: {Error}，尝试下一个分组", groupId, ex.Message);
                        continue;
                    }
                }

                logger.LogWarning("⚠️ 所有分组都无法提供可用账户，回退到传统选择算法");
            }

            // 如果分组选择失败或未启用分组管理，使用传统算法
            return await SelectAccountForApiKey(apiKeyValue, sessionHash, requestedModel, cancellationToken);
        }
        catch (Exception error)
        {
            logger.LogError(error, "❌ 为API key选择账户失败（分组增强版）");
            throw;
        }
    }

    /// <summary>
    /// 根据API Key的账号池权限选择账户（新权限控制模式）
    /// </summary>
    /// <param name="apiKeyValue">API Key值</param>
    /// <param name="sessionHash">会话哈希</param>
    /// <param name="requestedModel">请求的模型</param>
    /// <param name="permissionService">账号池权限服务</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选中的账户</returns>
    /// <summary>
    /// 根据API Key的账号池权限选择账户（新权限控制模式）
    /// 提供最精细的权限控制和高级负载均衡策略
    /// </summary>
    /// <param name="apiKeyValue">API Key值</param>
    /// <param name="sessionHash">会话哈希</param>
    /// <param name="requestedModel">请求的模型</param>
    /// <param name="permissionService">账号池权限服务</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选中的账户</returns>
    public async Task<Accounts?> SelectAccountForApiKeyWithPoolPermission(ApiKey apiKeyValue, string sessionHash,
        string? requestedModel = null, IApiKeyAccountPermissionService? permissionService = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (permissionService == null)
            {
                logger.LogWarning("⚠️ 权限服务未提供，无法使用账号池权限控制");
                return null;
            }

            // 确定请求的平台类型
            var platform = DeterminePlatformFromService(apiKeyValue.Service);
            
            logger.LogInformation("🔐 API Key {ApiKeyName} 使用账号池权限控制，平台: {Platform}", 
                apiKeyValue.Name, platform);

            // 通过权限服务选择最佳账户（包含智能负载均衡）
            var selectedAccount = await permissionService.SelectBestAccountAsync(
                apiKeyValue.Id, platform, sessionHash, cancellationToken);

            if (selectedAccount != null)
            {
                // 双重验证：确保选择的账户确实可用
                if (await IsAccountAvailableAsync(selectedAccount, cancellationToken))
                {
                    logger.LogInformation(
                        "🎯 通过账号池权限成功选择账户: {AccountName} ({AccountId}) for API key {ApiKeyName}",
                        selectedAccount.Name, selectedAccount.Id, apiKeyValue.Name);

                    // 更新账户使用统计
                    await UpdateLastUsedAsync(selectedAccount.Id, cancellationToken);
                    
                    // 记录成功的权限使用（用于后续优化）
                    await RecordPermissionUsageAsync(apiKeyValue.Id, selectedAccount.Id, true, cancellationToken);
                    
                    return selectedAccount;
                }
                else
                {
                    logger.LogWarning("⚠️ 权限服务选择的账户 {AccountId} 实际不可用，可能存在状态同步问题", 
                        selectedAccount.Id);
                        
                    // 记录失败的权限使用
                    await RecordPermissionUsageAsync(apiKeyValue.Id, selectedAccount.Id, false, cancellationToken);
                }
            }
            else
            {
                logger.LogWarning("⚠️ 账号池权限控制未能找到可用账户，API Key: {ApiKeyName}, 平台: {Platform}", 
                    apiKeyValue.Name, platform);
                    
                // 检查是否有权限配置但无可用账户
                var permissions = await permissionService.GetPermissionsAsync(apiKeyValue.Id, cancellationToken);
                if (permissions.Any(p => p.IsEnabled))
                {
                    logger.LogWarning("⚠️ API Key {ApiKeyName} 有权限配置但无可用账户，请检查账户池状态", apiKeyValue.Name);
                }
            }

            return null;
        }
        catch (Exception error)
        {
            logger.LogError(error, "❌ 通过账号池权限选择账户失败: {ApiKeyName}, {Platform}", 
                apiKeyValue.Name, DeterminePlatformFromService(apiKeyValue.Service));
            throw;
        }
    }

    /// <summary>
    /// 智能账户选择（整合所有选择策略）
    /// </summary>
    /// <param name="apiKeyValue">API Key值</param>
    /// <param name="sessionHash">会话哈希</param>
    /// <param name="requestedModel">请求的模型</param>
    /// <param name="apiKeyGroupService">API Key分组服务</param>
    /// <param name="permissionService">账号池权限服务</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选中的账户</returns>
    /// <summary>
    /// 智能账户选择（整合所有选择策略）
    /// 优先级：账号池权限控制 > API Key分组管理 > 传统固定绑定
    /// </summary>
    /// <param name="apiKeyValue">API Key值</param>
    /// <param name="sessionHash">会话哈希</param>
    /// <param name="requestedModel">请求的模型</param>
    /// <param name="apiKeyGroupService">API Key分组服务</param>
    /// <param name="permissionService">账号池权限服务</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>选中的账户</returns>
    public async Task<Accounts?> SelectAccountIntelligent(ApiKey apiKeyValue, string sessionHash,
        string? requestedModel = null, 
        IApiKeyGroupService? apiKeyGroupService = null,
        IApiKeyAccountPermissionService? permissionService = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            logger.LogInformation("🤖 开始智能账户选择，API Key: {ApiKeyName}", apiKeyValue.Name);

            // 策略1: 优先使用账号池权限控制（最新功能，提供最精细的控制）
            if (permissionService != null)
            {
                var hasPermissions = await HasAccountPoolPermissions(apiKeyValue.Id, permissionService, cancellationToken);
                if (hasPermissions)
                {
                    logger.LogInformation("📋 使用账号池权限控制策略");
                    var account = await SelectAccountForApiKeyWithPoolPermission(
                        apiKeyValue, sessionHash, requestedModel, permissionService, cancellationToken);
                    
                    if (account != null)
                    {
                        logger.LogInformation("✅ 账号池权限控制策略成功选择账户: {AccountId} ({AccountName})", 
                            account.Id, account.Name);
                        return account;
                    }
                    else
                    {
                        logger.LogWarning("⚠️ 账号池权限控制策略未能选择到可用账户");
                    }
                }
                else
                {
                    logger.LogDebug("🔍 API Key {ApiKeyName} 未配置账号池权限", apiKeyValue.Name);
                }
            }

            // 策略2: 使用API Key分组管理（支持复杂的分组和故障转移）
            if (apiKeyValue.IsGroupManaged && apiKeyGroupService != null && apiKeyValue.GroupIds.Count > 0)
            {
                logger.LogInformation("👥 使用API Key分组管理策略");
                var account = await SelectAccountForApiKeyWithGroup(
                    apiKeyValue, sessionHash, requestedModel, apiKeyGroupService, cancellationToken);
                
                if (account != null)
                {
                    logger.LogInformation("✅ API Key分组管理策略成功选择账户: {AccountId} ({AccountName})", 
                        account.Id, account.Name);
                    return account;
                }
                else
                {
                    logger.LogWarning("⚠️ API Key分组管理策略未能选择到可用账户");
                }
            }
            else if (apiKeyValue.IsGroupManaged)
            {
                logger.LogWarning("⚠️ API Key {ApiKeyName} 启用了分组管理但未提供分组服务或未配置分组", apiKeyValue.Name);
            }

            // 策略3: 回退到传统固定绑定模式（向后兼容）
            logger.LogInformation("🔗 使用传统固定绑定策略");
            var fallbackAccount = await SelectAccountForApiKey(apiKeyValue, sessionHash, requestedModel, cancellationToken);
            
            if (fallbackAccount != null)
            {
                logger.LogInformation("✅ 传统固定绑定策略成功选择账户: {AccountId} ({AccountName})", 
                    fallbackAccount.Id, fallbackAccount.Name);
            }
            else
            {
                logger.LogError("❌ 所有策略都未能选择到可用账户，API Key: {ApiKeyName}", apiKeyValue.Name);
            }
            
            return fallbackAccount;
        }
        catch (Exception error)
        {
            logger.LogError(error, "❌ 智能账户选择失败，API Key: {ApiKeyName}", apiKeyValue.Name);
            throw;
        }
    }

    #region 辅助方法

    /// <summary>
    /// 检查API Key是否配置了账号池权限
    /// </summary>
    private async Task<bool> HasAccountPoolPermissions(Guid apiKeyId, 
        IApiKeyAccountPermissionService permissionService, 
        CancellationToken cancellationToken)
    {
        try
        {
            var permissions = await permissionService.GetPermissionsAsync(apiKeyId, cancellationToken);
            return permissions.Any(p => p.IsEnabled && p.IsEffective());
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 根据服务类型确定平台类型
    /// </summary>
    private string DeterminePlatformFromService(string service)
    {
        return service.ToLowerInvariant() switch
        {
            "claude" => "claude",
            "claude-console" => "claude-console", 
            "gemini" => "gemini",
            "openai" => "openai",
            "thor" => "thor",
            _ => "claude"
        };
    }

    /// <summary>
    /// 记录权限使用情况（用于统计和优化）
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="accountId">账户ID</param>
    /// <param name="success">是否成功</param>
    /// <param name="cancellationToken">取消令牌</param>
    private async Task RecordPermissionUsageAsync(Guid apiKeyId, string accountId, bool success, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 这里可以记录到数据库或缓存中，用于后续的使用统计和优化
            // 简单实现：更新账户的使用计数
            if (success)
            {
                await UpdateAccountLastUsedAsync(accountId, cancellationToken);
            }
            
            logger.LogDebug("记录权限使用: API Key {ApiKeyId}, 账户 {AccountId}, 成功: {Success}", 
                apiKeyId, accountId, success);
        }
        catch (Exception ex)
        {
            logger.LogWarning("记录权限使用失败: {Error}", ex.Message);
            // 不抛出异常，避免影响主流程
        }
    }

    /// <summary>
    /// 获取账户池健康状态统计
    /// </summary>
    /// <param name="poolGroup">账户池分组</param>
    /// <param name="platform">平台类型</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>健康状态统计</returns>
    public async Task<AccountPoolHealthStats> GetAccountPoolHealthStatsAsync(
        string poolGroup, 
        string platform, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            var accounts = await context.Accounts
                .AsNoTracking()
                .Where(a => a.PoolGroup == poolGroup && a.Platform == platform)
                .ToListAsync(cancellationToken);

            var stats = new AccountPoolHealthStats
            {
                PoolGroup = poolGroup,
                Platform = platform,
                TotalAccounts = accounts.Count,
                EnabledAccounts = accounts.Count(a => a.IsEnabled),
                ActiveAccounts = accounts.Count(a => a.IsEnabled && a.Status == "active"),
                RateLimitedAccounts = accounts.Count(a => a.RateLimitedUntil.HasValue && a.RateLimitedUntil > DateTime.UtcNow),
                ErrorAccounts = accounts.Count(a => !string.IsNullOrEmpty(a.LastError)),
                AverageUsageCount = accounts.Where(a => a.IsEnabled).Average(a => (double?)a.UsageCount) ?? 0,
                LastCheckedAt = DateTime.UtcNow
            };

            return stats;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "获取账户池健康状态统计失败: {PoolGroup}, {Platform}", poolGroup, platform);
            throw;
        }
    }

    /// <summary>
    /// 验证账户池权限配置的有效性
    /// </summary>
    /// <param name="apiKeyId">API Key ID</param>
    /// <param name="permissionService">权限服务</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>验证结果</returns>
    public async Task<PermissionValidationResult> ValidateAccountPoolPermissionsAsync(
        Guid apiKeyId, 
        IApiKeyAccountPermissionService permissionService,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = new PermissionValidationResult
            {
                ApiKeyId = apiKeyId,
                IsValid = true,
                ValidationMessages = new List<string>()
            };

            // 获取所有权限配置
            var permissions = await permissionService.GetPermissionsAsync(apiKeyId, cancellationToken);
            result.TotalPermissions = permissions.Count;

            if (!permissions.Any())
            {
                result.ValidationMessages.Add("未配置任何账号池权限");
                result.IsValid = false;
                return result;
            }

            // 验证每个权限配置
            foreach (var permission in permissions)
            {
                if (!permission.IsEnabled)
                {
                    result.DisabledPermissions++;
                    continue;
                }

                if (!permission.IsEffective())
                {
                    result.IneffectivePermissions++;
                    result.ValidationMessages.Add($"权限 '{permission.AccountPoolGroup}' 未生效（时间范围问题）");
                    continue;
                }

                result.EffectivePermissions++;

                // 检查每个平台是否有可用账户
                foreach (var platform in permission.AllowedPlatforms)
                {
                    if (platform.Equals("all", StringComparison.OrdinalIgnoreCase))
                        continue;

                    var allowedAccounts = await permissionService.GetAllowedAccountsAsync(
                        apiKeyId, platform, cancellationToken);

                    if (!allowedAccounts.Any())
                    {
                        result.ValidationMessages.Add(
                            $"权限 '{permission.AccountPoolGroup}' 在平台 '{platform}' 上没有可用账户");
                        result.IsValid = false;
                    }
                    else
                    {
                        var availableCount = 0;
                        foreach (var account in allowedAccounts)
                        {
                            if (await IsAccountAvailableAsync(account, cancellationToken))
                            {
                                availableCount++;
                            }
                        }

                        if (availableCount == 0)
                        {
                            result.ValidationMessages.Add(
                                $"权限 '{permission.AccountPoolGroup}' 在平台 '{platform}' 上的所有账户都不可用");
                            result.IsValid = false;
                        }
                    }
                }
            }

            result.ValidationPerformed = true;
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "验证账户池权限配置失败: {ApiKeyId}", apiKeyId);
            return new PermissionValidationResult
            {
                ApiKeyId = apiKeyId,
                IsValid = false,
                ValidationMessages = new List<string> { $"验证过程发生错误: {ex.Message}" },
                ValidationPerformed = false
            };
        }
    }

    #endregion

    /// <summary>
    /// 根据API Key获取对应的账户
    /// </summary>
    private async Task<Accounts?> GetAccountForApiKeyAsync(ApiKey apiKey, CancellationToken cancellationToken = default)
    {
        // 优先使用绑定的专属账户
        if (!string.IsNullOrEmpty(apiKey.ClaudeAccountId))
        {
            var account = await GetAccountByIdAsync(apiKey.ClaudeAccountId, cancellationToken);
            if (account != null) return account;
        }

        if (!string.IsNullOrEmpty(apiKey.ClaudeConsoleAccountId))
        {
            var account = await GetAccountByIdAsync(apiKey.ClaudeConsoleAccountId, cancellationToken);
            if (account != null) return account;
        }

        if (!string.IsNullOrEmpty(apiKey.GeminiAccountId))
        {
            var account = await GetAccountByIdAsync(apiKey.GeminiAccountId, cancellationToken);
            if (account != null) return account;
        }

        // 如果没有绑定专属账户，返回null让上层处理
        return null;
    }

    /// <summary>
    /// 更新分组使用统计
    /// </summary>
    private async Task UpdateGroupUsageStatsAsync(ApiKey apiKey, bool success, 
        IApiKeyGroupService apiKeyGroupService, CancellationToken cancellationToken = default)
    {
        try
        {
            foreach (var groupId in apiKey.GroupIds)
            {
                var groupGuid = groupId; // groupId is already Guid type
                
                if (success)
                {
                    await apiKeyGroupService.RecordSuccessAsync(apiKey.Id, groupGuid, 0, 0, cancellationToken);
                }
                else
                {
                    await apiKeyGroupService.RecordFailureAsync(apiKey.Id, groupGuid, "Account not available", cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning("⚠️ 更新分组统计失败: {Error}", ex.Message);
            // 不抛出异常，允许主流程继续
        }
    }

    /// <summary>
    /// 检查账户是否可用
    /// </summary>
    public async Task<bool> IsAccountAvailableAsync(Accounts account, CancellationToken cancellationToken = default)
    {
        // 刷新账户状态以获取最新信息
        var latestAccount = await GetAccountByIdAsync(account.Id, cancellationToken);
        if (latestAccount == null)
        {
            return false;
        }

        return latestAccount.IsEnabled &&
               latestAccount.Status == "active" &&
               (latestAccount.RateLimitedUntil == null || latestAccount.RateLimitedUntil < DateTime.Now);
    }

    /// <summary>
    /// 获取所有可用账户（包含模型过滤）
    /// </summary>
    private async Task<List<Accounts>> GetAllAvailableAccountsAsync(ApiKey apiKey, string? requestedModel = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.Accounts
            .AsNoTracking()
            .Where(x => x.IsEnabled &&
                x.Status == "active" || x.Status == "rate_limited");

        query = query.Where(x =>
            x.Platform == "claude" || x.Platform == "claude-console" || x.Platform == "openai" ||
            x.Platform == "thor");

        var accounts = await query.ToListAsync(cancellationToken);

        accounts = accounts.Where(x =>
            (x.RateLimitedUntil == null || x.RateLimitedUntil < DateTime.Now)).ToList();

        // 如果指定了模型，进一步过滤支持该模型的账户
        if (!string.IsNullOrEmpty(requestedModel))
        {
            accounts = accounts.Where(account => DoesAccountSupportModel(account, requestedModel)).ToList();
        }

        return accounts;
    }

    /// <summary>
    /// 检查账户是否支持指定模型
    /// </summary>
    private bool DoesAccountSupportModel(Accounts account, string model)
    {
        // 如果没有配置支持的模型，则认为支持所有模型
        if (account.SupportedModels == null || account.SupportedModels.Count == 0)
        {
            return true;
        }

        try
        {
            // 解析存储的模型映射格式：["from:to", "model1:target1"]
            foreach (var mapping in account.SupportedModels)
            {
                var parts = mapping.Split(':', 2);
                if (parts.Length == 2)
                {
                    var fromModel = parts[0].Trim();
                    // 检查请求的模型是否匹配映射中的源模型或目标模型
                    if (string.Equals(fromModel, model, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
                // 也支持直接的模型名匹配（向后兼容）
                else if (string.Equals(mapping.Trim(), model, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
        catch
        {
            // 解析失败时，默认支持
            return true;
        }
    }

    private List<Accounts> SortAccountsByPriority(List<Accounts> accounts)
    {
        var now = DateTime.Now;

        return accounts
            .Select(account => new
            {
                Account = account,
                // 计算综合得分（分数越低越优先）
                Score = CalculateAccountScore(account, now)
            })
            .OrderBy(x => x.Score)
            .Select(x => x.Account)
            .ToList();
    }

    private double CalculateAccountScore(Accounts account, DateTime now)
    {
        double score = 0;

        // 1. 基础优先级权重 (0-100)
        score += account.Priority * 100;

        // 2. 使用频率权重 (0-50)
        score += Math.Min(account.UsageCount * 0.5, 50);

        // 3. 时间间隔权重 (0-100)
        var timeSinceLastUse = now - (account.LastUsedAt ?? DateTime.MinValue);
        if (timeSinceLastUse.TotalMinutes < 1) // 1分钟内使用过
            score += 100;
        else if (timeSinceLastUse.TotalMinutes < 5) // 5分钟内使用过
            score += 50;
        else if (timeSinceLastUse.TotalMinutes < 30) // 30分钟内使用过
            score += 20;

        // 4. 限流接近度权重 (0-200)
        if (account.RateLimitDuration > 0 && account.LastUsedAt.HasValue)
        {
            var timeSinceLastUseSeconds = timeSinceLastUse.TotalSeconds;
            var rateLimitApproachRatio = timeSinceLastUseSeconds / account.RateLimitDuration;
            if (rateLimitApproachRatio < 0.8) // 接近限流时间的80%
                score += 200 * (1 - rateLimitApproachRatio);
        }

        return score;
    }

    /// <summary>
    /// 获取会话映射的账户
    /// </summary>
    private async Task<Accounts?> GetSessionMappingAsync(string sessionHash,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"session_mapping_{sessionHash}";

        if (memoryCache.TryGetValue(cacheKey, out string? accountId) && !string.IsNullOrEmpty(accountId))
        {
            return await GetAccountByIdAsync(accountId, cancellationToken);
        }

        return null;
    }

    /// <summary>
    /// 设置会话映射
    /// </summary>
    private async Task SetSessionMappingAsync(string sessionHash, Accounts account,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"session_mapping_{sessionHash}";

        // 设置30分钟的会话映射缓存
        var cacheOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30),
            SlidingExpiration = TimeSpan.FromMinutes(15)
        };

        memoryCache.Set(cacheKey, account.Id, cacheOptions);

        await Task.CompletedTask; // 保持异步一致性
    }

    /// <summary>
    /// 删除会话映射
    /// </summary>
    private async Task DeleteSessionMappingAsync(string sessionHash)
    {
        var cacheKey = $"session_mapping_{sessionHash}";
        memoryCache.Remove(cacheKey);

        await Task.CompletedTask; // 保持异步一致性
    }

    /// <summary>
    /// 获取有效的访问令牌
    /// </summary>
    /// <param name="account">账户信息</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>有效的访问令牌</returns>
    public async Task<string> GetValidAccessTokenAsync(Accounts account, CancellationToken cancellationToken = default)
    {
        try
        {
            // 如果是Claude官方OAuth账户
            if (account is { Platform: "claude", ClaudeAiOauth: not null })
            {
                var oauth = account.ClaudeAiOauth;

                // 检查访问令牌是否即将过期（提前5分钟刷新）
                if (oauth.ExpiresAt > 0)
                {
                    var now = DateTimeOffset.Now.ToUnixTimeSeconds();
                    // 检查ExpiresAt是否在有效范围内（毫秒时间戳）
                    var isExpired = oauth.ExpiresAt == 0 ||
                                    (oauth.ExpiresAt > 0 && now >= (oauth.ExpiresAt - 60)); // 60秒提前刷新
                    if (isExpired)
                    {
                        logger.LogInformation("🔄 访问令牌即将过期，尝试刷新 for account {AccountId}", account.Id);

                        try
                        {
                            // 实现token刷新逻辑
                            var refreshedToken = await RefreshClaudeOAuthTokenAsync(account, cancellationToken);
                            if (!string.IsNullOrEmpty(refreshedToken))
                            {
                                logger.LogInformation("✅ 成功刷新访问令牌 for account {AccountId}", account.Id);
                                return refreshedToken;
                            }
                        }
                        catch (Exception refreshError)
                        {
                            logger.LogWarning("⚠️ Token刷新失败，使用现有token for account {AccountId}: {Error}",
                                account.Id, refreshError.Message);
                        }
                    }
                }

                if (!string.IsNullOrEmpty(oauth.AccessToken))
                {
                    // 更新最后使用时间
                    await UpdateAccountLastUsedAsync(account.Id, cancellationToken);
                    return oauth.AccessToken;
                }
            }

            // 如果是Claude Console账户
            if (account.Platform == "claude-console" && !string.IsNullOrEmpty(account.ApiKey))
            {
                // 更新最后使用时间
                await UpdateAccountLastUsedAsync(account.Id, cancellationToken);
                return account.ApiKey;
            }

            // 如果是Gemini账户
            if (account.Platform == "gemini" && !string.IsNullOrEmpty(account.ApiKey))
            {
                // 更新最后使用时间
                await UpdateAccountLastUsedAsync(account.Id, cancellationToken);
                return account.ApiKey;
            }

            if (account.Platform == "openai" && !string.IsNullOrEmpty(account.ApiKey))
            {
                // 更新最后使用时间
                await UpdateAccountLastUsedAsync(account.Id, cancellationToken);
                return account.ApiKey;
            }

            // 如果是Thor账户
            if (account.Platform == "thor" && !string.IsNullOrEmpty(account.ApiKey))
            {
                // 更新最后使用时间
                await UpdateAccountLastUsedAsync(account.Id, cancellationToken);
                return account.ApiKey;
            }

            throw new InvalidOperationException($"无法为账户 {account.Id} ({account.Platform}) 获取有效的访问令牌");
        }
        catch (Exception ex)
        {
            logger.LogError("❌ 获取访问令牌失败 for account {AccountId}: {Error}", account.Id, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// 刷新Claude OAuth访问令牌
    /// </summary>
    private async Task<string> RefreshClaudeOAuthTokenAsync(Accounts account,
        CancellationToken cancellationToken = default)
    {
        if (account.ClaudeAiOauth?.RefreshToken == null)
        {
            throw new InvalidOperationException("没有可用的刷新令牌");
        }

        try
        {
            using var httpClient = new HttpClient();

            // 设置请求头
            httpClient.DefaultRequestHeaders.Add("User-Agent", "claude-cli/1.0.65 (external, cli)");
            httpClient.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
            httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
            httpClient.DefaultRequestHeaders.Add("Referer", "https://claude.ai/");
            httpClient.DefaultRequestHeaders.Add("Origin", "https://claude.ai");

            var requestData = new
            {
                grant_type = "refresh_token",
                refresh_token = account.ClaudeAiOauth.RefreshToken,
                client_id = "9d1c250a-e61b-44d9-88ed-5944d1962f5e" // Claude OAuth客户端ID
            };

            var json = JsonSerializer.Serialize(requestData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("https://console.anthropic.com/v1/oauth/token", content,
                cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                if (tokenResponse.TryGetProperty("access_token", out var accessTokenElement) &&
                    tokenResponse.TryGetProperty("refresh_token", out var refreshTokenElement) &&
                    tokenResponse.TryGetProperty("expires_in", out var expiresInElement))
                {
                    var newAccessToken = accessTokenElement.GetString();
                    var newRefreshToken = refreshTokenElement.GetString();
                    var expiresIn = expiresInElement.GetInt64();

                    // 更新数据库中的OAuth信息
                    account.ClaudeAiOauth.AccessToken = newAccessToken;
                    account.ClaudeAiOauth.RefreshToken = newRefreshToken;
                    account.ClaudeAiOauth.ExpiresAt = DateTimeOffset.Now.AddSeconds(expiresIn).ToUnixTimeSeconds();

                    context.Accounts.Where(x => x.Id == account.Id)
                        .ExecuteUpdateAsync(x => x.SetProperty(a => a.ClaudeAiOauth, account.ClaudeAiOauth)
                                .SetProperty(x => x.ModifiedAt, DateTime.Now)
                                .SetProperty(x => x.LastUsedAt, DateTime.Now)
                                .SetProperty(x => x.ClaudeAiOauth, account.ClaudeAiOauth)
                                .SetProperty(x => x.UsageCount, x => x.UsageCount + 1),
                            cancellationToken);

                    logger.LogInformation("🔄 成功刷新Claude OAuth令牌 for account {AccountId}", account.Id);
                    return newAccessToken;
                }
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("❌ Claude OAuth令牌刷新失败，状态码: {StatusCode}, 响应: {Response}",
                    response.StatusCode, errorContent);
                throw new HttpRequestException($"令牌刷新失败: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError("❌ 刷新Claude OAuth令牌时发生异常 for account {AccountId}: {Error}", account.Id, ex.Message);
            throw;
        }

        return null;
    }

    /// <summary>
    /// 更新账户最后使用时间
    /// </summary>
    private async Task UpdateAccountLastUsedAsync(string accountId, CancellationToken cancellationToken = default)
    {
        await context.Accounts.Where(x => x.Id == accountId)
            .ExecuteUpdateAsync(x => x.SetProperty(a => a.LastUsedAt, DateTime.Now)
                .SetProperty(a => a.UsageCount, a => a.UsageCount + 1)
                .SetProperty(a => a.ModifiedAt, DateTime.Now), cancellationToken);
    }

    #region 权限控制相关的数据传输对象

    /// <summary>
    /// 账户池健康状态统计
    /// </summary>
    public class AccountPoolHealthStats
    {
        public string PoolGroup { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public int TotalAccounts { get; set; }
        public int EnabledAccounts { get; set; }
        public int ActiveAccounts { get; set; }
        public int RateLimitedAccounts { get; set; }
        public int ErrorAccounts { get; set; }
        public double AverageUsageCount { get; set; }
        public DateTime LastCheckedAt { get; set; }
        
        public double HealthScore => TotalAccounts > 0 ? (double)ActiveAccounts / TotalAccounts : 0.0;
        public bool IsHealthy => HealthScore >= 0.5; // 50%以上的账户可用认为健康
    }

    /// <summary>
    /// 权限验证结果
    /// </summary>
    public class PermissionValidationResult
    {
        public Guid ApiKeyId { get; set; }
        public bool IsValid { get; set; }
        public bool ValidationPerformed { get; set; }
        public int TotalPermissions { get; set; }
        public int EffectivePermissions { get; set; }
        public int DisabledPermissions { get; set; }
        public int IneffectivePermissions { get; set; }
        public List<string> ValidationMessages { get; set; } = new();
        public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
    }

    #endregion
}

﻿using ClaudeCodeProxy.Domain;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.Core;

public interface IContext
{
    DbSet<Accounts> Accounts { get; set; }

    DbSet<ApiKey> ApiKeys { get; set; }
    
    DbSet<ApiKeyGroup> ApiKeyGroups { get; set; }
    
    DbSet<ApiKeyGroupMapping> ApiKeyGroupMappings { get; set; }
    
    DbSet<ApiKeyAccountPoolPermission> ApiKeyAccountPoolPermissions { get; set; }
    
    public DbSet<RequestLog> RequestLogs { get; set; }
    
    public DbSet<StatisticsSnapshot> StatisticsSnapshots { get; set; }
    
    public DbSet<ModelPricing> ModelPricings { get; set; }
    
    public DbSet<User> Users { get; set; }
    
    public DbSet<Role> Roles { get; set; }
    
    public DbSet<UserLoginHistory> UserLoginHistories { get; set; }
    
    public DbSet<Wallet> Wallets { get; set; }
    
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    
    public DbSet<RedeemCode> RedeemCodes { get; set; }
    
    public DbSet<InvitationRecord> InvitationRecords { get; set; }
    
    public DbSet<InvitationSettings> InvitationSettings { get; set; }

    /// <summary>
    /// 保存上下文数据
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task SaveAsync(CancellationToken cancellationToken = default);

    Task MigrateAsync();
}
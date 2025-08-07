using System.Security.Claims;
using System.Text.Json;
using ClaudeCodeProxy.Domain;
using Microsoft.EntityFrameworkCore;

namespace ClaudeCodeProxy.Core;

public class MasterDbContext<TDbContext>(DbContextOptions<TDbContext> options)
    : DbContext(options), IContext where TDbContext : DbContext
{
    public DbSet<Accounts> Accounts { get; set; }
    public DbSet<ApiKey> ApiKeys { get; set; }
    public DbSet<ApiKeyGroup> ApiKeyGroups { get; set; }
    public DbSet<ApiKeyGroupMapping> ApiKeyGroupMappings { get; set; }
    public DbSet<ApiKeyAccountPoolPermission> ApiKeyAccountPoolPermissions { get; set; }
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

    public async Task SaveAsync(CancellationToken cancellationToken = default)
    {
        ProcessAuditableEntities();
        await SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置 ApiKey 实体
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.ToTable("ApiKeys");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.UserId)
                .IsRequired();

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.KeyValue)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.Permissions)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("all");

            entity.Property(e => e.Service)
                .IsRequired()
                .HasMaxLength(50)
                .HasDefaultValue("claude");

            entity.Property(e => e.Model)
                .HasMaxLength(100);

            // 账户关联字段
            entity.Property(e => e.ClaudeAccountId)
                .HasMaxLength(100);

            entity.Property(e => e.ClaudeConsoleAccountId)
                .HasMaxLength(100);

            entity.Property(e => e.GeminiAccountId)
                .HasMaxLength(100);

            // 数值类型配置
            entity.Property(e => e.ConcurrencyLimit)
                .HasDefaultValue(0);

            entity.Property(e => e.DailyCostLimit)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.TotalCost)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.TotalUsageCount)
                .HasDefaultValue(0L);

            // 布尔类型配置
            entity.Property(e => e.EnableModelRestriction)
                .HasDefaultValue(false);

            entity.Property(e => e.EnableClientRestriction)
                .HasDefaultValue(false);

            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // JSON 字段配置
            entity.Property(e => e.Tags)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.RestrictedModels)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.AllowedClients)
                .HasConversion(
                    v => v == null ? null : string.Join(',', v),
                    v => v == null ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            // 分组相关字段配置
            entity.Property(e => e.GroupIds)
                .HasConversion(
                    v => v == null || v.Count == 0 ? null : string.Join(',', v.Select(g => g.ToString())),
                    v => v == null || string.IsNullOrEmpty(v) ? new List<Guid>() : v.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Guid.Parse).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.IsGroupManaged)
                .HasDefaultValue(false);

            entity.Property(e => e.GroupPriority)
                .HasDefaultValue(50);

            entity.Property(e => e.GroupWeight)
                .HasDefaultValue(1);

            entity.Property(e => e.GroupOrder)
                .HasDefaultValue(0);

            entity.Property(e => e.IsGroupPrimary)
                .HasDefaultValue(false);

            entity.Property(e => e.GroupHealthStatus)
                .HasMaxLength(20)
                .HasDefaultValue("unknown");

            // 分组统计字段配置
            entity.Property(e => e.GroupUsageCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.GroupSuccessfulRequests)
                .HasDefaultValue(0L);

            entity.Property(e => e.GroupFailedRequests)
                .HasDefaultValue(0L);

            entity.Property(e => e.GroupTotalCost)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.GroupAverageResponseTime)
                .HasDefaultValue(0);

            entity.Property(e => e.GroupConsecutiveFailures)
                .HasDefaultValue(0);

            entity.Property(e => e.GroupCurrentConnections)
                .HasDefaultValue(0);

            // 分组时间字段配置
            entity.Property(e => e.GroupLastUsedAt)
                .HasColumnType("datetime");

            entity.Property(e => e.GroupLastHealthCheckAt)
                .HasColumnType("datetime");

            entity.Property(e => e.GroupDisabledUntil)
                .HasColumnType("datetime");

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.User)
                .WithMany(u => u.ApiKeys)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 与请求日志的一对多关系
            entity.HasMany(e => e.RequestLogs)
                .WithOne(r => r.ApiKey)
                .HasForeignKey(r => r.ApiKeyId)
                .OnDelete(DeleteBehavior.Cascade);

            // 索引配置
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_ApiKeys_UserId");

            entity.HasIndex(e => e.Name)
                .HasDatabaseName("IX_ApiKeys_Name");

            entity.HasIndex(e => e.Service)
                .HasDatabaseName("IX_ApiKeys_Service");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_ApiKeys_IsEnabled");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_ApiKeys_CreatedAt");

            // 分组相关索引
            entity.HasIndex(e => e.IsGroupManaged)
                .HasDatabaseName("IX_ApiKeys_IsGroupManaged");

            entity.HasIndex(e => e.GroupPriority)
                .HasDatabaseName("IX_ApiKeys_GroupPriority");

            entity.HasIndex(e => e.GroupWeight)
                .HasDatabaseName("IX_ApiKeys_GroupWeight");

            entity.HasIndex(e => e.GroupHealthStatus)
                .HasDatabaseName("IX_ApiKeys_GroupHealthStatus");

            entity.HasIndex(e => e.IsGroupPrimary)
                .HasDatabaseName("IX_ApiKeys_IsGroupPrimary");

            // 分组复合索引
            entity.HasIndex(e => new { e.IsGroupManaged, e.IsEnabled, e.GroupHealthStatus })
                .HasDatabaseName("IX_ApiKeys_IsGroupManaged_IsEnabled_GroupHealthStatus");

            entity.HasIndex(e => new { e.IsGroupManaged, e.GroupPriority, e.GroupWeight })
                .HasDatabaseName("IX_ApiKeys_IsGroupManaged_GroupPriority_GroupWeight");
        });

        // 配置 Accounts 实体
        modelBuilder.Entity<Accounts>(entity =>
        {
            entity.ToTable("Accounts");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.Id)
                .HasMaxLength(100);

            entity.Property(e => e.Platform)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.AccountType)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("shared");

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("active");

            // 数值类型配置
            entity.Property(e => e.Priority)
                .HasDefaultValue(50);

            entity.Property(e => e.RateLimitDuration)
                .HasDefaultValue(60);

            entity.Property(e => e.UsageCount)
                .HasDefaultValue(0L);

            // 账号池相关字段配置
            entity.Property(e => e.PoolGroup)
                .HasMaxLength(100);

            entity.Property(e => e.Tags)
                .HasConversion(
                    v => v == null || v.Count == 0 ? null : string.Join(',', v),
                    v => string.IsNullOrEmpty(v) ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.Weight)
                .HasDefaultValue(1);

            entity.Property(e => e.MaxConcurrency)
                .HasDefaultValue(10);

            // 平台特定字段
            entity.Property(e => e.ProjectId)
                .HasMaxLength(100);

            entity.Property(e => e.ApiUrl)
                .HasMaxLength(500);

            entity.Property(e => e.ApiKey)
                .HasMaxLength(500);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            // JSON 配置字段
            entity.Property(e => e.SupportedModels)
                .HasConversion(
                    v => v == null || v.Count == 0
                        ? null
                        : JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                    v => string.IsNullOrEmpty(v)
                        ? null
                        : JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions()))
                .HasColumnType("TEXT");

            entity.Property(e => e.ClaudeAiOauth)
                .HasConversion(
                    v => v == null
                        ? null
                        : JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                    v => v == null
                        ? null
                        : JsonSerializer.Deserialize<ClaudeAiOauth>(v,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }))
                .HasColumnType("TEXT");

            entity.Property(e => e.GeminiOauth)
                .HasColumnType("TEXT");

            entity.Property(e => e.Proxy)
                .HasConversion(
                    v => v == null
                        ? null
                        : JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                    v => v == null
                        ? null
                        : JsonSerializer.Deserialize<ProxyConfig>(v,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }))
                .HasColumnType("TEXT");

            entity.Property(e => e.LastError)
                .HasMaxLength(2000);

            // 布尔类型配置
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.Platform)
                .HasDatabaseName("IX_Accounts_Platform");

            entity.HasIndex(e => e.Name)
                .HasDatabaseName("IX_Accounts_Name");

            entity.HasIndex(e => e.AccountType)
                .HasDatabaseName("IX_Accounts_AccountType");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_Accounts_Status");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_Accounts_IsEnabled");

            entity.HasIndex(e => e.Priority)
                .HasDatabaseName("IX_Accounts_Priority");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_Accounts_CreatedAt");

            // 复合索引
            entity.HasIndex(e => new { e.Platform, e.IsEnabled, e.Status })
                .HasDatabaseName("IX_Accounts_Platform_IsEnabled_Status");
                
            // 账号池分组索引
            entity.HasIndex(e => e.PoolGroup)
                .HasDatabaseName("IX_Accounts_PoolGroup");
                
            entity.HasIndex(e => new { e.PoolGroup, e.Platform, e.IsEnabled })
                .HasDatabaseName("IX_Accounts_PoolGroup_Platform_IsEnabled");
                
            entity.HasIndex(e => new { e.PoolGroup, e.Weight })
                .HasDatabaseName("IX_Accounts_PoolGroup_Weight");
        });

        // 配置 RequestLog 实体
        modelBuilder.Entity<RequestLog>(entity =>
        {
            entity.ToTable("RequestLogs");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.UserId)
                .IsRequired();

            entity.Property(e => e.ApiKeyId)
                .IsRequired();

            entity.Property(e => e.ApiKeyName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.AccountId)
                .HasMaxLength(100);

            entity.Property(e => e.AccountName)
                .HasMaxLength(200);

            entity.Property(e => e.Model)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.RequestStartTime)
                .IsRequired();

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("success");

            entity.Property(e => e.ErrorMessage)
                .HasMaxLength(2000);

            entity.Property(e => e.Platform)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("claude");

            entity.Property(e => e.ClientIp)
                .HasMaxLength(45); // IPv6最大长度

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            entity.Property(e => e.RequestId)
                .HasMaxLength(100);

            entity.Property(e => e.Metadata)
                .HasColumnType("TEXT");

            // 数值类型配置
            entity.Property(e => e.InputTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.OutputTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.CacheCreateTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.CacheReadTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.TotalTokens)
                .HasDefaultValue(0);

            entity.Property(e => e.Cost)
                .HasColumnType("decimal(18,6)")
                .HasDefaultValue(0m);

            entity.Property(e => e.IsStreaming)
                .HasDefaultValue(false);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.User)
                .WithMany(u => u.RequestLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ApiKey)
                .WithMany(a => a.RequestLogs)
                .HasForeignKey(e => e.ApiKeyId)
                .OnDelete(DeleteBehavior.Cascade);

            // 索引配置
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_RequestLogs_UserId");

            entity.HasIndex(e => e.ApiKeyId)
                .HasDatabaseName("IX_RequestLogs_ApiKeyId");

            entity.HasIndex(e => e.RequestStartTime)
                .HasDatabaseName("IX_RequestLogs_RequestStartTime");

            entity.HasIndex(e => e.RequestDate)
                .HasDatabaseName("IX_RequestLogs_RequestDate");

            entity.HasIndex(e => e.Model)
                .HasDatabaseName("IX_RequestLogs_Model");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_RequestLogs_Status");

            entity.HasIndex(e => e.Platform)
                .HasDatabaseName("IX_RequestLogs_Platform");

            // 复合索引（用于性能优化）
            entity.HasIndex(e => new { e.RequestDate, e.UserId })
                .HasDatabaseName("IX_RequestLogs_RequestDate_UserId");

            entity.HasIndex(e => new { e.RequestDate, e.ApiKeyId })
                .HasDatabaseName("IX_RequestLogs_RequestDate_ApiKeyId");

            entity.HasIndex(e => new { e.RequestDate, e.Model })
                .HasDatabaseName("IX_RequestLogs_RequestDate_Model");

            entity.HasIndex(e => new { e.RequestStartTime, e.RequestHour })
                .HasDatabaseName("IX_RequestLogs_RequestStartTime_RequestHour");
        });

        // 配置 StatisticsSnapshot 实体
        modelBuilder.Entity<StatisticsSnapshot>(entity =>
        {
            entity.ToTable("StatisticsSnapshots");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.SnapshotType)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.SnapshotDate)
                .IsRequired();

            entity.Property(e => e.Model)
                .HasMaxLength(100);

            // 数值类型配置
            entity.Property(e => e.RequestCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.SuccessfulRequestCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.FailedRequestCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.InputTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.OutputTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.CacheCreateTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.CacheReadTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.TotalTokens)
                .HasDefaultValue(0L);

            entity.Property(e => e.TotalCost)
                .HasColumnType("decimal(18,6)")
                .HasDefaultValue(0m);

            entity.Property(e => e.Version)
                .HasDefaultValue(1L);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.User)
                .WithMany(u => u.StatisticsSnapshots)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ApiKey)
                .WithMany()
                .HasForeignKey(e => e.ApiKeyId)
                .OnDelete(DeleteBehavior.SetNull);

            // 索引配置
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_StatisticsSnapshots_UserId");

            entity.HasIndex(e => e.SnapshotType)
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType");

            entity.HasIndex(e => e.SnapshotDate)
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotDate");

            entity.HasIndex(e => e.ApiKeyId)
                .HasDatabaseName("IX_StatisticsSnapshots_ApiKeyId");

            entity.HasIndex(e => e.Model)
                .HasDatabaseName("IX_StatisticsSnapshots_Model");

            // 复合索引（用于性能优化）
            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.UserId })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_UserId");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.SnapshotHour })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_SnapshotHour");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.ApiKeyId })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_ApiKeyId");

            entity.HasIndex(e => new { e.SnapshotType, e.SnapshotDate, e.Model })
                .HasDatabaseName("IX_StatisticsSnapshots_SnapshotType_SnapshotDate_Model");
        });

        // 配置 ModelPricing 实体
        modelBuilder.Entity<ModelPricing>(entity =>
        {
            entity.ToTable("ModelPricings");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.Model)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.InputPrice)
                .HasColumnType("decimal(18,9)")
                .IsRequired();

            entity.Property(e => e.OutputPrice)
                .HasColumnType("decimal(18,9)")
                .IsRequired();

            entity.Property(e => e.CacheWritePrice)
                .HasColumnType("decimal(18,9)")
                .HasDefaultValue(0m);

            entity.Property(e => e.CacheReadPrice)
                .HasColumnType("decimal(18,9)")
                .HasDefaultValue(0m);

            entity.Property(e => e.Currency)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("USD");

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.Model)
                .IsUnique()
                .HasDatabaseName("IX_ModelPricings_Model");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_ModelPricings_IsEnabled");

            entity.HasIndex(e => e.Currency)
                .HasDatabaseName("IX_ModelPricings_Currency");
        });

<<<<<<< HEAD
        // 配置 ApiKeyGroup 实体
        modelBuilder.Entity<ApiKeyGroup>(entity =>
        {
            entity.ToTable("ApiKeyGroups");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Description)
                .HasMaxLength(1000);

            entity.Property(e => e.GroupType)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("custom");

            // JSON 字段配置
            entity.Property(e => e.Tags)
                .HasConversion(
                    v => v == null || v.Count == 0 ? null : string.Join(',', v),
                    v => string.IsNullOrEmpty(v) ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
                .HasMaxLength(2000);

            entity.Property(e => e.Statistics)
                .HasConversion(
                    v => v == null ? null : System.Text.Json.JsonSerializer.Serialize(v, new System.Text.Json.JsonSerializerOptions { WriteIndented = false }),
                    v => v == null ? null : System.Text.Json.JsonSerializer.Deserialize<GroupStatistics>(v, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }))
                .HasColumnType("TEXT");

            // 数值类型配置
            entity.Property(e => e.Priority)
                .HasDefaultValue(50);

            entity.Property(e => e.GroupCostLimit)
                .HasColumnType("decimal(18,4)");

            entity.Property(e => e.GroupRequestLimit)
                .HasDefaultValue(0L);

            entity.Property(e => e.HealthCheckInterval)
                .HasDefaultValue(30);

            entity.Property(e => e.ApiKeyCount)
                .HasDefaultValue(0);

            entity.Property(e => e.CurrentRoundRobinIndex)
                .HasDefaultValue(0);

            // 字符串类型配置
            entity.Property(e => e.LoadBalanceStrategy)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("round_robin");

            entity.Property(e => e.FailoverStrategy)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("failover");

            entity.Property(e => e.HealthStatus)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("unknown");

            // 布尔类型配置
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // 日期时间类型配置
            entity.Property(e => e.LastHealthCheckAt)
                .HasColumnType("datetime");

=======
        // 配置 Role 实体
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Description)
                .HasMaxLength(200);

            entity.Property(e => e.IsSystem)
                .HasDefaultValue(false);

            entity.Property(e => e.Permissions)
                .IsRequired()
                .HasConversion(
                    v => v == null
                        ? "[]"
                        : JsonSerializer.Serialize(v, JsonSerializerOptions.Web),
                    v => string.IsNullOrEmpty(v)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(v,JsonSerializerOptions.Web))
                .HasColumnType("TEXT");

>>>>>>> upstream/main
            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.Name)
<<<<<<< HEAD
                .HasDatabaseName("IX_ApiKeyGroups_Name");

            entity.HasIndex(e => e.GroupType)
                .HasDatabaseName("IX_ApiKeyGroups_GroupType");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_ApiKeyGroups_IsEnabled");

            entity.HasIndex(e => e.Priority)
                .HasDatabaseName("IX_ApiKeyGroups_Priority");

            entity.HasIndex(e => e.HealthStatus)
                .HasDatabaseName("IX_ApiKeyGroups_HealthStatus");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_ApiKeyGroups_CreatedAt");

            // 复合索引
            entity.HasIndex(e => new { e.GroupType, e.IsEnabled, e.HealthStatus })
                .HasDatabaseName("IX_ApiKeyGroups_GroupType_IsEnabled_HealthStatus");

            entity.HasIndex(e => new { e.IsEnabled, e.Priority })
                .HasDatabaseName("IX_ApiKeyGroups_IsEnabled_Priority");
        });

        // 配置 ApiKeyGroupMapping 实体
        modelBuilder.Entity<ApiKeyGroupMapping>(entity =>
        {
            entity.ToTable("ApiKeyGroupMappings");
            entity.HasKey(e => e.Id);

            // 外键配置
            entity.Property(e => e.ApiKeyId)
                .IsRequired();

            entity.Property(e => e.GroupId)
                .IsRequired();

            // 数值类型配置
            entity.Property(e => e.Weight)
                .HasDefaultValue(1);

            entity.Property(e => e.Order)
                .HasDefaultValue(0);

            entity.Property(e => e.CurrentConnections)
                .HasDefaultValue(0);

            entity.Property(e => e.TotalUsageCount)
                .HasDefaultValue(0L);

            entity.Property(e => e.SuccessfulRequests)
                .HasDefaultValue(0L);

            entity.Property(e => e.FailedRequests)
                .HasDefaultValue(0L);

            entity.Property(e => e.AverageResponseTime)
                .HasDefaultValue(0);

            entity.Property(e => e.ConsecutiveFailures)
                .HasDefaultValue(0);

            // 布尔类型配置
            entity.Property(e => e.IsPrimary)
=======
                .IsUnique()
                .HasDatabaseName("IX_Roles_Name");

            entity.HasIndex(e => e.IsSystem)
                .HasDatabaseName("IX_Roles_IsSystem");
        });

        // 配置 User 实体
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255);

            entity.Property(e => e.FirstName)
                .HasMaxLength(50);

            entity.Property(e => e.LastName)
                .HasMaxLength(50);

            entity.Property(e => e.Avatar)
                .HasMaxLength(200);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.EmailConfirmed)
                .HasDefaultValue(false);

            entity.Property(e => e.Provider)
                .HasMaxLength(50);

            entity.Property(e => e.ProviderId)
                .HasMaxLength(100);

            // 邀请系统相关字段
            entity.Property(e => e.InvitationCode)
                .IsRequired()
                .HasMaxLength(8);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // 与钱包的一对一关系
            entity.HasOne(e => e.Wallet)
                .WithOne(w => w.User)
                .HasForeignKey<Wallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 与API Key的一对多关系
            entity.HasMany(e => e.ApiKeys)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 与请求日志的一对多关系
            entity.HasMany(e => e.RequestLogs)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 与统计快照的一对多关系
            entity.HasMany(e => e.StatisticsSnapshots)
                .WithOne(s => s.User)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // 邀请关系配置
            entity.HasOne(e => e.InvitedByUser)
                .WithMany(u => u.InvitedUsers)
                .HasForeignKey(e => e.InvitedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // 索引配置
            entity.HasIndex(e => e.Username)
                .IsUnique()
                .HasDatabaseName("IX_Users_Username");

            entity.HasIndex(e => e.Email)
                .IsUnique()
                .HasDatabaseName("IX_Users_Email");

            entity.HasIndex(e => new { e.Provider, e.ProviderId })
                .HasDatabaseName("IX_Users_Provider_ProviderId");

            entity.HasIndex(e => e.RoleId)
                .HasDatabaseName("IX_Users_RoleId");

            entity.HasIndex(e => e.IsActive)
                .HasDatabaseName("IX_Users_IsActive");

            entity.HasIndex(e => e.InvitationCode)
                .IsUnique()
                .HasDatabaseName("IX_Users_InvitationCode");

            entity.HasIndex(e => e.InvitedByUserId)
                .HasDatabaseName("IX_Users_InvitedByUserId");
        });

        // 配置 UserLoginHistory 实体
        modelBuilder.Entity<UserLoginHistory>(entity =>
        {
            entity.ToTable("UserLoginHistories");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.LoginType)
                .HasMaxLength(50);

            entity.Property(e => e.IpAddress)
                .HasMaxLength(45);

            entity.Property(e => e.UserAgent)
                .HasMaxLength(500);

            entity.Property(e => e.City)
                .HasMaxLength(50);

            entity.Property(e => e.Country)
                .HasMaxLength(50);

            entity.Property(e => e.Success)
                .HasDefaultValue(true);

            entity.Property(e => e.FailureReason)
                .HasMaxLength(200);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.User)
                .WithMany(u => u.LoginHistories)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 索引配置
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_UserLoginHistories_UserId");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_UserLoginHistories_CreatedAt");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt })
                .HasDatabaseName("IX_UserLoginHistories_UserId_CreatedAt");
        });

        // 配置 Wallet 实体
        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.ToTable("Wallets");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.UserId)
                .IsRequired();

            entity.Property(e => e.Balance)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.TotalUsed)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.TotalRecharged)
                .HasColumnType("decimal(18,4)")
                .HasDefaultValue(0m);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("active");

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.User)
                .WithOne(u => u.Wallet)
                .HasForeignKey<Wallet>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 与钱包交易的一对多关系
            entity.HasMany(e => e.Transactions)
                .WithOne(t => t.Wallet)
                .HasForeignKey(t => t.WalletId)
                .OnDelete(DeleteBehavior.Cascade);

            // 索引配置
            entity.HasIndex(e => e.UserId)
                .IsUnique()
                .HasDatabaseName("IX_Wallets_UserId");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_Wallets_Status");

            entity.HasIndex(e => e.LastUsedAt)
                .HasDatabaseName("IX_Wallets_LastUsedAt");
        });

        // 配置 WalletTransaction 实体
        modelBuilder.Entity<WalletTransaction>(entity =>
        {
            entity.ToTable("WalletTransactions");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.WalletId)
                .IsRequired();

            entity.Property(e => e.TransactionType)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18,4)")
                .IsRequired();

            entity.Property(e => e.BalanceBefore)
                .HasColumnType("decimal(18,4)")
                .IsRequired();

            entity.Property(e => e.BalanceAfter)
                .HasColumnType("decimal(18,4)")
                .IsRequired();

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("completed");

            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50);

            entity.Property(e => e.ExternalTransactionId)
                .HasMaxLength(100);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.Wallet)
                .WithMany(w => w.Transactions)
                .HasForeignKey(e => e.WalletId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.RequestLog)
                .WithOne(r => r.WalletTransaction)
                .HasForeignKey<WalletTransaction>(e => e.RequestLogId)
                .OnDelete(DeleteBehavior.SetNull);

            // 索引配置
            entity.HasIndex(e => e.WalletId)
                .HasDatabaseName("IX_WalletTransactions_WalletId");

            entity.HasIndex(e => e.TransactionType)
                .HasDatabaseName("IX_WalletTransactions_TransactionType");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_WalletTransactions_Status");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_WalletTransactions_CreatedAt");

            entity.HasIndex(e => e.RequestLogId)
                .HasDatabaseName("IX_WalletTransactions_RequestLogId");

            // 复合索引
            entity.HasIndex(e => new { e.WalletId, e.CreatedAt })
                .HasDatabaseName("IX_WalletTransactions_WalletId_CreatedAt");
        });

        // 配置 RedeemCode 实体
        modelBuilder.Entity<RedeemCode>(entity =>
        {
            entity.ToTable("RedeemCodes");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("balance");

            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18,4)")
                .IsRequired();

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.IsUsed)
>>>>>>> upstream/main
                .HasDefaultValue(false);

            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

<<<<<<< HEAD
            // 字符串类型配置
            entity.Property(e => e.HealthStatus)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("unknown");

            // 日期时间类型配置
            entity.Property(e => e.LastUsedAt)
                .HasColumnType("datetime");

            entity.Property(e => e.LastHealthCheckAt)
                .HasColumnType("datetime");

            entity.Property(e => e.DisabledUntil)
                .HasColumnType("datetime");
=======
            entity.Property(e => e.CreatedByUserId)
                .IsRequired();
>>>>>>> upstream/main

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

<<<<<<< HEAD
            // 索引配置
            entity.HasIndex(e => e.ApiKeyId)
                .HasDatabaseName("IX_ApiKeyGroupMappings_ApiKeyId");

            entity.HasIndex(e => e.GroupId)
                .HasDatabaseName("IX_ApiKeyGroupMappings_GroupId");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_ApiKeyGroupMappings_IsEnabled");

            entity.HasIndex(e => e.IsPrimary)
                .HasDatabaseName("IX_ApiKeyGroupMappings_IsPrimary");

            entity.HasIndex(e => e.HealthStatus)
                .HasDatabaseName("IX_ApiKeyGroupMappings_HealthStatus");

            entity.HasIndex(e => e.Weight)
                .HasDatabaseName("IX_ApiKeyGroupMappings_Weight");

            entity.HasIndex(e => e.Order)
                .HasDatabaseName("IX_ApiKeyGroupMappings_Order");

            // 复合索引（用于查询优化）
            entity.HasIndex(e => new { e.GroupId, e.IsEnabled, e.HealthStatus })
                .HasDatabaseName("IX_ApiKeyGroupMappings_GroupId_IsEnabled_HealthStatus");

            entity.HasIndex(e => new { e.ApiKeyId, e.IsEnabled })
                .HasDatabaseName("IX_ApiKeyGroupMappings_ApiKeyId_IsEnabled");

            entity.HasIndex(e => new { e.GroupId, e.Order })
                .HasDatabaseName("IX_ApiKeyGroupMappings_GroupId_Order");

            entity.HasIndex(e => new { e.GroupId, e.IsPrimary })
                .HasDatabaseName("IX_ApiKeyGroupMappings_GroupId_IsPrimary");

            // 关系配置
            entity.HasOne(e => e.ApiKey)
                .WithMany()
                .HasForeignKey(e => e.ApiKeyId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ApiKeyGroupMappings_ApiKeys_ApiKeyId");

            entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ApiKeyGroupMappings_ApiKeyGroups_GroupId");

            // 唯一约束：一个ApiKey在一个Group中只能有一条记录
            entity.HasIndex(e => new { e.ApiKeyId, e.GroupId })
                .IsUnique()
                .HasDatabaseName("UX_ApiKeyGroupMappings_ApiKeyId_GroupId");
        });

        // 配置 ApiKeyAccountPoolPermission 实体
        modelBuilder.Entity<ApiKeyAccountPoolPermission>(entity =>
        {
            entity.ToTable("ApiKeyAccountPoolPermissions");
            entity.HasKey(e => e.Id);

            // 基本属性配置
            entity.Property(e => e.ApiKeyId)
                .IsRequired();

            entity.Property(e => e.AccountPoolGroup)
                .IsRequired()
                .HasMaxLength(100);

            // 数组字段配置
            entity.Property(e => e.AllowedPlatforms)
                .HasConversion(
                    v => v == null || v.Length == 0 ? null : string.Join(',', v),
                    v => string.IsNullOrEmpty(v) ? Array.Empty<string>() : v.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .HasMaxLength(500);

            entity.Property(e => e.AllowedAccountIds)
                .HasConversion(
                    v => v == null || v.Length == 0 ? null : string.Join(',', v),
                    v => string.IsNullOrEmpty(v) ? null : v.Split(',', StringSplitOptions.RemoveEmptyEntries))
                .HasMaxLength(2000);

            // 字符串类型配置
            entity.Property(e => e.SelectionStrategy)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("priority");

            // 数值类型配置
            entity.Property(e => e.Priority)
                .HasDefaultValue(50);

            // 布尔类型配置
            entity.Property(e => e.IsEnabled)
                .HasDefaultValue(true);

            // 日期时间类型配置
            entity.Property(e => e.EffectiveFrom)
                .HasColumnType("datetime");

            entity.Property(e => e.EffectiveTo)
                .HasColumnType("datetime");

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.ApiKeyId)
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_ApiKeyId");

            entity.HasIndex(e => e.AccountPoolGroup)
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_AccountPoolGroup");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_IsEnabled");

            entity.HasIndex(e => e.Priority)
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_Priority");

            entity.HasIndex(e => e.SelectionStrategy)
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_SelectionStrategy");

            // 复合索引（用于查询优化）
            entity.HasIndex(e => new { e.ApiKeyId, e.IsEnabled })
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_ApiKeyId_IsEnabled");

            entity.HasIndex(e => new { e.ApiKeyId, e.Priority, e.IsEnabled })
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_ApiKeyId_Priority_IsEnabled");

            entity.HasIndex(e => new { e.AccountPoolGroup, e.IsEnabled })
                .HasDatabaseName("IX_ApiKeyAccountPoolPermissions_AccountPoolGroup_IsEnabled");

            // 外键关系配置
            entity.HasOne(e => e.ApiKey)
                .WithMany()
                .HasForeignKey(e => e.ApiKeyId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ApiKeyAccountPoolPermissions_ApiKeys_ApiKeyId");

            // 唯一约束：一个API Key对一个账号池分组只能有一条权限记录
            entity.HasIndex(e => new { e.ApiKeyId, e.AccountPoolGroup })
                .IsUnique()
                .HasDatabaseName("UX_ApiKeyAccountPoolPermissions_ApiKeyId_AccountPoolGroup");
=======
            // 外键关系配置
            entity.HasOne(e => e.UsedByUser)
                .WithMany()
                .HasForeignKey(e => e.UsedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // 索引配置
            entity.HasIndex(e => e.Code)
                .IsUnique()
                .HasDatabaseName("IX_RedeemCodes_Code");

            entity.HasIndex(e => e.Type)
                .HasDatabaseName("IX_RedeemCodes_Type");

            entity.HasIndex(e => e.IsUsed)
                .HasDatabaseName("IX_RedeemCodes_IsUsed");

            entity.HasIndex(e => e.IsEnabled)
                .HasDatabaseName("IX_RedeemCodes_IsEnabled");

            entity.HasIndex(e => e.CreatedByUserId)
                .HasDatabaseName("IX_RedeemCodes_CreatedByUserId");

            entity.HasIndex(e => e.UsedByUserId)
                .HasDatabaseName("IX_RedeemCodes_UsedByUserId");

            entity.HasIndex(e => e.ExpiresAt)
                .HasDatabaseName("IX_RedeemCodes_ExpiresAt");

            // 复合索引
            entity.HasIndex(e => new { e.IsUsed, e.IsEnabled, e.ExpiresAt })
                .HasDatabaseName("IX_RedeemCodes_IsUsed_IsEnabled_ExpiresAt");
        });

        // 配置 InvitationRecord 实体
        modelBuilder.Entity<InvitationRecord>(entity =>
        {
            entity.ToTable("InvitationRecords");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.InviterUserId)
                .IsRequired();

            entity.Property(e => e.InvitedUserId)
                .IsRequired();

            entity.Property(e => e.InvitationCode)
                .IsRequired()
                .HasMaxLength(8);

            entity.Property(e => e.InviterReward)
                .HasColumnType("decimal(18,4)")
                .IsRequired();

            entity.Property(e => e.InvitedReward)
                .HasColumnType("decimal(18,4)")
                .IsRequired();

            entity.Property(e => e.InvitedAt)
                .IsRequired();

            entity.Property(e => e.RewardProcessed)
                .HasDefaultValue(false);

            entity.Property(e => e.Notes)
                .HasMaxLength(200);

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 外键关系配置
            entity.HasOne(e => e.InviterUser)
                .WithMany()
                .HasForeignKey(e => e.InviterUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.InvitedUser)
                .WithMany()
                .HasForeignKey(e => e.InvitedUserId)
                .OnDelete(DeleteBehavior.Cascade);

            // 索引配置
            entity.HasIndex(e => e.InviterUserId)
                .HasDatabaseName("IX_InvitationRecords_InviterUserId");

            entity.HasIndex(e => e.InvitedUserId)
                .HasDatabaseName("IX_InvitationRecords_InvitedUserId");

            entity.HasIndex(e => e.InvitationCode)
                .HasDatabaseName("IX_InvitationRecords_InvitationCode");

            entity.HasIndex(e => e.InvitedAt)
                .HasDatabaseName("IX_InvitationRecords_InvitedAt");

            entity.HasIndex(e => e.RewardProcessed)
                .HasDatabaseName("IX_InvitationRecords_RewardProcessed");

            // 复合索引
            entity.HasIndex(e => new { e.InviterUserId, e.InvitedAt })
                .HasDatabaseName("IX_InvitationRecords_InviterUserId_InvitedAt");
        });

        // 配置 InvitationSettings 实体
        modelBuilder.Entity<InvitationSettings>(entity =>
        {
            entity.ToTable("InvitationSettings");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Key)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Value)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasMaxLength(200);

            entity.Property(e => e.UpdatedAt)
                .IsRequired();

            // 审计字段配置
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CreatedBy)
                .HasMaxLength(100);

            entity.Property(e => e.ModifiedBy)
                .HasMaxLength(100);

            // 索引配置
            entity.HasIndex(e => e.Key)
                .IsUnique()
                .HasDatabaseName("IX_InvitationSettings_Key");
>>>>>>> upstream/main
        });
    }

    public async Task MigrateAsync()
    {
        await base.Database.MigrateAsync();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ProcessAuditableEntities();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ProcessAuditableEntities();
        return base.SaveChanges();
    }

    private void ProcessAuditableEntities()
    {
        var currentUser = string.Empty;
        var currentTime = DateTime.Now;

        var auditableEntries = ChangeTracker.Entries<IAuditable>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in auditableEntries)
        {
            var entity = entry.Entity;

            switch (entry.State)
            {
                case EntityState.Added:
                    entity.CreatedAt = currentTime;
                    entity.CreatedBy = currentUser;
                    break;
                case EntityState.Modified:
                    entity.ModifiedAt = currentTime;
                    entity.ModifiedBy = currentUser;

                    // 确保创建时间和创建者不被修改
                    entry.Property(nameof(entity.CreatedAt)).IsModified = false;
                    entry.Property(nameof(entity.CreatedBy)).IsModified = false;
                    break;
            }
        }
    }
}
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace ClaudeCodeProxy.Host.Services;

/// <summary>
/// 数据库架构修复服务，处理数据库表结构与代码模型不同步的问题
/// </summary>
public class DatabaseSchemaFixService
{
    private readonly ILogger<DatabaseSchemaFixService> _logger;
    private readonly IConfiguration _configuration;

    public DatabaseSchemaFixService(ILogger<DatabaseSchemaFixService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// 修复数据库架构，添加缺失的列
    /// </summary>
    public async Task FixDatabaseSchemaAsync()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            _logger.LogWarning("未找到数据库连接字符串");
            return;
        }

        try
        {
            using var connection = new SqliteConnection(connectionString);
            await connection.OpenAsync();
            
            _logger.LogInformation("开始检查和修复数据库架构...");
            
            // 修复 ApiKeys 表
            await FixApiKeysTableAsync(connection);
            
            // 修复 Accounts 表
            await FixAccountsTableAsync(connection);
            
            _logger.LogInformation("数据库架构修复完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "数据库架构修复失败");
        }
    }

    /// <summary>
    /// 修复 ApiKeys 表结构
    /// </summary>
    private async Task FixApiKeysTableAsync(SqliteConnection connection)
    {
        var missingColumns = new Dictionary<string, string>
        {
            {"UserId", "TEXT"},
            {"GroupAverageResponseTime", "REAL DEFAULT 0.0"},
            {"GroupTotalCost", "decimal(18,4) DEFAULT 0.0"},
            {"GroupConsecutiveFailures", "INTEGER DEFAULT 0"},
            {"GroupCurrentConnections", "INTEGER DEFAULT 0"},
            {"GroupLastUsedAt", "TEXT"},
            {"GroupLastHealthCheckAt", "TEXT"},
            {"GroupDisabledUntil", "TEXT"}
        };

        await AddMissingColumnsAsync(connection, "ApiKeys", missingColumns);
    }

    /// <summary>
    /// 修复 Accounts 表结构
    /// </summary>
    private async Task FixAccountsTableAsync(SqliteConnection connection)
    {
        var missingColumns = new Dictionary<string, string>
        {
            {"MaxConcurrency", "INTEGER DEFAULT 10"},
            {"PoolGroup", "TEXT"},
            {"Tags", "TEXT"},
            {"Weight", "INTEGER DEFAULT 1"}
        };

        await AddMissingColumnsAsync(connection, "Accounts", missingColumns);
    }

    /// <summary>
    /// 添加缺失的列到指定表
    /// </summary>
    private async Task AddMissingColumnsAsync(SqliteConnection connection, string tableName, Dictionary<string, string> columns)
    {
        foreach (var (columnName, columnDefinition) in columns)
        {
            try
            {
                // 检查列是否存在
                var checkColumnQuery = $"PRAGMA table_info({tableName})";
                var columnExists = false;

                using var checkCommand = new SqliteCommand(checkColumnQuery, connection);
                using var reader = await checkCommand.ExecuteReaderAsync();
                
                while (await reader.ReadAsync())
                {
                    var existingColumnName = reader.GetString(1); // 列名在索引1位置
                    if (existingColumnName.Equals(columnName, StringComparison.OrdinalIgnoreCase))
                    {
                        columnExists = true;
                        break;
                    }
                }

                // 如果列不存在，则添加
                if (!columnExists)
                {
                    var addColumnQuery = $"ALTER TABLE {tableName} ADD COLUMN {columnName} {columnDefinition}";
                    using var addCommand = new SqliteCommand(addColumnQuery, connection);
                    await addCommand.ExecuteNonQueryAsync();
                    _logger.LogInformation("已添加缺失的列: {TableName}.{ColumnName}", tableName, columnName);
                }
                else
                {
                    _logger.LogDebug("列已存在: {TableName}.{ColumnName}", tableName, columnName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "添加列失败: {TableName}.{ColumnName}", tableName, columnName);
            }
        }
    }
}
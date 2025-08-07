-- 为账号池权限控制添加数据库表和字段的 SQL 迁移脚本
-- 执行时间：请根据实际需要执行

-- 1. 为 Accounts 表添加新字段
ALTER TABLE Accounts ADD COLUMN PoolGroup NVARCHAR(100) NULL;
ALTER TABLE Accounts ADD COLUMN Tags TEXT NULL;
ALTER TABLE Accounts ADD COLUMN Weight INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE Accounts ADD COLUMN MaxConcurrency INTEGER DEFAULT 10 NOT NULL;

-- 2. 创建 API Key 账号池权限表
CREATE TABLE ApiKeyAccountPoolPermissions (
    Id CHAR(36) NOT NULL PRIMARY KEY,
    ApiKeyId CHAR(36) NOT NULL,
    AccountPoolGroup NVARCHAR(100) NOT NULL,
    AllowedPlatforms NVARCHAR(500) NULL,
    AllowedAccountIds TEXT NULL,
    SelectionStrategy NVARCHAR(20) DEFAULT 'priority' NOT NULL,
    Priority INTEGER DEFAULT 50 NOT NULL,
    IsEnabled BOOLEAN DEFAULT 1 NOT NULL,
    EffectiveFrom DATETIME NULL,
    EffectiveTo DATETIME NULL,
    CreatedAt DATETIME NOT NULL,
    CreatedBy NVARCHAR(100) NULL,
    ModifiedAt DATETIME NULL,
    ModifiedBy NVARCHAR(100) NULL,
    
    -- 外键约束
    CONSTRAINT FK_ApiKeyAccountPoolPermissions_ApiKeys_ApiKeyId 
        FOREIGN KEY (ApiKeyId) REFERENCES ApiKeys (Id) ON DELETE CASCADE
);

-- 3. 为 Accounts 表创建新索引
CREATE INDEX IX_Accounts_PoolGroup ON Accounts(PoolGroup);
CREATE INDEX IX_Accounts_PoolGroup_Platform_IsEnabled ON Accounts(PoolGroup, Platform, IsEnabled);
CREATE INDEX IX_Accounts_PoolGroup_Weight ON Accounts(PoolGroup, Weight);

-- 4. 为 ApiKeyAccountPoolPermissions 表创建索引
CREATE INDEX IX_ApiKeyAccountPoolPermissions_ApiKeyId ON ApiKeyAccountPoolPermissions(ApiKeyId);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_AccountPoolGroup ON ApiKeyAccountPoolPermissions(AccountPoolGroup);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_IsEnabled ON ApiKeyAccountPoolPermissions(IsEnabled);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_Priority ON ApiKeyAccountPoolPermissions(Priority);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_SelectionStrategy ON ApiKeyAccountPoolPermissions(SelectionStrategy);

-- 复合索引
CREATE INDEX IX_ApiKeyAccountPoolPermissions_ApiKeyId_IsEnabled ON ApiKeyAccountPoolPermissions(ApiKeyId, IsEnabled);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_ApiKeyId_AccountPoolGroup ON ApiKeyAccountPoolPermissions(ApiKeyId, AccountPoolGroup);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_ApiKeyId_Priority_IsEnabled ON ApiKeyAccountPoolPermissions(ApiKeyId, Priority, IsEnabled);
CREATE INDEX IX_ApiKeyAccountPoolPermissions_AccountPoolGroup_IsEnabled ON ApiKeyAccountPoolPermissions(AccountPoolGroup, IsEnabled);

-- 唯一约束
CREATE UNIQUE INDEX UX_ApiKeyAccountPoolPermissions_ApiKeyId_AccountPoolGroup ON ApiKeyAccountPoolPermissions(ApiKeyId, AccountPoolGroup);

-- 5. 插入示例数据（可选）

-- 创建账号池分组示例
-- UPDATE Accounts SET PoolGroup = 'production' WHERE Platform = 'claude' AND AccountType = 'dedicated';
-- UPDATE Accounts SET PoolGroup = 'development' WHERE Platform = 'claude' AND AccountType = 'shared';
-- UPDATE Accounts SET PoolGroup = 'gemini-pool' WHERE Platform = 'gemini';

-- 为现有 API Key 添加权限示例（请根据实际情况调整）
-- INSERT INTO ApiKeyAccountPoolPermissions (Id, ApiKeyId, AccountPoolGroup, AllowedPlatforms, SelectionStrategy, Priority, IsEnabled, CreatedAt)
-- SELECT 
--     LOWER(HEX(randomblob(4)) || '-' || HEX(randomblob(2)) || '-' || HEX(randomblob(2)) || '-' || HEX(randomblob(2)) || '-' || HEX(randomblob(6))),
--     Id,
--     'production',
--     'claude,claude-console',
--     'priority',
--     50,
--     1,
--     datetime('now')
-- FROM ApiKeys 
-- WHERE Service = 'claude' AND IsEnabled = 1;
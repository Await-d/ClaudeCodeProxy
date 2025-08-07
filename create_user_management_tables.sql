-- User Management System Tables Creation Script
-- This script creates all the missing tables for the user management system

-- Create Roles table
CREATE TABLE IF NOT EXISTS "Roles" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Roles" PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "IsSystem" INTEGER NOT NULL DEFAULT 0,
    "Permissions" TEXT NOT NULL DEFAULT '[]',
    "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TEXT,
    "CreatedBy" TEXT,
    "UpdatedBy" TEXT
);

-- Create Users table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_Users" PRIMARY KEY,
    "Username" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "FirstName" TEXT,
    "LastName" TEXT,
    "Avatar" TEXT,
    "IsActive" INTEGER NOT NULL DEFAULT 1,
    "EmailConfirmed" INTEGER NOT NULL DEFAULT 0,
    "LastLoginAt" TEXT,
    "Provider" TEXT,
    "ProviderId" TEXT,
    "InvitationCode" TEXT NOT NULL DEFAULT '',
    "InvitedByUserId" TEXT,
    "RoleId" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TEXT,
    "CreatedBy" TEXT,
    "UpdatedBy" TEXT,
    CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Users_Users_InvitedByUserId" FOREIGN KEY ("InvitedByUserId") REFERENCES "Users" ("Id") ON DELETE SET NULL
);

-- Create Wallets table  
CREATE TABLE IF NOT EXISTS "Wallets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Wallets" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "Balance" REAL NOT NULL DEFAULT 0,
    "TotalUsed" REAL NOT NULL DEFAULT 0,
    "TotalRecharged" REAL NOT NULL DEFAULT 0,
    "Status" TEXT NOT NULL DEFAULT 'active',
    "LastUsedAt" TEXT,
    "LastRechargedAt" TEXT,
    "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TEXT,
    "CreatedBy" TEXT,
    "UpdatedBy" TEXT,
    CONSTRAINT "FK_Wallets_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Create WalletTransactions table
CREATE TABLE IF NOT EXISTS "WalletTransactions" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_WalletTransactions" PRIMARY KEY AUTOINCREMENT,
    "WalletId" INTEGER NOT NULL,
    "TransactionType" TEXT NOT NULL,
    "Amount" REAL NOT NULL,
    "BalanceBefore" REAL NOT NULL,
    "BalanceAfter" REAL NOT NULL,
    "Description" TEXT NOT NULL,
    "RequestLogId" TEXT,
    "Status" TEXT NOT NULL DEFAULT 'completed',
    "PaymentMethod" TEXT,
    "ExternalTransactionId" TEXT,
    "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TEXT,
    "CreatedBy" TEXT,
    "UpdatedBy" TEXT,
    CONSTRAINT "FK_WalletTransactions_Wallets_WalletId" FOREIGN KEY ("WalletId") REFERENCES "Wallets" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_WalletTransactions_RequestLogs_RequestLogId" FOREIGN KEY ("RequestLogId") REFERENCES "RequestLogs" ("Id") ON DELETE SET NULL
);

-- Create UserLoginHistory table
CREATE TABLE IF NOT EXISTS "UserLoginHistory" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_UserLoginHistory" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "LoginType" TEXT,
    "IpAddress" TEXT,
    "UserAgent" TEXT,
    "City" TEXT,
    "Country" TEXT,
    "Success" INTEGER NOT NULL DEFAULT 1,
    "FailureReason" TEXT,
    "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TEXT,
    "CreatedBy" TEXT,
    "UpdatedBy" TEXT,
    CONSTRAINT "FK_UserLoginHistory_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Create InvitationRecords table
CREATE TABLE IF NOT EXISTS "InvitationRecords" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_InvitationRecords" PRIMARY KEY,
    "InviterUserId" TEXT NOT NULL,
    "InvitedUserId" TEXT NOT NULL,
    "InvitationCode" TEXT NOT NULL,
    "InviterReward" REAL NOT NULL,
    "InvitedReward" REAL NOT NULL,
    "InvitedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RewardProcessed" INTEGER NOT NULL DEFAULT 0,
    "Notes" TEXT,
    "CreatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TEXT,
    "CreatedBy" TEXT,
    "UpdatedBy" TEXT,
    CONSTRAINT "FK_InvitationRecords_Users_InviterUserId" FOREIGN KEY ("InviterUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_InvitationRecords_Users_InvitedUserId" FOREIGN KEY ("InvitedUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX IF NOT EXISTS "IX_Users_RoleId" ON "Users" ("RoleId");
CREATE INDEX IF NOT EXISTS "IX_Users_InvitedByUserId" ON "Users" ("InvitedByUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_InvitationCode" ON "Users" ("InvitationCode");

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Wallets_UserId" ON "Wallets" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_WalletTransactions_WalletId" ON "WalletTransactions" ("WalletId");
CREATE INDEX IF NOT EXISTS "IX_WalletTransactions_RequestLogId" ON "WalletTransactions" ("RequestLogId");

CREATE INDEX IF NOT EXISTS "IX_UserLoginHistory_UserId" ON "UserLoginHistory" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_InvitationRecords_InviterUserId" ON "InvitationRecords" ("InviterUserId");
CREATE INDEX IF NOT EXISTS "IX_InvitationRecords_InvitedUserId" ON "InvitationRecords" ("InvitedUserId");
CREATE INDEX IF NOT EXISTS "IX_InvitationRecords_InvitationCode" ON "InvitationRecords" ("InvitationCode");
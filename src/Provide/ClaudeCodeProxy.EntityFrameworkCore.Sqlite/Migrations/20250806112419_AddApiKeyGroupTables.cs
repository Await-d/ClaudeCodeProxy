using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddApiKeyGroupTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApiKeyGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    GroupType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "custom"),
                    Tags = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    Priority = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 50),
                    GroupCostLimit = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    GroupRequestLimit = table.Column<long>(type: "INTEGER", nullable: true),
                    LoadBalanceStrategy = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "round_robin"),
                    FailoverStrategy = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "failover"),
                    HealthCheckInterval = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 30),
                    ApiKeyCount = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Statistics = table.Column<string>(type: "TEXT", nullable: true),
                    LastHealthCheckAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    HealthStatus = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "unknown"),
                    CurrentRoundRobinIndex = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiKeyGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApiKeyGroupMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ApiKeyId = table.Column<Guid>(type: "TEXT", nullable: false),
                    GroupId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Weight = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1),
                    IsPrimary = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CurrentConnections = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    LastUsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TotalUsageCount = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    SuccessfulRequests = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    FailedRequests = table.Column<long>(type: "INTEGER", nullable: false, defaultValue: 0L),
                    AverageResponseTime = table.Column<double>(type: "REAL", nullable: false, defaultValue: 0.0),
                    HealthStatus = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "unknown"),
                    LastHealthCheckAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ConsecutiveFailures = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    DisabledUntil = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ModifiedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ModifiedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiKeyGroupMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApiKeyGroupMappings_ApiKeys_ApiKeyId",
                        column: x => x.ApiKeyId,
                        principalTable: "ApiKeys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApiKeyGroupMappings_ApiKeyGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "ApiKeyGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ApiKeyGroups 表索引
            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_CreatedAt",
                table: "ApiKeyGroups",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_GroupType",
                table: "ApiKeyGroups",
                column: "GroupType");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_GroupType_IsEnabled_HealthStatus",
                table: "ApiKeyGroups",
                columns: new[] { "GroupType", "IsEnabled", "HealthStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_HealthStatus",
                table: "ApiKeyGroups",
                column: "HealthStatus");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_IsEnabled",
                table: "ApiKeyGroups",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_IsEnabled_Priority",
                table: "ApiKeyGroups",
                columns: new[] { "IsEnabled", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_Name",
                table: "ApiKeyGroups",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroups_Priority",
                table: "ApiKeyGroups",
                column: "Priority");

            // ApiKeyGroupMappings 表索引
            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_ApiKeyId",
                table: "ApiKeyGroupMappings",
                column: "ApiKeyId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_ApiKeyId_IsEnabled",
                table: "ApiKeyGroupMappings",
                columns: new[] { "ApiKeyId", "IsEnabled" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_GroupId",
                table: "ApiKeyGroupMappings",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_GroupId_IsEnabled_HealthStatus",
                table: "ApiKeyGroupMappings",
                columns: new[] { "GroupId", "IsEnabled", "HealthStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_GroupId_IsPrimary",
                table: "ApiKeyGroupMappings",
                columns: new[] { "GroupId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_GroupId_Order",
                table: "ApiKeyGroupMappings",
                columns: new[] { "GroupId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_HealthStatus",
                table: "ApiKeyGroupMappings",
                column: "HealthStatus");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_IsEnabled",
                table: "ApiKeyGroupMappings",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_IsPrimary",
                table: "ApiKeyGroupMappings",
                column: "IsPrimary");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_Order",
                table: "ApiKeyGroupMappings",
                column: "Order");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeyGroupMappings_Weight",
                table: "ApiKeyGroupMappings",
                column: "Weight");

            // 唯一约束：一个ApiKey在一个Group中只能有一条记录
            migrationBuilder.CreateIndex(
                name: "UX_ApiKeyGroupMappings_ApiKeyId_GroupId",
                table: "ApiKeyGroupMappings",
                columns: new[] { "ApiKeyId", "GroupId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApiKeyGroupMappings");

            migrationBuilder.DropTable(
                name: "ApiKeyGroups");
        }
    }
}
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClaudeCodeProxy.EntityFrameworkCore.Sqlite.Migrations
{
    /// <inheritdoc />
    public partial class AddApiKeyGroupColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 添加分组相关字段到 ApiKeys 表
            migrationBuilder.AddColumn<string>(
                name: "GroupIds",
                table: "ApiKeys",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsGroupManaged",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "GroupPriority",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 50);

            migrationBuilder.AddColumn<int>(
                name: "GroupWeight",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "GroupOrder",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsGroupPrimary",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "GroupHealthStatus",
                table: "ApiKeys",
                type: "TEXT",
                maxLength: 20,
                nullable: true,
                defaultValue: "unknown");

            // 分组统计字段
            migrationBuilder.AddColumn<long>(
                name: "GroupUsageCount",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "GroupSuccessfulRequests",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "GroupFailedRequests",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<decimal>(
                name: "GroupTotalCost",
                table: "ApiKeys",
                type: "decimal(18,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<double>(
                name: "GroupAverageResponseTime",
                table: "ApiKeys",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "GroupConsecutiveFailures",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GroupCurrentConnections",
                table: "ApiKeys",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // 分组时间字段
            migrationBuilder.AddColumn<DateTime>(
                name: "GroupLastUsedAt",
                table: "ApiKeys",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GroupLastHealthCheckAt",
                table: "ApiKeys",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "GroupDisabledUntil",
                table: "ApiKeys",
                type: "datetime",
                nullable: true);

            // 创建分组相关索引
            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_IsGroupManaged",
                table: "ApiKeys",
                column: "IsGroupManaged");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_GroupPriority",
                table: "ApiKeys",
                column: "GroupPriority");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_GroupWeight",
                table: "ApiKeys",
                column: "GroupWeight");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_GroupHealthStatus",
                table: "ApiKeys",
                column: "GroupHealthStatus");

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_IsGroupPrimary",
                table: "ApiKeys",
                column: "IsGroupPrimary");

            // 复合索引
            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_IsGroupManaged_IsEnabled_GroupHealthStatus",
                table: "ApiKeys",
                columns: new[] { "IsGroupManaged", "IsEnabled", "GroupHealthStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_ApiKeys_IsGroupManaged_GroupPriority_GroupWeight",
                table: "ApiKeys",
                columns: new[] { "IsGroupManaged", "GroupPriority", "GroupWeight" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 删除索引
            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_IsGroupManaged",
                table: "ApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_GroupPriority",
                table: "ApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_GroupWeight",
                table: "ApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_GroupHealthStatus",
                table: "ApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_IsGroupPrimary",
                table: "ApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_IsGroupManaged_IsEnabled_GroupHealthStatus",
                table: "ApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ApiKeys_IsGroupManaged_GroupPriority_GroupWeight",
                table: "ApiKeys");

            // 删除列
            migrationBuilder.DropColumn(
                name: "GroupIds",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "IsGroupManaged",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupPriority",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupWeight",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupOrder",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "IsGroupPrimary",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupHealthStatus",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupUsageCount",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupSuccessfulRequests",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupFailedRequests",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupTotalCost",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupAverageResponseTime",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupConsecutiveFailures",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupCurrentConnections",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupLastUsedAt",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupLastHealthCheckAt",
                table: "ApiKeys");

            migrationBuilder.DropColumn(
                name: "GroupDisabledUntil",
                table: "ApiKeys");
        }
    }
}
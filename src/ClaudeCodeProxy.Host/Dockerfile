FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 6500

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/ClaudeCodeProxy.Host/ClaudeCodeProxy.Host.csproj", "src/ClaudeCodeProxy.Host/"]
COPY ["src/ClaudeCodeProxy.Abstraction/ClaudeCodeProxy.Abstraction.csproj", "src/ClaudeCodeProxy.Abstraction/"]
COPY ["src/ClaudeCodeProxy.Domain/ClaudeCodeProxy.Domain.csproj", "src/ClaudeCodeProxy.Domain/"]
COPY ["src/Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/ClaudeCodeProxy.EntityFrameworkCore.Sqlite.csproj", "src/Provide/ClaudeCodeProxy.EntityFrameworkCore.Sqlite/"]
COPY ["src/ClaudeCodeProxy.Core/ClaudeCodeProxy.Core.csproj", "src/ClaudeCodeProxy.Core/"]
RUN dotnet restore "src/ClaudeCodeProxy.Host/ClaudeCodeProxy.Host.csproj"
COPY . .
WORKDIR "/src/src/ClaudeCodeProxy.Host"
RUN dotnet build "./ClaudeCodeProxy.Host.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./ClaudeCodeProxy.Host.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
# Create data directory for SQLite database
RUN mkdir -p /app/data && chown $APP_UID:$APP_GID /app/data
COPY --from=publish /app/publish .
# Copy pre-built frontend files from web/dist directory
COPY web/dist ./wwwroot
ENTRYPOINT ["dotnet", "ClaudeCodeProxy.Host.dll"]

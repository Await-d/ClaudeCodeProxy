import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  BarChart3,
  RefreshCw,
  Zap
} from 'lucide-react';
import { apiService } from '@/services/api';
import type { 
  ApiKeyGroupsOverviewResponse
} from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

interface GroupPerformanceData {
  groupId: string;
  groupName: string;
  requests: number;
  responseTime: number;
  errorRate: number;
  healthStatus: 'healthy' | 'warning' | 'error' | 'unknown';
  loadBalanceEfficiency: number;
  failoverCount: number;
  cost: number;
  activeApiKeys: number;
}

interface GroupPerformanceChartProps {
  className?: string;
}

export default function GroupPerformanceChart({ className }: GroupPerformanceChartProps) {
  const { actualTheme } = useTheme();

  const [performanceData, setPerformanceData] = useState<GroupPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'requests' | 'balance' | 'health' | 'failover'>('requests');
  const [overview, setOverview] = useState<ApiKeyGroupsOverviewResponse | null>(null);

  // 主题感知的图表颜色
  const chartColors = {
    light: {
      primary: '#8b5cf6',
      secondary: '#3b82f6', 
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#6366f1',
      grid: '#e5e7eb',
      text: '#6b7280'
    },
    dark: {
      primary: '#a855f7',
      secondary: '#60a5fa',
      success: '#34d399', 
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#8b5cf6',
      grid: '#374151',
      text: '#9ca3af'
    }
  };

  const colors = chartColors[actualTheme];

  // 健康状态颜色映射
  const healthStatusColors = {
    healthy: colors.success,
    warning: colors.warning,
    error: colors.danger,
    unknown: colors.text
  };

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取分组列表和概览数据
      const [groupsResult, overviewResult] = await Promise.all([
        apiService.getApiKeyGroups({ includeStatistics: true }),
        apiService.getApiKeyGroupsOverview().catch(() => null)
      ]);

      const groupsList = Array.isArray(groupsResult) ? groupsResult : (groupsResult as any)?.data || [];
      setOverview(overviewResult);

      // 为每个分组获取详细统计数据
      const performancePromises = groupsList.map(async (group: any) => {
        try {
          const [statistics] = await Promise.all([
            apiService.getGroupStatistics(group.id).catch(() => null)
          ]);

          return {
            groupId: group.id,
            groupName: group.name,
            requests: statistics?.totalRequests || group.totalRequests || 0,
            responseTime: statistics?.averageResponseTime || group.avgResponseTime || 0,
            errorRate: statistics ? (1 - (statistics.successRate || 0) / 100) * 100 : 5,
            healthStatus: (group.healthStatus || 'unknown') as GroupPerformanceData['healthStatus'],
            loadBalanceEfficiency: Math.random() * 20 + 80, // Mock data - 实际应从API获取
            failoverCount: Math.floor(Math.random() * 10), // Mock data - 实际应从API获取
            cost: statistics?.totalCost || group.totalCost || 0,
            activeApiKeys: group.activeApiKeys || 0
          };
        } catch (error) {
          console.error(`获取分组 ${group.name} 统计数据失败:`, error);
          return {
            groupId: group.id,
            groupName: group.name,
            requests: group.totalRequests || 0,
            responseTime: group.avgResponseTime || 0,
            errorRate: 5,
            healthStatus: (group.healthStatus || 'unknown') as GroupPerformanceData['healthStatus'],
            loadBalanceEfficiency: 85,
            failoverCount: 0,
            cost: group.totalCost || 0,
            activeApiKeys: group.activeApiKeys || 0
          };
        }
      });

      const performanceResults = await Promise.all(performancePromises);
      setPerformanceData(performanceResults);

    } catch (error) {
      console.error('获取分组性能数据失败:', error);
      setError('获取分组性能数据失败');
      // 使用 Mock 数据作为后备
      const mockData: GroupPerformanceData[] = [
        {
          groupId: '1',
          groupName: 'Production Group',
          requests: 1250,
          responseTime: 850,
          errorRate: 2,
          healthStatus: 'healthy',
          loadBalanceEfficiency: 92,
          failoverCount: 3,
          cost: 125.50,
          activeApiKeys: 3
        },
        {
          groupId: '2', 
          groupName: 'Development Group',
          requests: 450,
          responseTime: 1200,
          errorRate: 8,
          healthStatus: 'warning',
          loadBalanceEfficiency: 76,
          failoverCount: 1,
          cost: 23.75,
          activeApiKeys: 2
        },
        {
          groupId: '3',
          groupName: 'Testing Group', 
          requests: 120,
          responseTime: 650,
          errorRate: 1,
          healthStatus: 'healthy',
          loadBalanceEfficiency: 88,
          failoverCount: 0,
          cost: 8.90,
          activeApiKeys: 1
        }
      ];
      setPerformanceData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
    
    // 设置定时刷新
    const interval = setInterval(fetchGroupData, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-card-foreground">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('率') || entry.name.includes('效率') ? 
                `${entry.value?.toFixed(1) || '0.0'}%` : 
                entry.name.includes('时间') ?
                `${entry.value || 0}ms` :
                entry.name.includes('费用') ?
                `$${entry.value?.toFixed(2) || '0.00'}` :
                formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (performanceData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">暂无分组数据</p>
          </div>
        </div>
      );
    }

    switch (selectedChart) {
      case 'requests':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }: { name?: string; value?: number; percent?: number }) => 
                  `${name || ''}: ${formatNumber(value || 0)} (${((percent || 0) * 100).toFixed(1)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="requests"
              >
                {performanceData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={healthStatusColors[entry.healthStatus] || colors.primary}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'balance':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="groupName" 
                stroke={colors.text}
                fontSize={12}
              />
              <YAxis 
                stroke={colors.text}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="loadBalanceEfficiency" 
                fill={colors.secondary}
                name="负载均衡效率"
              />
              <Bar 
                dataKey="activeApiKeys" 
                fill={colors.info}
                name="活跃API Key数"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'health':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="groupName" 
                stroke={colors.text}
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke={colors.text}
                fontSize={12}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={colors.text}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="responseTime" 
                fill={colors.warning}
                name="响应时间(ms)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="errorRate" 
                stroke={colors.danger}
                strokeWidth={2}
                name="错误率(%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'failover':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={performanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis type="number" stroke={colors.text} fontSize={12} />
              <YAxis 
                type="category"
                dataKey="groupName" 
                stroke={colors.text}
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="failoverCount" 
                fill={colors.danger}
                name="故障转移次数"
              />
              <Bar 
                dataKey="requests" 
                fill={colors.primary}
                name="总请求数"
                stackId="1"
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <CardTitle>分组性能分析</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedChart} onValueChange={(value: 'requests' | 'balance' | 'health' | 'failover') => setSelectedChart(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requests">请求分布</SelectItem>
                <SelectItem value="balance">负载均衡</SelectItem>
                <SelectItem value="health">健康状态</SelectItem>
                <SelectItem value="failover">故障转移</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={fetchGroupData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          {selectedChart === 'requests' && '各分组请求量分布情况'}
          {selectedChart === 'balance' && '分组负载均衡效果分析'}
          {selectedChart === 'health' && '分组健康状态趋势监控'}
          {selectedChart === 'failover' && '分组故障转移统计分析'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* 概览统计 */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{overview.totalGroups}</div>
              <div className="text-sm text-muted-foreground">总分组数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{overview.activeGroups}</div>
              <div className="text-sm text-muted-foreground">活跃分组</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{overview.healthyGroups}</div>
              <div className="text-sm text-muted-foreground">健康分组</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{overview.averageKeysPerGroup?.toFixed(1) || '0.0'}</div>
              <div className="text-sm text-muted-foreground">平均Key数</div>
            </div>
          </div>
        )}

        {/* 分组状态指示器 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {performanceData.map((group) => (
            <Badge 
              key={group.groupId}
              variant={group.healthStatus === 'healthy' ? 'default' : 
                     group.healthStatus === 'warning' ? 'secondary' : 'destructive'}
              className="flex items-center space-x-1"
            >
              {group.healthStatus === 'healthy' && <CheckCircle className="h-3 w-3" />}
              {group.healthStatus === 'warning' && <AlertCircle className="h-3 w-3" />}
              {group.healthStatus === 'error' && <AlertCircle className="h-3 w-3" />}
              {group.healthStatus === 'unknown' && <Activity className="h-3 w-3" />}
              <span>{group.groupName}</span>
            </Badge>
          ))}
        </div>

        {/* 图表渲染 */}
        {renderChart()}

        {/* 快速洞察 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">最高请求量</span>
            </div>
            <div className="text-muted-foreground">
              {performanceData.length > 0 ? 
                `${performanceData.reduce((max, group) => 
                  group.requests > max.requests ? group : max
                ).groupName}: ${formatNumber(
                  performanceData.reduce((max, group) => 
                    group.requests > max.requests ? group : max
                  ).requests
                )}` : '暂无数据'
              }
            </div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="h-4 w-4 text-success" />
              <span className="font-medium">最佳响应时间</span>
            </div>
            <div className="text-muted-foreground">
              {performanceData.length > 0 ? 
                `${performanceData.reduce((min, group) => 
                  group.responseTime < min.responseTime ? group : min
                ).groupName}: ${
                  performanceData.reduce((min, group) => 
                    group.responseTime < min.responseTime ? group : min
                  ).responseTime
                }ms` : '暂无数据'
              }
            </div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <BarChart3 className="h-4 w-4 text-warning" />
              <span className="font-medium">总体健康度</span>
            </div>
            <div className="text-muted-foreground">
              {overview ? `${overview.overallHealthScore}%` : '计算中...'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
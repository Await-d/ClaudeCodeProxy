import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Users } from 'lucide-react';
import { apiService, type TrendDataRequest, type TrendDataPoint, type ApiKeyGroup } from '@/services/api';

interface UsageTrendsChartProps {
  className?: string;
}

export default function UsageTrendsChart({ className }: UsageTrendsChartProps) {
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');
  const [dateRange, setDateRange] = useState('7days');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [filterMode, setFilterMode] = useState<'overall' | 'by-group'>('overall');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [groups, setGroups] = useState<ApiKeyGroup[]>([]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      
      const request: TrendDataRequest = {
        granularity,
        dateFilter: {
          type: 'preset',
          preset: dateRange
        }
      };

      if (filterMode === 'by-group' && selectedGroup !== 'all') {
        // 如果选择了特定分组，获取该分组的趋势数据
        // 注意：这里需要后端支持按分组筛选的API
        // 暂时使用模拟数据
        const mockGroupTrendData: TrendDataPoint[] = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          inputTokens: Math.floor(Math.random() * 5000) + 1000,
          outputTokens: Math.floor(Math.random() * 3000) + 500,
          cacheCreateTokens: Math.floor(Math.random() * 1000) + 100,
          cacheReadTokens: Math.floor(Math.random() * 2000) + 200,
          requests: Math.floor(Math.random() * 100) + 50,
          cost: Math.random() * 10 + 2
        }));
        setData(mockGroupTrendData);
      } else {
        const trendData = await apiService.getTrendData(request);
        setData(trendData);
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const groupsResult = await apiService.getApiKeyGroups();
      const groupsList = Array.isArray(groupsResult) ? groupsResult : groupsResult.data || [];
      setGroups(groupsList);
    } catch (error) {
      console.error('获取分组列表失败:', error);
    }
  };

  useEffect(() => {
    fetchTrendData();
  }, [granularity, dateRange, filterMode, selectedGroup]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-card p-3 border border-border dark:border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground dark:text-foreground">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-muted-foreground">
              {entry.name}: {formatValue(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>使用趋势分析</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={filterMode} onValueChange={(value: 'overall' | 'by-group') => setFilterMode(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">整体</SelectItem>
                <SelectItem value="by-group">分组</SelectItem>
              </SelectContent>
            </Select>

            {filterMode === 'by-group' && (
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分组</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={chartType} onValueChange={(value: 'line' | 'area') => setChartType(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">面积图</SelectItem>
                <SelectItem value="line">折线图</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={granularity} onValueChange={(value: 'day' | 'hour') => setGranularity(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">按天</SelectItem>
                <SelectItem value="hour">按小时</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1day">1天</SelectItem>
                <SelectItem value="7days">7天</SelectItem>
                <SelectItem value="30days">30天</SelectItem>
                <SelectItem value="90days">90天</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={fetchTrendData}>
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Token使用量和API调用次数的时间趋势分析
          {filterMode === 'by-group' && selectedGroup !== 'all' && (
            <span className="ml-2 inline-flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>({groups.find(g => g.id === selectedGroup)?.name || '未知分组'})</span>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis 
                dataKey={granularity === 'day' ? 'label' : 'label'} 
                fontSize={12}
                tick={{ fill: 'currentColor', opacity: 0.7 }}
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.2 }}
              />
              <YAxis 
                fontSize={12}
                tickFormatter={formatValue}
                tick={{ fill: 'currentColor', opacity: 0.7 }}
                axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.2 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {chartType === 'area' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="请求数"
                  />
                  <Area
                    type="monotone"
                    dataKey="inputTokens"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="输入Token"
                  />
                  <Area
                    type="monotone"
                    dataKey="outputTokens"
                    stackId="3"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.3}
                    name="输出Token"
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="请求数"
                  />
                  <Line
                    type="monotone"
                    dataKey="inputTokens"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="输入Token"
                  />
                  <Line
                    type="monotone"
                    dataKey="outputTokens"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="输出Token"
                  />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
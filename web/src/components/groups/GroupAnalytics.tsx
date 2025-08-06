import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Activity,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Gauge
} from 'lucide-react';
import type {
  ApiKeyGroup,
  GroupAnalysisData,
  SystemRecommendation
} from '@/types/apiKeyGroups';

interface GroupAnalyticsProps {
  group: ApiKeyGroup;
  className?: string;
}

// 性能指标组件
function PerformanceMetrics({ metrics }: { metrics: GroupAnalysisData['performanceMetrics'] }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };



  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">平均响应时间</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{metrics.averageResponseTime}ms</div>
          <div className="text-xs text-muted-foreground">目标 &lt; 500ms</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">成功率</span>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.successRate * 100)}`}>
            {(metrics.successRate * 100).toFixed(1)}%
          </div>
          <Progress 
            value={metrics.successRate * 100} 
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">吞吐量</span>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{metrics.throughput}</div>
          <div className="text-xs text-muted-foreground">req/min</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">可用性</span>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.availability * 100)}`}>
            {(metrics.availability * 100).toFixed(1)}%
          </div>
          <Progress 
            value={metrics.availability * 100} 
            className="mt-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// 成本指标组件
function CostMetrics({ metrics }: { metrics: GroupAnalysisData['costMetrics'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总费用</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">本月累计</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">单次请求成本</span>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">${metrics.costPerRequest.toFixed(4)}</div>
          <div className="text-xs text-muted-foreground">平均值</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">成本效率</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {(metrics.costEfficiency * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">vs 平均水平</div>
        </CardContent>
      </Card>
    </div>
  );
}

// 使用模式图表组件
function UsagePatterns({ patterns }: { patterns: GroupAnalysisData['usagePatterns'] }) {
  // 峰值时段数据
  const hourlyData = patterns.peakHours.map((hour) => ({
    hour: `${hour}:00`,
    requests: patterns.requestDistribution[hour.toString()] || 0,
  }));

  // 模型使用数据
  const modelData = Object.entries(patterns.modelUsage).map(([model, usage]) => ({
    name: model,
    value: usage,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* 峰值时段 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">请求分布 - 24小时</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 模型使用分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">模型使用分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {modelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {modelData.map((model, index) => (
                <div key={model.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{model.name}</span>
                  </div>
                  <Badge variant="outline">{model.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 健康趋势组件
function HealthTrends({ trends }: { trends: GroupAnalysisData['healthTrends'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">健康状态趋势</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis yAxisId="health" domain={[0, 100]} />
            <YAxis yAxisId="keys" orientation="right" />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Legend />
            <Line
              yAxisId="health"
              type="monotone"
              dataKey="healthScore"
              stroke="#8884d8"
              strokeWidth={2}
              name="健康得分 (%)"
            />
            <Line
              yAxisId="keys"
              type="monotone"
              dataKey="activeKeys"
              stroke="#82ca9d"
              strokeWidth={2}
              name="活跃 Keys"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 系统建议组件
function SystemRecommendations({ recommendations }: { recommendations: SystemRecommendation[] }) {
  const getRecommendationIcon = (type: SystemRecommendation['type']) => {
    switch (type) {
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'cost':
        return <DollarSign className="h-4 w-4" />;
      case 'security':
        return <AlertTriangle className="h-4 w-4" />;
      case 'reliability':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: SystemRecommendation['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getSeverityTextColor = (severity: SystemRecommendation['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700';
      case 'high':
        return 'text-orange-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-blue-700';
    }
  };

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <Card key={index} className={`border-l-4 ${getSeverityColor(rec.severity)}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className={`${getSeverityTextColor(rec.severity)} mt-1`}>
                {getRecommendationIcon(rec.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium">{rec.title}</h4>
                  <Badge
                    variant={rec.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {rec.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {rec.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {rec.description}
                </p>
                {rec.action && (
                  <div className="bg-white rounded p-2 border">
                    <p className="text-sm font-medium">建议操作:</p>
                    <p className="text-sm text-muted-foreground">{rec.action}</p>
                  </div>
                )}
                {rec.impact && (
                  <div className="text-xs text-muted-foreground mt-2">
                    预期影响: {rec.impact}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// 主分析组件
export default function GroupAnalytics({ group, className = '' }: GroupAnalyticsProps) {
  const [analysisData, setAnalysisData] = useState<GroupAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisData();
  }, [group.id]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // 这里应该调用实际的分析API
      // const data = await apiService.getGroupAnalysis(group.id);
      
      // 模拟分析数据
      const mockData: GroupAnalysisData = {
        groupId: group.id,
        groupName: group.name,
        performanceMetrics: {
          averageResponseTime: 245,
          successRate: 0.95,
          throughput: 125,
          availability: 0.98,
        },
        costMetrics: {
          totalCost: 156.78,
          costPerRequest: 0.0024,
          costEfficiency: 1.15,
        },
        usagePatterns: {
          peakHours: [9, 10, 14, 15, 20, 21],
          requestDistribution: {
            '9': 450, '10': 520, '11': 380, '12': 310,
            '13': 290, '14': 480, '15': 510, '16': 420,
            '17': 380, '18': 340, '19': 360, '20': 440,
            '21': 400, '22': 280
          },
          modelUsage: {
            'claude-3-5-sonnet': 2450,
            'claude-3-haiku': 1230,
            'claude-3-opus': 890,
            'gpt-4': 650,
          },
        },
        healthTrends: Array.from({ length: 30 }, (_, i) => ({
          timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
          healthScore: Math.max(70, Math.min(100, 85 + Math.sin(i * 0.5) * 15)),
          activeKeys: Math.max(3, Math.min(5, Math.floor(4 + Math.sin(i * 0.3) * 1.5))),
        })),
        recommendations: [
          {
            type: 'performance',
            severity: 'medium',
            title: '响应时间可以进一步优化',
            description: '当前平均响应时间为245ms，虽然在可接受范围内，但仍有优化空间',
            action: '考虑启用缓存或添加更多高性能API Key',
            impact: '预期可减少30-50ms响应时间',
          },
          {
            type: 'cost',
            severity: 'low',
            title: '成本效率表现良好',
            description: '当前成本效率比平均水平高15%，表现优秀',
            action: '继续保持当前配置',
            impact: '维持良好的成本控制',
          },
          {
            type: 'reliability',
            severity: 'high',
            title: '建议增加故障转移配置',
            description: '虽然可用性很高，但建议配置更多备用API Key以应对突发情况',
            action: '增加2-3个备用API Key到分组中',
            impact: '提高系统稳定性和容错能力',
          },
        ],
      };
      
      setAnalysisData(mockData);
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">无法加载分析数据</h3>
          <p className="text-muted-foreground">请稍后重试或联系管理员</p>
          <Button onClick={loadAnalysisData} className="mt-4">
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">分组分析报告</h2>
          <p className="text-sm text-muted-foreground">
            分组: {analysisData.groupName}
          </p>
        </div>
        <Button variant="outline" onClick={loadAnalysisData}>
          <Activity className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 分析内容 */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">性能指标</TabsTrigger>
          <TabsTrigger value="cost">成本分析</TabsTrigger>
          <TabsTrigger value="usage">使用模式</TabsTrigger>
          <TabsTrigger value="health">健康趋势</TabsTrigger>
          <TabsTrigger value="recommendations">系统建议</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <PerformanceMetrics metrics={analysisData.performanceMetrics} />
        </TabsContent>

        <TabsContent value="cost">
          <CostMetrics metrics={analysisData.costMetrics} />
        </TabsContent>

        <TabsContent value="usage">
          <UsagePatterns patterns={analysisData.usagePatterns} />
        </TabsContent>

        <TabsContent value="health">
          <HealthTrends trends={analysisData.healthTrends} />
        </TabsContent>

        <TabsContent value="recommendations">
          <SystemRecommendations recommendations={analysisData.recommendations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD - Fully Integrated with Backend API
// All bug fixes applied + Real API integration
// ══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Building2, FileText, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { NairaSign } from "@/components/NairaSign";
import { formatCurrency, formatMetricChange, formatNumber } from '@/utils/format';
import { dashboardApi } from '@/utils/api-service';

interface KPI {
  label: string;
  value: number;
  previousValue: number;
  icon: any;
  color: string;
}

interface ChartData {
  assetDistribution: any[];
  salesVolume: any[];
  revenueTrend: any[];
}

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    assetDistribution: [],
    salesVolume: [],
    revenueTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs and charts in parallel
      const [kpisData, chartsData] = await Promise.all([
        dashboardApi.getKPIs(),
        dashboardApi.getCharts(),
      ]);

      // Transform KPI data
      setKpis([
        {
          label: 'Total Revenue',
          value: kpisData.totalRevenue.current,
          previousValue: kpisData.totalRevenue.previous,
          icon: NairaSign,
          color: 'text-emerald-600',
        },
        {
          label: 'Active Assets',
          value: kpisData.activeAssets.current,
          previousValue: kpisData.activeAssets.previous,
          icon: Building2,
          color: 'text-blue-600',
        },
        {
          label: 'Total Transactions',
          value: kpisData.totalTransactions.current,
          previousValue: kpisData.totalTransactions.previous,
          icon: FileText,
          color: 'text-purple-600',
        },
        {
          label: 'Active Customers',
          value: kpisData.activeCustomers.current,
          previousValue: kpisData.activeCustomers.previous,
          icon: Users,
          color: 'text-amber-600',
        },
      ]);

      // Set chart data
      setChartData({
        assetDistribution: chartsData.assetDistribution,
        salesVolume: chartsData.salesVolume,
        revenueTrend: chartsData.revenueTrend,
      });
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // BUG_021 FIX: Chart colors
  const CHART_COLORS = {
    primary: '#4c51bf',
    teal: '#4ecdc4',
    emerald: '#34d399',
    amber: '#f59e0b',
    red: '#ef4444',
  };

  const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.teal, CHART_COLORS.emerald, CHART_COLORS.amber];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BUG_022 FIX: No duplicate "Dashboard" header - starts directly with content */}
      
      {/* KPI Cards - BUG_020 FIX: Add metric change indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const change = formatMetricChange(kpi.value, kpi.previousValue);
          const Icon = kpi.icon;

          return (
            <Card key={index} className="kpi-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="kpi-card-value">
                  {kpi.label.includes('Revenue') 
                    ? formatCurrency(kpi.value)
                    : formatNumber(kpi.value)}
                </div>
                {/* BUG_020 FIX: Metric change with arrow and percentage */}
                <div className={`kpi-card-change ${
                  change.isPositive ? 'kpi-card-change-positive' : 'kpi-card-change-negative'
                }`}>
                  {change.isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span>{change.display} from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* BUG_021 FIX: All 3 charts present */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.assetDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Volume - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Volume (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.salesVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value as number)} />
                <Legend />
                <Bar dataKey="sales" fill={CHART_COLORS.primary} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend - Line Chart (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={CHART_COLORS.emerald} 
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

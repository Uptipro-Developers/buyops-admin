import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatDate } from "../../../utils/format";
import {
  Building2,
  TrendingUp,
  Receipt,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { dashboardApi } from "../../../utils/api-service";
import { NairaSign } from "../NairaSign";

const iconMap = {
  building: Building2,
  trendingUp: TrendingUp,
  receipt: Receipt,
  dollarSign: NairaSign,
};

export function AnalyticsDashboard() {
  const [kpiData, setKpiData] = useState([]);
  const [assetDistributionData, setAssetDistributionData] = useState([]);
  const [salesVolumeData, setSalesVolumeData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch overview and recent transactions
        const overview = await dashboardApi.getOverview();
        const transactions = await dashboardApi.getRecentTransactions();
        // Transform overview data for KPIs and charts
        setKpiData(overview.kpis || []);
        setAssetDistributionData(overview.assetDistribution || []);
        setSalesVolumeData(overview.salesVolume || []);
        setRecentTransactions(transactions || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

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
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi: any) => {
          const Icon = iconMap[kpi.icon] || Building2;
          return (
            <Card key={kpi.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                {/* <Icon className="h-4 w-4 text-muted-foreground" /> */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {kpi.isCurrency
                    ? `₦${Number(kpi.value).toLocaleString()}`
                    : kpi.value}
                </div>
                <div className="flex items-center gap-1 text-xs text-accent mt-1">
                  {kpi.trend === "up" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span>{kpi.change} from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Asset Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Asset Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {assetDistributionData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No assets available</p>
                  <p className="text-sm">Create assets to see distribution</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales Volume Over Time */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Sales Volume (2025)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesVolumeData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No sales data available</p>
                  <p className="text-sm">Complete transactions to see trends</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesVolumeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#4c51bf" name="Sales Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Over Time */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Revenue Trend (2025)</CardTitle>
        </CardHeader>
        <CardContent>
          {salesVolumeData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <NairaSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No revenue data available</p>
                <p className="text-sm">Complete transactions to see trends</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesVolumeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue (₦K)"
                  dot={false}
                  legendType="line"
                  label={({ value }) => `₦${Number(value).toLocaleString()}`}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction: any) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.serialId || transaction.id}
                  </TableCell>
                  <TableCell>{transaction.asset?.name ?? "—"}</TableCell>
                  <TableCell>{transaction.buyer?.name ?? "—"}</TableCell>
                  <TableCell>
                    {transaction.leadAgent?.user?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    ₦{Number(transaction?.totalAmount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-accent">
                    ₦{Number(transaction.commission || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : transaction.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        transaction.status === "completed"
                          ? "bg-accent text-accent-foreground"
                          : transaction.status === "pending"
                            ? "bg-warning text-warning-foreground"
                            : ""
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

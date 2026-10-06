import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi } from "../../../utils/api-service";
import { formatDate } from "../../../utils/format";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { NairaSign } from "../NairaSign";

type Kpi = {
  title: string;
  value: number | string;
  icon: string;
  trend?: string;
  change: string;
};

type DistributionItem = { name: string; value: number; color: string };
type SalesVolumePoint = { month: string; sales: number; revenue: number };

type DashboardOverview = {
  kpis: Kpi[];
  assetDistribution: DistributionItem[];
  salesVolume: SalesVolumePoint[];
};

const iconMap: Record<string, typeof Building2> = {
  building: Building2,
  trendingUp: TrendingUp,
  dollarSign: NairaSign,
  receipt: Receipt,
};

const formatCurrency = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

const formatAxisCurrency = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value}`;
};

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewData, transactions] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getRecentTransactions(),
        ]);
        if (!active) return;
        setOverview({
          kpis: Array.isArray(overviewData?.kpis) ? overviewData.kpis : [],
          assetDistribution: Array.isArray(overviewData?.assetDistribution)
            ? overviewData.assetDistribution
            : [],
          salesVolume: Array.isArray(overviewData?.salesVolume)
            ? overviewData.salesVolume
            : [],
        });
        setRecentTransactions(Array.isArray(transactions) ? transactions : []);
      } catch (requestError: any) {
        if (!active) return;
        setError(requestError?.response?.data?.message || requestError?.message || "Failed to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDashboard();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Loading dashboard">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (error || !overview) {
    return (
      <Card className="mx-auto mt-16 max-w-lg rounded-2xl text-center">
        <CardContent className="p-8">
          <p className="mb-4 text-destructive">{error || "Dashboard data is unavailable"}</p>
          <Button onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overview.kpis.map((kpi) => {
          const Icon = iconMap[kpi.icon] || Building2;
          const change = String(kpi.change || "0.0%");
          const isPositive = !change.startsWith("-");
          return (
            <Card key={kpi.title} className="rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-5">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </div>
                <div className={`mt-1 flex items-center gap-1 text-xs ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  <span>{change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.salesVolume.length === 0 || overview.salesVolume.every((point) => point.revenue === 0) ? (
              <EmptyChart icon={TrendingUp} title="No revenue data available" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overview.salesVolume} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickFormatter={(value) => formatAxisCurrency(Number(value) * 1000)} tickLine={false} axisLine={false} width={70} className="text-xs" />
                  <Tooltip formatter={(value: number) => [formatCurrency(Number(value) * 1000), "Revenue"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#4F7FE8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "white", stroke: "#4F7FE8" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.assetDistribution.length === 0 ? (
              <EmptyChart icon={Building2} title="No assets available" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={overview.assetDistribution}
                    cx="50%"
                    cy="45%"
                    dataKey="value"
                    nameKey="name"
                    outerRadius={92}
                    label={({ value }) => value}
                    labelLine
                  >
                    {overview.assetDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="square" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No recent transactions found.
                    </TableCell>
                  </TableRow>
                ) : recentTransactions.map((transaction) => {
                  const status = String(transaction.status || "pending").toLowerCase();
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">{transaction.serialId || transaction.id}</TableCell>
                      <TableCell className="font-medium">{transaction.asset?.name || "—"}</TableCell>
                      <TableCell>{transaction.buyer?.name || "—"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(transaction.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={
                          status === "completed"
                            ? "bg-indigo-600 text-white hover:bg-indigo-600"
                            : status === "pending"
                              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-950/40"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                        }>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(transaction.date)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ icon: Icon, title }: { icon: typeof Building2; title: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center text-muted-foreground">
      <Icon className="mb-3 h-10 w-10 opacity-25" />
      <p>{title}</p>
    </div>
  );
}

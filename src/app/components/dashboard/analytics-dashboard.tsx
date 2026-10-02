import { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  value: number;
  icon: "revenue" | "transactions" | "assets" | "leads";
  isCurrency?: boolean;
  change: number;
  changeLabel: string;
};

type ApplicationStat = {
  platform: "Urbco Foundry" | "Urbco Harbor";
  revenue: number;
  transactions: number;
  assets: number;
  investors: number;
};

type DistributionItem = { name: string; value: number; color: string };
type RevenuePoint = { month: string; period: string; revenue: number };

type DashboardOverview = {
  kpis: Kpi[];
  applicationStats: ApplicationStat[];
  revenueTrend: RevenuePoint[];
  assetDistribution: DistributionItem[];
};

const iconMap = {
  revenue: NairaSign,
  transactions: Receipt,
  assets: Building2,
  leads: TrendingUp,
};

const formatCurrency = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

const formatAxisCurrency = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value}`;
};

const platformBadgeClass = (platform: string) =>
  platform === "Urbco Harbor"
    ? "border-purple-500 text-purple-700 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300"
    : "border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300";

const normalizePlatform = (platform: unknown) =>
  platform === "Urbco Harbor" ? "Urbco Harbor" : "Urbco Foundry";

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [applicationFilter, setApplicationFilter] = useState("all");
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
        setOverview(overviewData);
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

  const filteredTransactions = useMemo(
    () => recentTransactions.filter((transaction) =>
      applicationFilter === "all" || normalizePlatform(transaction.asset?.platform) === applicationFilter,
    ),
    [applicationFilter, recentTransactions],
  );

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
          const isPositive = kpi.change >= 0;
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
                  {kpi.isCurrency ? formatCurrency(kpi.value) : Number(kpi.value).toLocaleString()}
                </div>
                <div className={`mt-1 flex items-center gap-1 text-xs ${isPositive ? "text-emerald-600" : "text-destructive"}`}>
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  <span>{kpi.changeLabel}: {Math.abs(kpi.change)}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {overview.applicationStats.map((stat) => (
          <Card key={stat.platform} className="rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={platformBadgeClass(stat.platform)}>
                  {stat.platform}
                </Badge>
                <span>Application Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-12 gap-y-5">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="mt-1 text-lg font-bold">{formatCurrency(stat.revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="mt-1 text-lg font-bold">{stat.transactions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assets</p>
                <p className="mt-1 text-lg font-bold">{stat.assets.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Investors</p>
                <p className="mt-1 text-lg font-bold">{stat.investors.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.revenueTrend.every((point) => point.revenue === 0) ? (
              <EmptyChart icon={TrendingUp} title="No revenue data available" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overview.revenueTrend} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickFormatter={formatAxisCurrency} tickLine={false} axisLine={false} width={70} className="text-xs" />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
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
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Application:</span>
            <Select value={applicationFilter} onValueChange={setApplicationFilter}>
              <SelectTrigger className="w-[180px] bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="Urbco Foundry">Urbco Foundry</SelectItem>
                <SelectItem value="Urbco Harbor">Urbco Harbor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No transactions found for this application.
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.map((transaction) => {
                  const platform = normalizePlatform(transaction.asset?.platform);
                  const status = String(transaction.status || "pending").toLowerCase();
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant="outline" className={platformBadgeClass(platform)}>{platform}</Badge>
                      </TableCell>
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

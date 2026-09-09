import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Download,
  Calendar,
  FileBarChart} from "lucide-react";
import { NairaSign } from "@/app/components/NairaSign";
import { reportsApi } from "../../../utils/api-service";

export function Reports() {
  const [dateRange, setDateRange] = useState("30d");
  const [reportCategory, setReportCategory] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sales reports state
  const [salesSummary, setSalesSummary] = useState<any>({});
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topSalesByAsset, setTopSalesByAsset] = useState<any[]>([]);
  const [salesTypeBreakdown, setSalesTypeBreakdown] = useState<any[]>([]);

  // Asset reports state
  const [assetPerformanceData, setAssetPerformanceData] = useState<any[]>([]);
  const [assetTypeBreakdown, setAssetTypeBreakdown] = useState<any[]>([]);
  const [assetSummary, setAssetSummary] = useState<any>({});

  // Investment reports state
  const [investmentTrends, setInvestmentTrends] = useState<any[]>([]);
  const [investorCategories, setInvestorCategories] = useState<any[]>([]);
  const [investmentSummary, setInvestmentSummary] = useState<any>({});

  // Commission reports state
  const [commissionTrends, setCommissionTrends] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<any>({});

  // Performance reports state
  const [conversionMetrics, setConversionMetrics] = useState<any[]>([]);
  const [clusterPerformance, setClusterPerformance] = useState<any[]>([]);

  // Helper function to sort data by month chronologically
  const sortByMonth = (data: any[]) => {
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return data.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ");
      const [bMonth, bYear] = b.month.split(" ");

      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });
  };

  // Fetch data when category or date range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (reportCategory === "sales") {
          const data = await reportsApi.getSalesReport({ dateRange });
          setSalesSummary(data.summary || {});
          setSalesData(sortByMonth(data.salesByMonth || []));
          // Normalize topAssets: backend uses { name, count, location } - map to { asset, sales, location, revenue }
          setTopSalesByAsset(
            (data.topAssets || []).map((item: any) => ({
              ...item,
              asset: item.asset ?? item.name,
              sales: item.sales ?? item.count,
            })),
          );
          // Normalize salesByType: backend uses { type, revenue, count } - map to assetTypeBreakdown format
          setSalesTypeBreakdown(
            (data.salesByType || []).map((item: any) => ({
              ...item,
              name: item.name ?? item.type,
            })),
          );

          // Calculate conversion rate: transactions / total leads (if available)
          // For now, we'll use a placeholder calculated from available data
          const conversionRate = data.summary?.conversionRate || 0;
        } else if (reportCategory === "assets") {
          const data = await reportsApi.getAssetReport({ dateRange });
          setAssetPerformanceData(data.assetPerformanceData || []);
          setAssetTypeBreakdown(data.assetTypeBreakdown || []);

          // Calculate asset summary
          const totalAssets = (data.assetTypeBreakdown || []).reduce(
            (sum: number, t: any) => sum + (t.count || 0),
            0,
          );
          const publishedAssets =
            (data.assetPerformanceData || []).find(
              (p: any) => p.name === "published",
            )?.value || 0;
          const publishedPercentage =
            totalAssets > 0
              ? ((publishedAssets / totalAssets) * 100).toFixed(1)
              : 0;

          setAssetSummary({
            totalAssets,
            publishedAssets,
            publishedPercentage,
          });
        } else if (reportCategory === "investments") {
          const data = await reportsApi.getInvestmentReports({ dateRange });
          setInvestmentTrends(sortByMonth(data.investmentTrends || []));
          setInvestorCategories(data.investorCategories || []);

          // Calculate investment summary
          const totalInvestors = (data.investorCategories || []).reduce(
            (sum: number, c: any) => sum + (c.count || 0),
            0,
          );
          const totalInvested = (data.investorCategories || []).reduce(
            (sum: number, c: any) => sum + (c.totalInvested || 0),
            0,
          );
          const avgInvestment =
            totalInvestors > 0 ? totalInvested / totalInvestors : 0;

          // Calculate fractional vs full from trends
          const fractionalTotal = (data.investmentTrends || []).reduce(
            (sum: number, t: any) => sum + (t.fractional || 0),
            0,
          );
          const fullTotal = (data.investmentTrends || []).reduce(
            (sum: number, t: any) => sum + (t.full || 0),
            0,
          );
          const total = fractionalTotal + fullTotal;
          const fractionalPercent =
            total > 0 ? Math.round((fractionalTotal / total) * 100) : 0;
          const fullPercent =
            total > 0 ? Math.round((fullTotal / total) * 100) : 0;

          setInvestmentSummary({
            totalInvestors,
            totalInvested,
            avgInvestment,
            fractionalPercent,
            fullPercent,
          });
        } else if (reportCategory === "commissions") {
          const data = await reportsApi.getCommissionReports({ dateRange });
          setCommissionTrends(sortByMonth(data.commissionTrends || []));
          setTopAgents(data.topAgents || []);

          // Calculate commission summary
          const totalCommissions = (data.commissionTrends || []).reduce(
            (sum: number, t: any) =>
              sum + (t.agentComm || 0) + (t.companyComm || 0),
            0,
          );
          const agentCommissions = (data.commissionTrends || []).reduce(
            (sum: number, t: any) => sum + (t.agentComm || 0),
            0,
          );
          const companyCommissions = (data.commissionTrends || []).reduce(
            (sum: number, t: any) => sum + (t.companyComm || 0),
            0,
          );

          setCommissionSummary({
            totalCommissions,
            agentCommissions,
            companyCommissions,
          });
        } else if (reportCategory === "performance") {
          const data = await reportsApi.getPerformanceReports({ dateRange });
          setConversionMetrics(data.conversionMetrics || []);
          setClusterPerformance(data.clusterPerformance || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch reports:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch reports",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportCategory, dateRange]);

  const handleDownloadReport = async () => {
    try {
      const type =
        reportCategory === "sales"
          ? "sales"
          : reportCategory === "performance"
            ? "agents"
            : "clusters";
      const blob = await reportsApi.exportReport(type, { dateRange });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `buyops-${type}-report-${dateRange}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive insights across sales, assets, investments, and
            performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 sm:flex-none">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleDownloadReport}
            className="w-full sm:w-auto sm:mt-6"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs for Different Report Categories */}
      <Tabs
        defaultValue="sales"
        className="space-y-6"
        onValueChange={setReportCategory}
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">
            Sales
          </TabsTrigger>
          <TabsTrigger value="assets" className="text-xs sm:text-sm">
            Assets
          </TabsTrigger>
          <TabsTrigger value="investments" className="text-xs sm:text-sm">
            Investments
          </TabsTrigger>
          <TabsTrigger value="commissions" className="text-xs sm:text-sm">
            Commissions
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-xs sm:text-sm">
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-6">
          {loading ? (
            <div className="text-center py-10">Loading sales reports...</div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">{error}</div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Revenue
                    </CardTitle>
                    <NairaSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      ₦
                      {((salesSummary?.totalRevenue || 0) / 1000000).toFixed(0)}
                      M
                    </div>
                    <div
                      className={`flex items-center text-xs mt-1 ${(salesSummary?.revenueChange || 0) >= 0 ? "text-accent" : "text-destructive"}`}
                    >
                      {(salesSummary?.revenueChange || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(salesSummary?.revenueChange || 0).toFixed(1)}%
                      from last period
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Transactions
                    </CardTitle>
                    <FileBarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {salesSummary?.totalTransactions || 0}
                    </div>
                    <div
                      className={`flex items-center text-xs mt-1 ${(salesSummary?.transactionChange || 0) >= 0 ? "text-accent" : "text-destructive"}`}
                    >
                      {(salesSummary?.transactionChange || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(salesSummary?.transactionChange || 0).toFixed(
                        1,
                      )}
                      % from last period
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Transaction Value
                    </CardTitle>
                    <NairaSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      ₦{((salesSummary?.avgDealSize || 0) / 1000000).toFixed(2)}
                      M
                    </div>
                    <div
                      className={`flex items-center text-xs mt-1 ${(salesSummary?.avgDealSizeChange || 0) >= 0 ? "text-accent" : "text-destructive"}`}
                    >
                      {(salesSummary?.avgDealSizeChange || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(salesSummary?.avgDealSizeChange || 0).toFixed(
                        1,
                      )}
                      % from last period
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Conversion Rate
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {salesSummary?.conversionRate || 0}%
                    </div>
                    <div
                      className={`flex items-center text-xs mt-1 ${(salesSummary?.conversionChange || 0) >= 0 ? "text-accent" : "text-destructive"}`}
                    >
                      {(salesSummary?.conversionChange || 0) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(salesSummary?.conversionChange || 0).toFixed(1)}
                      % from last period
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Revenue & Transaction Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                        tickFormatter={(value) =>
                          `₦${(value / 1000000).toFixed(1)}M`
                        }
                        label={{
                          value: "Revenue (₦)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          `₦${value.toLocaleString()}`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="revenue"
                        fill="#2563eb"
                        name="Revenue (₦)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Top Performing Assets by Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">
                          Units Sold
                        </TableHead>
                        <TableHead className="text-right">
                          Total Revenue
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSalesByAsset.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {item.asset}
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell className="text-center">
                            {item.sales}
                          </TableCell>
                          <TableCell className="text-right font-medium text-accent">
                            ₦{item.revenue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Asset Reports */}
        <TabsContent value="assets" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Assets
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {assetSummary?.totalAssets || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all categories
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published Assets
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {assetSummary?.publishedAssets || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {assetSummary?.publishedPercentage || 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Asset Value
                </CardTitle>
                <NairaSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  ₦
                  {(
                    assetTypeBreakdown.reduce(
                      (sum, t) => sum + (t.totalValue || 0),
                      0,
                    ) / 1000000000
                  ).toFixed(1)}
                  B
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined portfolio value
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Asset Value
                </CardTitle>
                <NairaSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  ₦
                  {assetSummary?.totalAssets > 0
                    ? (
                        assetTypeBreakdown.reduce(
                          (sum, t) => sum + (t.totalValue || 0),
                          0,
                        ) /
                        assetSummary.totalAssets /
                        1000000
                      ).toFixed(1)
                    : 0}
                  M
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per asset</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Asset Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={assetPerformanceData}
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
                      {assetPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Asset Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetTypeBreakdown.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.type}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₦{(item.totalValue / 1000000).toFixed(0)}M
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Investment Reports */}
        <TabsContent value="investments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Investors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {investmentSummary?.totalInvestors || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active investors
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invested
                </CardTitle>
                <NairaSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  ₦
                  {(
                    (investmentSummary?.totalInvested || 0) / 1000000000
                  ).toFixed(2)}
                  B
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Total capital
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Investment
                </CardTitle>
                <NairaSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  ₦
                  {((investmentSummary?.avgInvestment || 0) / 1000000).toFixed(
                    2,
                  )}
                  M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per investor
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fractional vs Full
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {investmentSummary?.fractionalPercent || 0}:
                  {investmentSummary?.fullPercent || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ownership split
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>
                Investment Trends: Fractional vs Full Ownership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={investmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="fractional"
                    stroke="#2563eb"
                    name="Fractional (₦)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="full"
                    stroke="#10b981"
                    name="Full Ownership (₦)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Investor Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">
                      Investor Count
                    </TableHead>
                    <TableHead className="text-right">Total Invested</TableHead>
                    <TableHead className="text-right">Avg Investment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investorCategories.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.count}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{(item.totalInvested / 1000000).toFixed(0)}M
                      </TableCell>
                      <TableCell className="text-right">
                        ₦
                        {(item.totalInvested / item.count / 1000000).toFixed(1)}
                        M
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Reports */}
        <TabsContent value="commissions" className="space-y-6">
          {loading ? (
            <div>Loading commission reports...</div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Commissions
                    </CardTitle>
                    <NairaSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      ₦
                      {commissionTrends
                        .reduce(
                          (sum, t) =>
                            sum + (t.agentComm || 0) + (t.companyComm || 0),
                          0,
                        )
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Agent Commissions
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      ₦
                      {commissionTrends
                        .reduce((sum, t) => sum + (t.agentComm || 0), 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Company Commissions
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      ₦
                      {commissionTrends
                        .reduce((sum, t) => sum + (t.companyComm || 0), 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Commission/Deal
                    </CardTitle>
                    <NairaSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      ₦
                      {commissionTrends.length > 0
                        ? Math.round(
                            commissionTrends.reduce(
                              (sum, t) =>
                                sum + (t.agentComm || 0) + (t.companyComm || 0),
                              0,
                            ) / commissionTrends.length,
                          ).toLocaleString()
                        : "0"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Commission Trends: Agent vs Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={commissionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) =>
                          `₦${value.toLocaleString()}`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="agentComm"
                        fill="#2563eb"
                        name="Agent Commission (₦)"
                      />
                      <Bar
                        dataKey="companyComm"
                        fill="#10b981"
                        name="Company Commission (₦)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Top Earning Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead className="text-center">
                          Deals Closed
                        </TableHead>
                        <TableHead className="text-center">
                          Conversion Rate
                        </TableHead>
                        <TableHead className="text-right">
                          Total Commission
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topAgents.map((agent, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {agent.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {agent.deals}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="border-accent text-accent"
                            >
                              {agent.conversion}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-accent">
                            ₦{agent.commission.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Performance Reports */}
        <TabsContent value="performance" className="space-y-6">
          {loading ? (
            <div>Loading performance reports...</div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-4">
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Overall Conversion
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {/* Example: show sum of all conversion counts */}
                      {conversionMetrics.reduce(
                        (sum, c) => sum + (c.count || 0),
                        0,
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total leads in funnel
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Contacted Leads
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {conversionMetrics.find((c) => c.stage === "CONTACTED")
                        ?.count || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      New Leads
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {conversionMetrics.find((c) => c.stage === "NEW")
                        ?.count || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Clusters
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {clusterPerformance.length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Sales Funnel Conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionMetrics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Cluster Performance vs Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cluster Name</TableHead>
                        <TableHead className="text-center">Target</TableHead>
                        <TableHead className="text-center">Achieved</TableHead>
                        <TableHead className="text-right">
                          Performance
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clusterPerformance.map((cluster, idx) => {
                        const performance = parseInt(cluster.performance);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {cluster.cluster}
                            </TableCell>
                            <TableCell className="text-center">
                              {cluster.target}
                            </TableCell>
                            <TableCell className="text-center">
                              {cluster.achieved}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  performance >= 100 ? "default" : "secondary"
                                }
                                className={
                                  performance >= 100
                                    ? "bg-accent text-accent-foreground"
                                    : performance >= 85
                                      ? "bg-warning text-warning-foreground"
                                      : ""
                                }
                              >
                                {cluster.performance}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { installmentsApi, paymentsApi } from "../../../utils/api-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Eye,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Bell,
  CreditCard} from "lucide-react";
import { NairaSign } from "@/app/components/NairaSign";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function InstallmentPayments() {
  const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);
  const [soonDueThreshold, setSoonDueThreshold] = useState(7);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [sendReminderOpen, setSendReminderOpen] = useState(false);
  const [reminderTargets, setReminderTargets] = useState<string[]>(["all"]);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderMethod, setReminderMethod] = useState("email");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<
    string[]
  >([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutProvider, setCheckoutProvider] = useState<
    "paystack" | "flutterwave"
  >("paystack");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        // Fetch all installment plans
        const allPlans = await installmentsApi.getAll();
        setInstallmentPlans(allPlans);
      } catch (error) {
        // handle error
      }
    }
    fetchPlans();
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;
    setCheckoutEmail(selectedPlan.buyerEmail || "");
    const outstanding = Math.max(
      0,
      (selectedPlan.remainingBalance || 0) - (selectedPlan.paidAmount || 0),
    );
    setCheckoutAmount(outstanding);
    setSelectedInstallmentIds([]);
  }, [selectedPlan]);

  const handleSendReminder = async (installmentIds: string[]) => {
    if (!installmentIds.length || !reminderMethod) return;
    setReminderLoading(true);
    try {
      await Promise.all(
        installmentIds.map((id) =>
          installmentsApi.sendReminder({
            installmentId: id,
            reminderDate:
              reminderDate || new Date().toISOString().split("T")[0],
            method: reminderMethod,
          }),
        ),
      );
      setSendReminderOpen(false);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send reminder",
      );
    } finally {
      setReminderLoading(false);
    }
  };

  const handleGenerateCheckoutLink = async () => {
    if (!selectedPlan || !checkoutEmail || checkoutAmount <= 0) return;

    try {
      setCheckoutLoading(true);

      const callbackUrl = `${window.location.origin}/payments/callback?provider=${checkoutProvider}&source=admin&planId=${selectedPlan.id}`;
      const response = await paymentsApi.initialize({
        provider: checkoutProvider,
        email: checkoutEmail,
        amount: checkoutAmount,
        callbackUrl,
        reference: `admin-plan-${selectedPlan.id}-${Date.now()}`,
        metadata: {
          source: "admin_installments",
          planId: selectedPlan.id,
          buyerEmail: checkoutEmail,
        },
        title: "BuyOps Installment Payment",
      });

      if (response?.authorizationUrl) {
        window.location.assign(response.authorizationUrl);
        return;
      }

      alert("Unable to generate checkout link.");
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to generate checkout link",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Calculate stats
  const activePlans = installmentPlans.filter(
    (p) => p.status === "active",
  ).length;
  const totalOutstanding = installmentPlans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.remainingBalance - p.paidAmount), 0);
  const overduePayments = installmentPlans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => {
      const overdue = p.installments.filter(
        (i: any) => i.status === "overdue",
      ).length;
      return sum + overdue;
    }, 0);

  const soonToBeDue = installmentPlans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + soonDueThreshold);
      const soon = p.installments.filter((i: any) => {
        if (i.status !== "pending" && i.status !== "upcoming") return false;
        const due = new Date(i.dueDate);
        return due >= new Date() && due <= threshold;
      }).length;
      return sum + soon;
    }, 0);
  const totalCollected = installmentPlans.reduce(
    (sum, p) => sum + p.paidAmount,
    0,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-accent text-accent-foreground">Active</Badge>
        );
      case "completed":
        return (
          <Badge className="bg-accent text-accent-foreground">Completed</Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </Badge>
        );
    }
  };

  const getInstallmentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-accent text-accent-foreground">Paid</Badge>;
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">Pending</Badge>
        );
      case "overdue":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            Overdue
          </Badge>
        );
      case "partial":
        return <Badge variant="outline">Partial</Badge>;
      case "upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      default:
        return (
          <Badge variant="outline">
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </Badge>
        );
    }
  };

  const downloadInstallmentSchedule = () => {
    if (!selectedPlan) return;

    const headers = [
      "Installment ID",
      "Due Date",
      "Amount (₦)",
      "Paid Amount (₦)",
      "Status",
      "Paid Date",
      "Payment Method",
    ];

    const csvData = selectedPlan.installments.map((inst: any) => [
      inst.id,
      inst.dueDate,
      inst.amount,
      inst.paidAmount,
      inst.status,
      inst.paidDate || "-",
      inst.paymentMethod || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: any) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `installment-schedule-${selectedPlan.id}-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPlansAsCSV = (plans: any[], filename: string) => {
    const headers = [
      "Plan ID",
      "Asset",
      "Buyer",
      "Total Amount (₦)",
      "Paid (₦)",
      "Remaining (₦)",
      "Status",
      "Next Due Date",
    ];
    const rows = plans.map((p) => [
      p.id,
      p.asset,
      p.buyer,
      p.totalAmount,
      p.paidAmount + p.downPayment,
      p.remainingBalance,
      p.status,
      p.nextDueDate || "-",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute(
      "download",
      `${filename}-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Plans
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activePlans}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Outstanding
            </CardTitle>
            <NairaSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ₦{(totalOutstanding / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Payments
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {overduePayments}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-accent">
              ₦{(totalCollected / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-warning/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Soon to be Due
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">
              {soonToBeDue}
            </div>
            <div className="mt-2">
              <Select
                value={String(soonDueThreshold)}
                onValueChange={(v) => setSoonDueThreshold(Number(v))}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Next 3 days</SelectItem>
                  <SelectItem value="7">Next 7 days</SelectItem>
                  <SelectItem value="14">Next 14 days</SelectItem>
                  <SelectItem value="30">Next 30 days</SelectItem>
                  <SelectItem value="60">Next 60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadInstallmentSchedule}>
            Download Schedule
          </Button>
          <Dialog open={sendReminderOpen} onOpenChange={setSendReminderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Bell className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Payment Reminder</DialogTitle>
                <DialogDescription>
                  Send a payment reminder to overdue customers
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Customer(s)</Label>
                  <div className="mt-1 max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-muted rounded">
                      <input
                        type="checkbox"
                        checked={reminderTargets.includes("all")}
                        onChange={(e) =>
                          setReminderTargets(e.target.checked ? ["all"] : [])
                        }
                        className="rounded border-border"
                      />
                      <span className="text-sm font-medium">
                        All Overdue Customers
                      </span>
                    </label>
                    {installmentPlans
                      .filter(
                        (p) =>
                          p.status === "overdue" ||
                          (p.installments &&
                            p.installments.some(
                              (i: any) => i.status === "overdue",
                            )),
                      )
                      .map((plan) => (
                        <label
                          key={plan.id}
                          className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-muted rounded"
                        >
                          <input
                            type="checkbox"
                            checked={
                              reminderTargets.includes("all") ||
                              reminderTargets.includes(plan.id)
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setReminderTargets((prev) =>
                                  prev
                                    .filter((t) => t !== "all")
                                    .concat(plan.id),
                                );
                              } else {
                                setReminderTargets((prev) =>
                                  prev.filter((t) => t !== plan.id),
                                );
                              }
                            }}
                            className="rounded border-border"
                          />
                          <span className="text-sm">
                            {plan.buyer} — {plan.asset}
                          </span>
                        </label>
                      ))}
                  </div>
                  {reminderTargets.length === 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Please select at least one customer.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="reminder-date">Reminder Date</Label>
                  <Input
                    id="reminder-date"
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reminder-method">Reminder Method</Label>
                  <Select
                    value={reminderMethod}
                    onValueChange={setReminderMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSendReminderOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={reminderLoading || reminderTargets.length === 0}
                  onClick={() => {
                    const overdueIds: string[] = [];
                    const targetPlans = reminderTargets.includes("all")
                      ? installmentPlans.filter(
                          (p) =>
                            p.status === "overdue" ||
                            p.installments?.some(
                              (i: any) => i.status === "overdue",
                            ),
                        )
                      : installmentPlans.filter((p) =>
                          reminderTargets.includes(p.id),
                        );
                    targetPlans.forEach((p) =>
                      p.installments
                        ?.filter((i: any) => i.status === "overdue")
                        .forEach((i: any) => overdueIds.push(i.id)),
                    );
                    handleSendReminder(overdueIds);
                  }}
                >
                  {reminderLoading ? "Sending..." : "Send Reminder"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment Plans Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment Plans</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadPlansAsCSV(installmentPlans, "all-payment-plans")
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentPlans.map((plan) => {
                    const progress = (
                      ((plan.totalAmount - plan.remainingBalance) /
                        plan.totalAmount) *
                      100
                    ).toFixed(0);
                    const outstanding = plan.remainingBalance - plan.paidAmount;
                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-mono text-sm">
                          {plan.serialId || plan.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {plan.asset}
                        </TableCell>
                        <TableCell>{plan.buyer}</TableCell>
                        <TableCell className="font-medium">
                          ₦{plan.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-accent">
                          ₦
                          {(
                            plan.paidAmount + plan.downPayment
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>₦{outstanding.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {plan.nextDueDate || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(plan.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPlan(plan)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Payment Plans</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadPlansAsCSV(
                    installmentPlans.filter((p) => p.status === "active"),
                    "active-payment-plans",
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentPlans
                    .filter((p) => p.status === "active")
                    .map((plan) => {
                      const progress = (
                        ((plan.totalAmount - plan.remainingBalance) /
                          plan.totalAmount) *
                        100
                      ).toFixed(0);
                      const outstanding =
                        plan.totalAmount - plan.remainingBalance;
                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-mono text-sm">
                            {plan.serialId || plan.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {plan.asset}
                          </TableCell>
                          <TableCell>{plan.buyer}</TableCell>
                          <TableCell className="font-medium">
                            ₦{plan.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-accent">
                            ₦
                            {(
                              plan.downPayment + plan.paidAmount
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>₦{outstanding.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="bg-accent h-2 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {plan.nextDueDate || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPlan(plan)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Completed Payment Plans</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadPlansAsCSV(
                    installmentPlans.filter((p) => p.status === "completed"),
                    "completed-payment-plans",
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentPlans
                    .filter((p) => p.status === "completed")
                    .map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-mono text-sm">
                          {plan.serialId || plan.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {plan.asset}
                        </TableCell>
                        <TableCell>{plan.buyer}</TableCell>
                        <TableCell className="font-medium">
                          ₦{plan.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-accent">
                          ₦{plan.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPlan(plan)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Plans with Overdue Payments</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadPlansAsCSV(
                    installmentPlans.filter(
                      (p) =>
                        p.status === "overdue" ||
                        (p.installments &&
                          p.installments.some(
                            (i: any) => i.status === "overdue",
                          )),
                    ),
                    "overdue-payment-plans",
                  )
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan ID</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Overdue Amount</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentPlans
                    .filter((p) => {
                      return p.installments.some(
                        (i: any) => i.status === "overdue",
                      );
                    })
                    .map((plan) => {
                      const overdueAmount = plan.installments
                        .filter((i: any) => i.status === "overdue")
                        .reduce(
                          (sum: number, i: any) =>
                            sum + (i.amount - i.paidAmount),
                          0,
                        );
                      return (
                        <TableRow key={plan.id}>
                          <TableCell className="font-mono text-sm">
                            {plan.serialId || plan.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {plan.asset}
                          </TableCell>
                          <TableCell>{plan.buyer}</TableCell>
                          <TableCell className="text-sm">
                            <div>{plan.buyerEmail}</div>
                            <div className="text-muted-foreground">
                              {plan.buyerPhone}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-destructive">
                            ₦{overdueAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {plan.nextDueDate || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPlan(plan)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Details Drawer */}
      <Sheet open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {selectedPlan && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedPlan.asset}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Plan Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Total Amount
                      </div>
                      <div className="text-2xl font-semibold">
                        ₦{selectedPlan.totalAmount.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Paid Amount
                      </div>
                      <div className="text-2xl font-semibold text-accent">
                        ₦{selectedPlan.paidAmount.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Outstanding
                      </div>
                      <div className="text-2xl font-semibold">
                        ₦
                        {(
                          selectedPlan.remainingBalance -
                          selectedPlan.paidAmount
                        ).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        Progress
                      </div>
                      <div className="text-2xl font-semibold">
                        {selectedPlan.completedInstallments}/
                        {selectedPlan.numberOfInstallments}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Buyer Information */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Buyer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedPlan.buyer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedPlan.buyerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{selectedPlan.buyerPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Plan Details */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Payment Plan Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Down Payment:
                      </span>
                      <span className="font-medium">
                        ₦{selectedPlan.downPayment.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Installment Amount:
                      </span>
                      <span className="font-medium">
                        ₦{selectedPlan.installmentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="capitalize">
                        {selectedPlan.frequency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{selectedPlan.startDate}</span>
                    </div>
                    {selectedPlan.nextDueDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Next Due Date:
                        </span>
                        <span className="font-medium">
                          {selectedPlan.nextDueDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Installment Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Installment Schedule
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadInstallmentSchedule}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Paid Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPlan.installments.map((installment: any) => (
                          <TableRow key={installment.id}>
                            <TableCell className="text-sm">
                              {installment.dueDate}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₦{installment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-accent">
                              ₦{installment.paidAmount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {getInstallmentStatusBadge(installment.status)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {installment.paidDate || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Generate Checkout Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate Checkout Link</DialogTitle>
                        <DialogDescription>
                          Send buyer to Paystack or Flutterwave checkout for
                          this plan.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label>Provider</Label>
                          <Select
                            value={checkoutProvider}
                            onValueChange={(
                              value: "paystack" | "flutterwave",
                            ) => setCheckoutProvider(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paystack">Paystack</SelectItem>
                              <SelectItem value="flutterwave">
                                Flutterwave
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="checkout-email">Payer Email</Label>
                          <Input
                            id="checkout-email"
                            type="email"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            placeholder="buyer@email.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="checkout-amount">Amount (NGN)</Label>
                          <Input
                            id="checkout-amount"
                            type="number"
                            min={1}
                            value={checkoutAmount}
                            onChange={(e) =>
                              setCheckoutAmount(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setCheckoutOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleGenerateCheckoutLink}
                          disabled={
                            checkoutLoading ||
                            !checkoutEmail ||
                            checkoutAmount <= 0
                          }
                        >
                          {checkoutLoading
                            ? "Generating..."
                            : "Proceed to Checkout"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={sendReminderOpen}
                    onOpenChange={setSendReminderOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="flex-1">
                        <Bell className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Payment Reminder</DialogTitle>
                        <DialogDescription>
                          Send a payment reminder to {selectedPlan.buyer}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="installment">
                            Overdue Installments
                          </Label>
                          <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                            {selectedPlan.installments
                              .filter((i: any) => i.status === "overdue")
                              .map((inst: any) => (
                                <div
                                  key={inst.id}
                                  className="flex items-center gap-2 mb-1"
                                >
                                  <input
                                    type="checkbox"
                                    id={`overdue-${inst.id}`}
                                    checked={selectedInstallmentIds?.includes(
                                      inst.id,
                                    )}
                                    onChange={(e) => {
                                      if (!selectedInstallmentIds) return;
                                      if (e.target.checked) {
                                        setSelectedInstallmentIds([
                                          ...selectedInstallmentIds,
                                          inst.id,
                                        ]);
                                      } else {
                                        setSelectedInstallmentIds(
                                          selectedInstallmentIds.filter(
                                            (id: string) => id !== inst.id,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`overdue-${inst.id}`}
                                    className="cursor-pointer"
                                  >
                                    {inst.dueDate} - ₦
                                    {inst.amount.toLocaleString()}
                                  </label>
                                </div>
                              ))}
                            {selectedPlan.installments.filter(
                              (i: any) => i.status === "overdue",
                            ).length === 0 && (
                              <div className="text-muted-foreground text-sm">
                                No overdue installments
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="reminder-date">Reminder Date</Label>
                          <Input
                            id="reminder-date"
                            type="date"
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="reminder-method">
                            Reminder Method
                          </Label>
                          <Select
                            value={reminderMethod}
                            onValueChange={setReminderMethod}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setSendReminderOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={
                            reminderLoading ||
                            selectedInstallmentIds.length === 0
                          }
                          onClick={() =>
                            handleSendReminder(selectedInstallmentIds)
                          }
                        >
                          {reminderLoading ? "Sending..." : "Send Reminder"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

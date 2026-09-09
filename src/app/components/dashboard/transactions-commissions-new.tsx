import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatDate } from "../../../utils/format";
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
import { useEffect, useState, useRef } from "react";
import { transactionsApi } from "../../../utils/api-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  TrendingUp,
  Activity,
  Download,
  Clock,
  Upload,
  FileCheck,
  AlertCircle,
  Send} from "lucide-react";
import { NairaSign } from "@/app/components/NairaSign";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";

export function TransactionsCommissions() {
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State for month filters
  const [selectedTransactionMonth, setSelectedTransactionMonth] = useState(
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
  );

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        const data = await transactionsApi.getAll({
          month: selectedTransactionMonth,
        });
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [selectedTransactionMonth]);

  // State for selected commissions to send
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(
    new Set(),
  );
  const [sendCommissionDialogOpen, setSendCommissionDialogOpen] =
    useState(false);
  const [paymentProofDialogOpen, setPaymentProofDialogOpen] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const paymentProofFileRef = useRef<HTMLInputElement>(null);
  const [commissionEmail, setCommissionEmail] = useState(
    () => localStorage.getItem("commissionEmail") || "",
  );
  const [commissionTemplate, setCommissionTemplate] = useState(
    () => localStorage.getItem("commissionTemplate") || "",
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // Separate unpaid and paid commissions based on backend status
  const unpaidCommissions = transactions.filter(
    (t) => t.status === "unpaid" || t.status === "sent",
  );

  const paidCommissions = transactions.filter((t) => t.status === "paid");

  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(
    (t) => t.status === "paid",
  ).length;

  // Calculate earned commissions (from paid transactions)
  const totalEarnedCommission = transactions.reduce((sum, t) => {
    if (t.status === "paid") {
      // Parse the commission value if it's a string with ₦ symbol
      const commission =
        typeof t.totalCommission === "string"
          ? parseFloat(t.totalCommission.replace(/[₦,]/g, ""))
          : t.totalCommission || 0;
      return sum + commission;
    }
    return sum;
  }, 0);

  // Calculate pending commissions (from unpaid/sent transactions)
  const totalPendingCommission = transactions.reduce((sum, t) => {
    if (t.status === "unpaid" || t.status === "sent") {
      const commission =
        typeof t.totalCommission === "string"
          ? parseFloat(t.totalCommission.replace(/[₦,]/g, ""))
          : t.totalCommission || 0;
      return sum + commission;
    }
    return sum;
  }, 0);

  const totalRevenue = transactions.reduce((sum, t) => {
    const value =
      typeof t.propertyValue === "string"
        ? parseFloat(t.propertyValue.replace(/[₦,]/g, ""))
        : t.propertyValue || 0;
    return sum + value;
  }, 0);

  const downloadTransactions = () => {
    // Convert transactions to CSV format
    const headers = [
      "Transaction ID",
      "Asset",
      "Buyer",
      "Lead Agent",
      "Closer Agent",
      "Company",
      "Amount (₦)",
      "Lead Commission (₦)",
      "Closer Commission (₦)",
      "Total Commission (₦)",
      "Status",
      "Date",
    ];

    const csvData = transactions.map((t) => [
      t.id,
      t.asset,
      t.buyer,
      t.leadAgent,
      t.closerAgent,
      t.company,
      t.amount,
      t.leadCommission,
      t.closerCommission,
      t.totalCommission,
      t.status,
      t.date,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `buyops-transactions-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  const handlePaymentProofFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
    }
  };

  const handleSendCommissions = async () => {
    try {
      setSendError(null);
      setLoading(true);
      localStorage.setItem("commissionEmail", commissionEmail);
      localStorage.setItem("commissionTemplate", commissionTemplate);
      await transactionsApi.sendCommissions(
        Array.from(selectedCommissions),
        commissionEmail,
        commissionTemplate,
      );
      // Refresh transactions to get updated status
      const data = await transactionsApi.getAll({
        month: selectedTransactionMonth,
      });
      setTransactions(data);
      setSelectedCommissions(new Set());
      setSendCommissionDialogOpen(false);
    } catch (error) {
      console.error("Failed to send commissions:", error);
      setSendError(
        error instanceof Error
          ? error.message
          : "Failed to send commissions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPaymentProof = async () => {
    if (paymentProofFile) {
      try {
        setProofError(null);
        setLoading(true);
        await transactionsApi.uploadPaymentProof(paymentProofFile);
        // Refresh transactions to get updated status
        const data = await transactionsApi.getAll({
          month: selectedTransactionMonth,
        });
        setTransactions(data);

        // Reset file input
        if (paymentProofFileRef.current) {
          paymentProofFileRef.current.value = "";
        }
        setPaymentProofFile(null);
        setPaymentProofDialogOpen(false);
      } catch (error) {
        console.error("Failed to upload payment proof:", error);
        setProofError(
          error instanceof Error
            ? error.message
            : "Failed to upload payment proof. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCommissionSelection = (id: string) => {
    const newSelection = new Set(selectedCommissions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCommissions(newSelection);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCommissions(
        new Set(
          unpaidCommissions
            .filter((t) => t.status === "unpaid")
            .map((t) => t.id),
        ),
      );
    } else {
      setSelectedCommissions(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {completedTransactions}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <NairaSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ₦{(totalRevenue / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Earned Commission
            </CardTitle>
            <NairaSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-accent">
              ₦{totalEarnedCommission.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Commission
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">
              ₦{totalPendingCommission.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="commissions">Commission Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>Transaction History</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="transaction-month"
                      className="text-sm whitespace-nowrap"
                    >
                      Filter by Month:
                    </Label>
                    <Select
                      value={selectedTransactionMonth}
                      onValueChange={setSelectedTransactionMonth}
                    >
                      <SelectTrigger
                        id="transaction-month"
                        className="w-[180px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={downloadTransactions} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Lead Agent</TableHead>
                      <TableHead>Closer Agent</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.serialId || transaction.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.asset}
                        </TableCell>
                        <TableCell>{transaction.buyer}</TableCell>
                        <TableCell className="text-sm">
                          {transaction.leadAgent}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.closerAgent}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.accountNumber || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.company}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.propertyValue ||
                            `₦${transaction.amount?.toLocaleString() || 0}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.paymentType === "full"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.paymentType === "full"
                              ? "Full"
                              : "Installment"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-accent">
                          {transaction.totalCommission}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          {/* Unpaid Commissions */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Unpaid Commissions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Commissions that haven't been paid yet
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="unpaid-commission-month"
                      className="text-sm whitespace-nowrap"
                    >
                      Filter by Month:
                    </Label>
                    <Select
                      value={selectedTransactionMonth}
                      onValueChange={setSelectedTransactionMonth}
                    >
                      <SelectTrigger
                        id="unpaid-commission-month"
                        className="w-[180px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog
                    open={sendCommissionDialogOpen}
                    onOpenChange={setSendCommissionDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button disabled={selectedCommissions.size === 0}>
                        <Send className="h-4 w-4 mr-2" />
                        Send{" "}
                        {selectedCommissions.size > 0
                          ? `(${selectedCommissions.size})`
                          : ""}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Commissions for Payment</DialogTitle>
                        <DialogDescription>
                          Mark these commissions as sent to the accounts
                          department for processing.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        {sendError && (
                          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{sendError}</span>
                          </div>
                        )}
                        <p className="text-sm">
                          You are about to send{" "}
                          <strong>{selectedCommissions.size}</strong>{" "}
                          commission(s) for payment processing.
                        </p>
                        <div className="space-y-1">
                          <Label htmlFor="commission-email">
                            Recipient Email
                          </Label>
                          <Input
                            id="commission-email"
                            type="email"
                            value={commissionEmail}
                            onChange={(e) => setCommissionEmail(e.target.value)}
                            placeholder="accounts@company.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            Saved automatically for next time
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="commission-template">
                            Email Template
                          </Label>
                          <Textarea
                            id="commission-template"
                            value={commissionTemplate}
                            onChange={(e) =>
                              setCommissionTemplate(e.target.value)
                            }
                            placeholder="Please find attached the commission list for this period. Kindly process payment at your earliest convenience."
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground">
                            Template is saved automatically
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setSendCommissionDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendCommissions}
                          disabled={!commissionEmail}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Commissions
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedCommissions.size ===
                              unpaidCommissions.filter(
                                (t) => t.status === "unpaid",
                              ).length && unpaidCommissions.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Sale Amount</TableHead>
                      <TableHead>Lead Agent</TableHead>
                      <TableHead>Account No.</TableHead>
                      <TableHead>Lead Commission</TableHead>
                      <TableHead>Closer Agent</TableHead>
                      <TableHead>Closer Commission</TableHead>
                      <TableHead>Total Commission</TableHead>
                      <TableHead>Payment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={13}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No unpaid commissions for this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      unpaidCommissions.map((transaction) => {
                        const isInstallment =
                          transaction.paymentType === "installment";
                        const hasEarnedCommission =
                          "earnedTotalCommission" in transaction;
                        const paymentStatus = transaction.status || "unpaid";
                        const canSelect = paymentStatus === "unpaid";

                        return (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {canSelect && (
                                <Checkbox
                                  checked={selectedCommissions.has(
                                    transaction.id,
                                  )}
                                  onCheckedChange={() =>
                                    toggleCommissionSelection(transaction.id)
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {transaction.serialId || transaction.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.asset}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  isInstallment ? "secondary" : "default"
                                }
                              >
                                {isInstallment ? "Installment" : "Full"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              ₦{transaction.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              {transaction.leadAgent}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {transaction.accountNumber || "—"}
                            </TableCell>
                            <TableCell>
                              {isInstallment && hasEarnedCommission ? (
                                <div className="space-y-1">
                                  <div className="text-accent font-medium">
                                    ₦
                                    {transaction.earnedLeadCommission?.toLocaleString()}
                                    <span className="text-xs text-muted-foreground ml-1">
                                      earned
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₦
                                    {transaction.pendingLeadCommission?.toLocaleString()}{" "}
                                    pending
                                  </div>
                                </div>
                              ) : (
                                <div className="text-accent">
                                  {transaction.leadCommission}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {transaction.closerAgent}
                            </TableCell>
                            <TableCell>
                              {isInstallment && hasEarnedCommission ? (
                                <div className="space-y-1">
                                  <div className="text-accent font-medium">
                                    ₦
                                    {transaction.earnedCloserCommission?.toLocaleString()}
                                    <span className="text-xs text-muted-foreground ml-1">
                                      earned
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₦
                                    {transaction.pendingCloserCommission?.toLocaleString()}{" "}
                                    pending
                                  </div>
                                </div>
                              ) : (
                                <div className="text-accent">
                                  ₦
                                  {transaction.closerCommission.toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isInstallment && hasEarnedCommission ? (
                                <div className="space-y-1">
                                  <div className="font-semibold text-accent">
                                    ₦
                                    {transaction.earnedTotalCommission?.toLocaleString()}
                                    <span className="text-xs text-muted-foreground ml-1 font-normal">
                                      earned
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₦
                                    {transaction.pendingTotalCommission?.toLocaleString()}{" "}
                                    pending
                                  </div>
                                </div>
                              ) : (
                                <div className="font-semibold text-accent">
                                  {transaction.totalCommission}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  paymentStatus === "sent"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {paymentStatus === "sent"
                                  ? "Sent to Account"
                                  : "Unpaid"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Upload Payment Proof */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Upload Payment Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload Instructions</p>
                      <p className="text-sm text-muted-foreground">
                        After sending commissions to the account department and
                        payment has been made, upload the payment proof
                        (CSV/Excel file) to mark commissions as paid.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-proof-file">
                    Payment Proof (CSV or Excel)
                  </Label>
                  <Input
                    id="payment-proof-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handlePaymentProofFileChange}
                    ref={paymentProofFileRef}
                  />
                  {paymentProofFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {paymentProofFile.name}
                    </p>
                  )}
                </div>

                <Dialog
                  open={paymentProofDialogOpen}
                  onOpenChange={setPaymentProofDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button disabled={!paymentProofFile}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Mark as Paid
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Payment Proof Upload</DialogTitle>
                      <DialogDescription>
                        This will mark all sent commissions as paid and update
                        payment records.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {proofError && (
                        <div className="flex items-start gap-2 p-3 mb-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{proofError}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                        <FileCheck className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <div className="text-sm space-y-1">
                          <p className="font-medium">What happens next:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>
                              Commission records will be updated to 'Paid'
                            </li>
                            <li>Payment proof will be stored</li>
                            <li>Agents will be notified of payment</li>
                            <li>Transaction history will be logged</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setPaymentProofDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUploadPaymentProof}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Confirm & Upload
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Paid Commissions */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Paid Commissions</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Commissions that have been paid
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Sale Amount</TableHead>
                      <TableHead>Lead Agent</TableHead>
                      <TableHead>Account No.</TableHead>
                      <TableHead>Lead Commission</TableHead>
                      <TableHead>Closer Agent</TableHead>
                      <TableHead>Closer Commission</TableHead>
                      <TableHead>Total Commission</TableHead>
                      <TableHead>Payment Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidCommissions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No paid commissions for this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      paidCommissions.map((transaction) => {
                        const isInstallment =
                          transaction.paymentType === "installment";
                        const hasEarnedCommission =
                          "earnedTotalCommission" in transaction;

                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-sm">
                              {transaction.serialId || transaction.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.asset}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  isInstallment ? "secondary" : "default"
                                }
                              >
                                {isInstallment ? "Installment" : "Full"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              ₦{transaction.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm">
                              {transaction.leadAgent}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {transaction.accountNumber || "—"}
                            </TableCell>
                            <TableCell>
                              {isInstallment && hasEarnedCommission ? (
                                <div className="space-y-1">
                                  <div className="text-accent font-medium">
                                    ₦
                                    {transaction.earnedLeadCommission?.toLocaleString()}
                                    <span className="text-xs text-muted-foreground ml-1">
                                      earned
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₦
                                    {transaction.pendingLeadCommission?.toLocaleString()}{" "}
                                    pending
                                  </div>
                                </div>
                              ) : (
                                <div className="text-accent">
                                  {transaction.leadCommission}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {transaction.closerAgent}
                            </TableCell>
                            <TableCell>
                              {isInstallment && hasEarnedCommission ? (
                                <div className="space-y-1">
                                  <div className="text-accent font-medium">
                                    ₦
                                    {transaction.earnedCloserCommission?.toLocaleString()}
                                    <span className="text-xs text-muted-foreground ml-1">
                                      earned
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₦
                                    {transaction.pendingCloserCommission?.toLocaleString()}{" "}
                                    pending
                                  </div>
                                </div>
                              ) : (
                                <div className="text-accent">
                                  {transaction.closerCommission}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {isInstallment && hasEarnedCommission ? (
                                <div className="space-y-1">
                                  <div className="font-semibold text-accent">
                                    ₦
                                    {transaction.earnedTotalCommission?.toLocaleString()}
                                    <span className="text-xs text-muted-foreground ml-1 font-normal">
                                      earned
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ₦
                                    {transaction.pendingTotalCommission?.toLocaleString()}{" "}
                                    pending
                                  </div>
                                </div>
                              ) : (
                                <div className="font-semibold text-accent">
                                  {transaction.totalCommission}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="default"
                                className="bg-accent text-accent-foreground"
                              >
                                Paid
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

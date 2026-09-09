import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { leadsApi, clustersApi } from "../../../utils/api-service";
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Send,
  Filter,
  Upload,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
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
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAuth } from "../auth-provider";
import { formatCurrency, formatDate } from "../../../utils/format";

type LeadSource = "investor-app" | "agent" | "team-lead" | "freelancer";

type Lead = {
  id: string;
  serialId?: string;
  name: string;
  email: string;
  phone: string;
  assetInterest: string;
  asset?: { id: string; name: string; serialId?: string };
  budget: number;
  source: string;
  leadSource: LeadSource;
  createdBy?: { id: string; name: string };
  status: "pending" | "assigned" | "available";
  assignedTo: { id: string; name: string } | null;
  assignedCluster: string | null;
  dateReceived: string;
};

export function LeadManagement() {
  const { data: user } = useAuth();
  const [assignLeadOpen, setAssignLeadOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(
    new Set(),
  );
  const [assignmentType, setAssignmentType] = useState<"cluster" | "all">(
    "cluster",
  );
  const [selectedCluster, setSelectedCluster] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");

  const [clusters, setClusters] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLeadsAndClusters();
  }, []);

  const fetchLeadsAndClusters = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsData, clustersData] = await Promise.all([
        leadsApi.getAll(),
        clustersApi.getAll(),
      ]);
      setLeads(leadsData);
      setClusters(clustersData);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch leads or clusters");
    } finally {
      setLoading(false);
    }
  };

  const investorAppLeads = leads.filter(
    (lead) => lead.leadSource === "investor-app",
  );
  const pendingLeads = investorAppLeads.filter(
    (lead) => lead.status === "pending",
  );
  const assignedLeads = investorAppLeads.filter(
    (lead) => lead.status === "assigned",
  );
  const availableLeads = leads.filter((lead) => lead.status === "available");

  const allLeadsFiltered =
    sourceFilter === "all"
      ? leads
      : leads.filter((lead) => lead.leadSource === sourceFilter);

  const getLeadSourceBadgeColor = (leadSource: LeadSource) => {
    switch (leadSource) {
      case "investor-app":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "agent":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "team-lead":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "freelancer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "";
    }
  };

  const getLeadSourceLabel = (leadSource: LeadSource) => {
    switch (leadSource) {
      case "investor-app":
        return "Investor App";
      case "agent":
        return "Agent";
      case "team-lead":
        return "Team Lead";
      case "freelancer":
        return "Freelancer";
      default:
        return "";
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeadIds);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeadIds(newSelection);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(pendingLeads.map((lead) => lead.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleBulkImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const result = await leadsApi.bulkImport(file);
      toast.success(
        `Import complete — ${result.created} created, ${result.skipped} skipped` +
          (result.errors?.length ? `. ${result.errors.length} error(s).` : ""),
      );
      await fetchLeadsAndClusters();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Import failed",
      );
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAssignLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      if (
        !selectedLeadIds.size ||
        (assignmentType === "cluster" && !selectedCluster)
      ) {
        toast.error("Please select at least one lead and a cluster.");
        setError("Please select at least one lead and a cluster.");
        setLoading(false);
        return;
      }
      const assignPromises = Array.from(selectedLeadIds).map(async (leadId) => {
        if (assignmentType === "all") {
          await leadsApi.updateStatus(leadId, "available");
        } else {
          await leadsApi.assign(leadId, selectedCluster);
        }
      });
      await Promise.all(assignPromises);
      await fetchLeadsAndClusters();
      setSelectedLeadIds(new Set());
      setAssignLeadOpen(false);
      setSelectedCluster("");
      setAssignmentType("cluster");
      toast.success("Leads assigned successfully.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to assign leads";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lead Stats */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{leads.length}</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">
                {investorAppLeads.length} from app
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {leads.filter((l) => l.leadSource !== "investor-app").length}{" "}
                from sales team
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Assignment
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">
              {pendingLeads.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Investor app leads only
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assigned to Clusters
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-accent">
              {leads.filter((l) => l.status === "assigned").length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">All sources</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available to All
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {availableLeads.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Investor app leads only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="assign" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assign">Assign Leads</TabsTrigger>
          <TabsTrigger value="all">All Leads</TabsTrigger>
        </TabsList>

        {/* Tab 1: Assign Leads */}
        <TabsContent value="assign" className="space-y-6">
          {/* Pending Leads Table */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Lead Assignment</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Distribute investor app leads to clusters or make them
                  available to all
                </p>
              </div>
              <Dialog open={assignLeadOpen} onOpenChange={setAssignLeadOpen}>
                <DialogTrigger asChild>
                  <Button disabled={selectedLeadIds.size === 0}>
                    <Send className="h-4 w-4 mr-2" />
                    Assign{" "}
                    {selectedLeadIds.size > 0
                      ? `(${selectedLeadIds.size})`
                      : ""}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Leads</DialogTitle>
                    <DialogDescription>
                      Choose how to distribute the selected leads
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                    <div>
                      <Label>Assignment Type</Label>
                      <Select
                        value={assignmentType}
                        onValueChange={(value: "cluster" | "all") =>
                          setAssignmentType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cluster">
                            Assign to Specific Cluster
                          </SelectItem>
                          <SelectItem value="all">
                            Make Available to All Clusters
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {assignmentType === "cluster" && (
                      <div>
                        <Label>Select Cluster</Label>
                        <Select
                          value={selectedCluster}
                          onValueChange={setSelectedCluster}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a cluster" />
                          </SelectTrigger>
                          <SelectContent>
                            {clusters.map((cluster) => (
                              <SelectItem key={cluster.id} value={cluster.id}>
                                {cluster.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            What happens next:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignmentType === "all"
                              ? "All agents in every cluster will be able to view and work on these leads."
                              : "Only agents in the selected cluster will have access to these leads."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setAssignLeadOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignLeads}
                      disabled={
                        assignmentType === "cluster" && !selectedCluster
                      }
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Assign Leads
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedLeadIds.size === pendingLeads.length &&
                          pendingLeads.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Asset Interest</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No pending leads to assign
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedLeadIds.has(lead.id)}
                            onCheckedChange={() => toggleLeadSelection(lead.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {lead.serialId || lead.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{lead.email}</span>
                            <span className="text-muted-foreground">
                              {lead.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {lead.asset?.name || lead.assetInterest || "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(lead.budget, true, user?.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              lead.status === "pending"
                                ? "border-yellow-500 text-yellow-600"
                                : lead.status === "assigned"
                                  ? "border-blue-500 text-blue-600"
                                  : lead.status === "available"
                                    ? "border-green-500 text-green-600"
                                    : "border-muted-foreground text-muted-foreground"
                            }
                          >
                            {lead.status ?? "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(
                            lead.dateReceived,
                            user?.dateFormat,
                            user?.timezone,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Assigned & Available Leads */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Assigned & Available Investor App Leads</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View investor app leads that have been distributed to clusters
                or made available to all
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    {/* <TableHead>Asset Interest</TableHead> */}
                    <TableHead>Budget</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...assignedLeads, ...availableLeads].length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No assigned or available leads yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...assignedLeads, ...availableLeads].map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-mono text-sm">
                          {lead.serialId || lead.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{lead.email}</span>
                            <span className="text-muted-foreground">
                              {lead.phone}
                            </span>
                          </div>
                        </TableCell>
                        {/* <TableCell className="text-sm">
                          {lead.assetInterest}
                        </TableCell> */}
                        <TableCell className="font-medium">
                          {formatCurrency(lead.budget, true, user?.currency)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {lead.assignedTo?.user?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lead.status === "assigned"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              lead.status === "assigned"
                                ? "bg-accent text-accent-foreground"
                                : ""
                            }
                          >
                            {lead.status === "assigned"
                              ? "Assigned"
                              : "Available to All"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(
                            lead.dateReceived,
                            user?.dateFormat,
                            user?.timezone,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: All Leads */}
        <TabsContent value="all" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Leads</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  View all leads from the investor app and sales team members
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleBulkImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkImportClick}
                  disabled={importLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importLoading ? "Importing…" : "Import Excel"}
                </Button>
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={sourceFilter}
                  onValueChange={(value: LeadSource | "all") =>
                    setSourceFilter(value)
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="investor-app">Investor App</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="team-lead">Team Lead</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">About Lead Sources</p>
                    <p className="text-sm text-muted-foreground">
                      Only leads from the{" "}
                      <span className="font-medium text-foreground">
                        Investor App
                      </span>{" "}
                      can be assigned to clusters. Leads created by agents, team
                      leads, and freelancers are automatically assigned to their
                      respective clusters and are shown here for viewing
                      purposes only.
                    </p>
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    {/* <TableHead>Asset Interest</TableHead> */}
                    <TableHead>Budget</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLeadsFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No leads found for the selected source
                      </TableCell>
                    </TableRow>
                  ) : (
                    allLeadsFiltered.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-mono text-sm">
                          {lead.serialId || lead.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {lead.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{lead.email}</span>
                            <span className="text-muted-foreground">
                              {lead.phone}
                            </span>
                          </div>
                        </TableCell>
                        {/* <TableCell className="text-sm">
                          {lead.assetInterest}
                        </TableCell> */}
                        <TableCell className="font-medium">
                          {formatCurrency(lead.budget, true, user?.currency)}
                        </TableCell>
                        <TableCell>
                          {lead.leadSource === "investor-app" ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Investor App
                            </Badge>
                          ) : (
                            <div className="text-sm">
                              <div className="font-medium">
                                {lead.createdBy?.name || "—"}
                              </div>
                              <Badge
                                className={`mt-1 ${getLeadSourceBadgeColor(lead.leadSource)}`}
                              >
                                {getLeadSourceLabel(lead.leadSource)}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {lead.assignedTo?.user?.name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              lead.status === "assigned"
                                ? "border-accent text-accent"
                                : lead.status === "available"
                                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                  : "border-warning text-warning"
                            }
                          >
                            {lead.status === "assigned"
                              ? "Assigned"
                              : lead.status === "available"
                                ? "Available"
                                : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(
                            lead.dateReceived,
                            user?.dateFormat,
                            user?.timezone,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

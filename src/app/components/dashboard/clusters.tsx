import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Users, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { NairaSign } from "@/app/components/NairaSign";
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
import { Input } from "../ui/input";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { usersApi, clustersApi } from "../../../utils/api-service";
import { toast } from "sonner";

type ClusterForm = {
  name: string;
  code: string;
  teamLead: string;
  location: string;
  status: string;
  commissionType: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
};

const EMPTY_FORM: ClusterForm = {
  name: "",
  code: "",
  teamLead: "",
  location: "",
  status: "ACTIVE",
  commissionType: "AGENT",
  accountName: "",
  accountNumber: "",
  bankName: "",
};

const extractError = (error: any) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  // Detect duplicate/unique constraint error (backend may return 500 or 400/409)
  const rawMsg = message || error?.message || "";
  if (
    status === 500 ||
    (status === 400 && /unique|duplicate|already exists/i.test(rawMsg))
  ) {
    if (/unique|duplicate|already exists/i.test(rawMsg)) {
      return "A cluster with this name or code already exists. Please use a different name.";
    }
    if (status === 500) {
      return "A cluster with this name or code may already exist. Please check and try a different name.";
    }
  }
  return rawMsg || "Request failed";
};

export function Clusters() {
  const [createClusterOpen, setCreateClusterOpen] = useState(false);
  const [editClusterOpen, setEditClusterOpen] = useState(false);
  const [deleteClusterOpen, setDeleteClusterOpen] = useState(false);
  const [viewCluster, setViewCluster] = useState<any | null>(null);

  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    null,
  );
  const [clusters, setClusters] = useState<any[]>([]);
  const [clusterStats, setClusterStats] = useState<any>(null);
  const [teamLeads, setTeamLeads] = useState<any[]>([]);

  const [createForm, setCreateForm] = useState<ClusterForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ClusterForm>(EMPTY_FORM);
  const [editBaseline, setEditBaseline] = useState<ClusterForm>(EMPTY_FORM);

  const [loading, setLoading] = useState(false);

  const isCreateValid = useMemo(
    () =>
      !!createForm.name &&
      !!createForm.code &&
      !!createForm.teamLead &&
      !!createForm.location,
    [createForm],
  );

  const isEditValid = useMemo(
    () =>
      !!editForm.name &&
      !!editForm.code &&
      !!editForm.teamLead &&
      !!editForm.location,
    [editForm],
  );

  const isEditDirty = useMemo(
    () => JSON.stringify(editForm) !== JSON.stringify(editBaseline),
    [editForm, editBaseline],
  );

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        clustersApi.getAll(),
        clustersApi.getStats(),
      ]);
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.clusters)
          ? data.clusters
          : Array.isArray(data?.items)
            ? data.items
            : [];
      setClusters(rows);
      setClusterStats(stats);
    } catch (err: any) {
      toast.error(extractError(err));
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const data = await usersApi.getAll({ role: "TEAM_LEAD" });
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data?.items)
            ? data.items
            : [];
      setTeamLeads(rows);
    } catch {
      setTeamLeads([]);
    }
  };

  useEffect(() => {
    fetchClusters();
    fetchTeamLeads();
  }, []);

  const getLeadLabel = (leadIdOrName: string) => {
    const match = teamLeads.find((a) => a.id === leadIdOrName);
    return match?.name || leadIdOrName || "—";
  };

  const handleCreateCluster = async () => {
    if (!isCreateValid) return;
    try {
      await clustersApi.create(createForm);
      await fetchClusters();
      setCreateClusterOpen(false);
      setCreateForm(EMPTY_FORM);
      toast.success("Cluster created successfully");
    } catch (err: any) {
      toast.error(extractError(err));
    }
  };

  const openEdit = (cluster: any) => {
    const next = {
      name: cluster?.name || "",
      code: cluster?.code || "",
      teamLead: cluster?.managerId || cluster?.teamLead || "",
      location: cluster?.location || "",
      status: String(cluster?.status || "ACTIVE").toUpperCase(),
      commissionType: cluster?.commissionType || "AGENT",
      accountName: cluster?.accountName || "",
      accountNumber: cluster?.accountNumber || "",
      bankName: cluster?.bankName || "",
    };
    setSelectedClusterId(cluster.id);
    setEditBaseline(next);
    setEditForm(next);
    setViewCluster(null);
    setEditClusterOpen(true);
  };

  const handleUpdateCluster = async () => {
    if (!selectedClusterId || !isEditValid || !isEditDirty) return;
    try {
      await clustersApi.update(selectedClusterId, editForm);
      await fetchClusters();
      setEditClusterOpen(false);
      setSelectedClusterId(null);
      toast.success("Cluster updated successfully");
    } catch (err: any) {
      toast.error(extractError(err));
    }
  };

  const confirmDeleteCluster = async () => {
    if (!selectedClusterId) return;
    try {
      await clustersApi.delete(selectedClusterId);
      await fetchClusters();
      toast.success("Cluster deleted successfully");
    } catch (err: any) {
      toast.error(extractError(err));
    } finally {
      setDeleteClusterOpen(false);
      setSelectedClusterId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clusters
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{clusters.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {clusterStats?.totalAgents ??
                clusters.reduce(
                  (sum, cluster) => sum + Number(cluster.agents || 0),
                  0,
                )}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commission
            </CardTitle>
            {/* <NairaSign className="h-4 w-4 text-muted-foreground" /> */}
            <p className="text-muted text-xl">₦</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ₦
              {clusters
                .reduce((sum, c) => sum + Number(c.totalCommission || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cluster Performance</CardTitle>
          <Dialog open={createClusterOpen} onOpenChange={setCreateClusterOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Cluster
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create New Cluster</DialogTitle>
                <DialogDescription>
                  Enter the details for the new cluster.
                </DialogDescription>
              </DialogHeader>
              <ClusterFormFields
                form={createForm}
                setForm={setCreateForm}
                teamLeads={teamLeads}
                prefix="create"
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateClusterOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCluster} disabled={!isCreateValid}>
                  Create Cluster
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading clusters...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cluster ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>Agents</TableHead>
                    <TableHead>Active Assets</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clusters.map((cluster) => (
                    <TableRow key={cluster.id}>
                      <TableCell className="font-medium">
                        {cluster.serialId || cluster.id}
                      </TableCell>
                      <TableCell>{cluster.name}</TableCell>
                      <TableCell>{cluster.teamLead || "—"}</TableCell>
                      <TableCell>{cluster.agents ?? 0}</TableCell>
                      <TableCell>{cluster.activeAssets ?? 0}</TableCell>
                      <TableCell>
                        ₦{Number(cluster.totalCommission || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            String(cluster.status || "").toLowerCase() ===
                            "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {String(cluster.status || "UNKNOWN").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewCluster(cluster)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(cluster)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedClusterId(cluster.id);
                              setDeleteClusterOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editClusterOpen} onOpenChange={setEditClusterOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Cluster</DialogTitle>
            <DialogDescription>
              Update the details for this cluster.
            </DialogDescription>
          </DialogHeader>
          <ClusterFormFields
            form={editForm}
            setForm={setEditForm}
            teamLeads={teamLeads}
            prefix="edit"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClusterOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCluster}
              disabled={!isEditValid || !isEditDirty}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteClusterOpen} onOpenChange={setDeleteClusterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cluster</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cluster? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteClusterOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCluster}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!viewCluster} onOpenChange={() => setViewCluster(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {viewCluster && (
            <>
              <SheetHeader>
                <SheetTitle>{viewCluster.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Cluster ID
                  </div>
                  <div className="font-mono">
                    {viewCluster.serialId || viewCluster.id}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Code</div>
                  <div>{viewCluster.code || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Team Lead</div>
                  <div>
                    {getLeadLabel(viewCluster.managerId) ||
                      viewCluster.teamLead ||
                      "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div>{viewCluster.location || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                  <div>{viewCluster.agents ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Active Assets
                  </div>
                  <div>{viewCluster.activeAssets ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Total Commission
                  </div>
                  <div>
                    ₦{Number(viewCluster.totalCommission || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div>
                    {String(viewCluster.status || "UNKNOWN").toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Commission Type
                  </div>
                  <div>{viewCluster.commissionType || "—"}</div>
                </div>
              </div>
              {(viewCluster.bankName ||
                viewCluster.accountName ||
                viewCluster.accountNumber) && (
                <div className="mt-4 p-3 border rounded-lg bg-muted/40 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Account Details
                  </p>
                  {viewCluster.bankName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank</span>
                      <span>{viewCluster.bankName}</span>
                    </div>
                  )}
                  {viewCluster.accountName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Account Name
                      </span>
                      <span>{viewCluster.accountName}</span>
                    </div>
                  )}
                  {viewCluster.accountNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account No.</span>
                      <span className="font-mono">
                        {viewCluster.accountNumber}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ClusterFormFields({
  form,
  setForm,
  teamLeads,
  prefix,
}: {
  form: ClusterForm;
  setForm: Dispatch<SetStateAction<ClusterForm>>;
  teamLeads: any[];
  prefix: string;
}) {
  const update = (field: keyof ClusterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid gap-6 py-4">
      <div>
        <Label htmlFor={`${prefix}-cluster-name`}>Cluster Name</Label>
        <Input
          id={`${prefix}-cluster-name`}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g., Lagos Island Cluster"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-cluster-code`}>Cluster Code</Label>
        <Input
          id={`${prefix}-cluster-code`}
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
          placeholder="e.g., CLR-004"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-team-lead`}>Team Lead</Label>
        <Select
          value={form.teamLead}
          onValueChange={(value) => update("teamLead", value)}
        >
          <SelectTrigger id={`${prefix}-team-lead`}>
            <SelectValue placeholder="Select a team lead" />
          </SelectTrigger>
          <SelectContent>
            {teamLeads.map((lead) => (
              <SelectItem
                key={lead.id}
                value={lead.userId || lead.user?.id || lead.id}
              >
                {lead.name || lead.email || lead.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${prefix}-location`}>Location</Label>
        <Input
          id={`${prefix}-location`}
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="e.g., Lagos, Nigeria"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-status`}>Status</Label>
        <Select
          value={form.status}
          onValueChange={(value) => update("status", value)}
        >
          <SelectTrigger id={`${prefix}-status`}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${prefix}-commission-type`}>
          Commission Distribution
        </Label>
        <Select
          value={form.commissionType}
          onValueChange={(value) => update("commissionType", value)}
        >
          <SelectTrigger id={`${prefix}-commission-type`}>
            <SelectValue placeholder="Select commission type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AGENT">
              Direct to Agent (agent keeps commission)
            </SelectItem>
            <SelectItem value="CLUSTER">
              Cluster-Based (commission pooled to cluster)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.commissionType === "CLUSTER" && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/40">
          <p className="text-sm font-medium">Cluster Account Details</p>
          <p className="text-xs text-muted-foreground">
            Commissions will be remitted to this account.
          </p>
          <div>
            <Label htmlFor={`${prefix}-bank-name`}>Bank Name *</Label>
            <Input
              id={`${prefix}-bank-name`}
              value={form.bankName}
              onChange={(e) => update("bankName", e.target.value)}
              placeholder="e.g., First Bank of Nigeria"
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}-account-name`}>Account Name *</Label>
            <Input
              id={`${prefix}-account-name`}
              value={form.accountName}
              onChange={(e) => update("accountName", e.target.value)}
              placeholder="e.g., Lagos Island Cluster Account"
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}-account-number`}>Account Number *</Label>
            <Input
              id={`${prefix}-account-number`}
              value={form.accountNumber}
              onChange={(e) => update("accountNumber", e.target.value)}
              placeholder="e.g., 0123456789"
              maxLength={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}

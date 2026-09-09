import {
  Users,
  Target,
  Plus,
  Pencil,
  Trash2,
  CircleAlert,
  UserPlus} from "lucide-react";
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

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  freelancersApi,
  authApi,
  clustersApi,
} from "../../../utils/api-service";

export function Freelancers() {
  const [createFreelancerOpen, setCreateFreelancerOpen] = useState(false);
  const [editFreelancerOpen, setEditFreelancerOpen] = useState(false);
  const [deleteFreelancerOpen, setDeleteFreelancerOpen] = useState(false);
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<
    string | null
  >(null);

  // Form state for creating freelancer
  const [newFreelancerName, setNewFreelancerName] = useState("");
  const [newFreelancerEmail, setNewFreelancerEmail] = useState("");
  const [newFreelancerPhone, setNewFreelancerPhone] = useState("");
  const [newFreelancerCluster, setNewFreelancerCluster] = useState("");
  const [newFreelancerStatus, setNewFreelancerStatus] = useState("PENDING");

  // Form state for editing freelancer
  const [editFreelancerName, setEditFreelancerName] = useState("");
  const [editFreelancerEmail, setEditFreelancerEmail] = useState("");
  const [editFreelancerCluster, setEditFreelancerCluster] = useState("");
  const [editFreelancerStatus, setEditFreelancerStatus] = useState("");

  // Current user (agent or admin)
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Clusters data
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await authApi.getProfile();
        setCurrentUser(user);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchClusters() {
      try {
        const data = await clustersApi.getAll();
        setClusters(data);
      } catch (err) {
        console.error("Failed to fetch clusters:", err);
      }
    }
    fetchClusters();
  }, []);

  /* Admin users can view but not create freelancers */
  const isAdmin = String(currentUser?.role || "").toUpperCase() === "ADMIN";

  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await freelancersApi.getAll();
      setFreelancers(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch freelancers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFreelancer = async () => {
    if (!currentUser) {
      setError("You must be logged in to create freelancers.");
      return;
    }

    if (!newFreelancerName || !newFreelancerEmail) {
      setError("Name and email are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await freelancersApi.create({
        name: newFreelancerName,
        email: newFreelancerEmail,
        phone: newFreelancerPhone,
        registeredBy: currentUser.id,
        registrarName: currentUser.name,
        registrarType: currentUser.role || "AGENT",
        cluster: newFreelancerCluster || null,
        status: newFreelancerStatus || "PENDING",
      });
      await fetchFreelancers();
      setCreateFreelancerOpen(false);
      toast.success("Freelancer created successfully");
      // Reset form
      setNewFreelancerName("");
      setNewFreelancerEmail("");
      setNewFreelancerPhone("");
      setNewFreelancerCluster("");
      setNewFreelancerStatus("PENDING");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create freelancer",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditFreelancer = (freelancerId: string) => {
    const freelancer = freelancers.find((f) => f.id === freelancerId);
    if (freelancer) {
      setSelectedFreelancerId(freelancerId);
      setEditFreelancerName(freelancer.user?.name || freelancer.name || "");
      setEditFreelancerEmail(freelancer.user?.email || freelancer.email || "");
      setEditFreelancerCluster(freelancer.clusterId || "");
      setEditFreelancerStatus(
        String(freelancer.status || "PENDING").toUpperCase(),
      );
      setEditFreelancerOpen(true);
    }
  };

  const handleUpdateFreelancer = async () => {
    if (!selectedFreelancerId) return;
    setLoading(true);
    setError(null);
    try {
      const updateData: any = {};
      if (editFreelancerName) updateData.name = editFreelancerName;
      if (editFreelancerEmail) updateData.email = editFreelancerEmail;
      if (editFreelancerCluster) updateData.cluster = editFreelancerCluster;
      if (editFreelancerStatus)
        updateData.status = editFreelancerStatus.toUpperCase();

      await freelancersApi.update(selectedFreelancerId, updateData);
      await fetchFreelancers();
      setEditFreelancerOpen(false);
      setSelectedFreelancerId(null);
      toast.success("Freelancer updated successfully");
      // Reset edit form
      setEditFreelancerName("");
      setEditFreelancerEmail("");
      setEditFreelancerCluster("");
      setEditFreelancerStatus("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update freelancer",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFreelancer = (freelancerId: string) => {
    setSelectedFreelancerId(freelancerId);
    setDeleteFreelancerOpen(true);
  };

  const confirmDeleteFreelancer = async () => {
    if (!selectedFreelancerId) return;
    setLoading(true);
    setError(null);
    try {
      await freelancersApi.delete(selectedFreelancerId);
      await fetchFreelancers();
      setDeleteFreelancerOpen(false);
      setSelectedFreelancerId(null);
      toast.success("Freelancer deleted successfully");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete freelancer",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Freelancer Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Freelancers
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{freelancers.length}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deals
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {freelancers.reduce(
                (sum, freelancer) => sum + freelancer.activeDeals,
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
            <NairaSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ₦
              {freelancers
                .reduce(
                  (sum, freelancer) => sum + freelancer.totalCommission,
                  0,
                )
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Freelancer Performance Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Freelancer Performance</CardTitle>
          {/* Create Freelancer Dialog — hidden for admin users */}
          {!isAdmin && (
            <Dialog
              open={createFreelancerOpen}
              onOpenChange={setCreateFreelancerOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Freelancer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Add Freelancer</DialogTitle>
                  <DialogDescription>
                    Register a new freelancer in the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {error && (
                    <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Freelancer ID
                    </Label>
                    <Input
                      value="Auto-generated"
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-freelancer-name">
                      Freelancer Name*
                    </Label>
                    <Input
                      id="new-freelancer-name"
                      value={newFreelancerName}
                      onChange={(e) => setNewFreelancerName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-freelancer-email">Email Address*</Label>
                    <Input
                      id="new-freelancer-email"
                      type="email"
                      value={newFreelancerEmail}
                      onChange={(e) => setNewFreelancerEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-freelancer-phone">Phone Number</Label>
                    <Input
                      id="new-freelancer-phone"
                      value={newFreelancerPhone}
                      onChange={(e) => setNewFreelancerPhone(e.target.value)}
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-freelancer-cluster">Cluster</Label>
                    <Select
                      value={newFreelancerCluster}
                      onValueChange={setNewFreelancerCluster}
                    >
                      <SelectTrigger id="new-freelancer-cluster">
                        <SelectValue placeholder="Select a cluster (optional)" />
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
                  <div>
                    <Label htmlFor="new-freelancer-status">Status</Label>
                    <Select
                      value={newFreelancerStatus}
                      onValueChange={setNewFreelancerStatus}
                    >
                      <SelectTrigger id="new-freelancer-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateFreelancerOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFreelancer} disabled={loading}>
                    {loading ? "Creating..." : "Create Freelancer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Freelancer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Registered By</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Active Deals</TableHead>
                <TableHead>Closed Deals</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {freelancers.map((freelancer) => (
                <TableRow key={freelancer.id}>
                  <TableCell className="font-medium">
                    {freelancer.serialId || freelancer.id}
                  </TableCell>
                  <TableCell>
                    {freelancer.user?.name || freelancer.name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {freelancer.registrarName || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {freelancer.registrarType || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {freelancer.cluster?.name || freelancer.cluster || "—"}
                  </TableCell>
                  <TableCell>{freelancer.activeDeals || 0}</TableCell>
                  <TableCell>{freelancer.closedDeals || 0}</TableCell>
                  <TableCell>
                    ₦{(freelancer.totalCommission || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        (freelancer.performance || 0) >= 100
                          ? "default"
                          : "secondary"
                      }
                    >
                      {freelancer.performance || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        String(freelancer.status || "").toUpperCase() ===
                        "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {String(freelancer.status || "UNKNOWN").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFreelancer(freelancer.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFreelancer(freelancer.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Freelancer Dialog */}
      <Dialog open={editFreelancerOpen} onOpenChange={setEditFreelancerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Freelancer</DialogTitle>
            <DialogDescription>
              Update the details for this freelancer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="edit-freelancer-name">Freelancer Name</Label>
              <Input
                id="edit-freelancer-name"
                value={editFreelancerName}
                onChange={(e) => setEditFreelancerName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-freelancer-email">Email Address</Label>
              <Input
                id="edit-freelancer-email"
                type="email"
                value={editFreelancerEmail}
                onChange={(e) => setEditFreelancerEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-freelancer-cluster">Cluster</Label>
              <Select
                value={editFreelancerCluster}
                onValueChange={setEditFreelancerCluster}
              >
                <SelectTrigger id="edit-freelancer-cluster">
                  <SelectValue placeholder="Select a cluster (optional)" />
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
            <div>
              <Label htmlFor="edit-freelancer-status">Status</Label>
              <Select
                value={editFreelancerStatus}
                onValueChange={setEditFreelancerStatus}
              >
                <SelectTrigger id="edit-freelancer-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditFreelancerOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateFreelancer} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Freelancer Dialog */}
      <Dialog
        open={deleteFreelancerOpen}
        onOpenChange={setDeleteFreelancerOpen}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete Freelancer</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete this freelancer? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFreelancerOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFreelancer}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import {
  Users,
  Target,
  Plus,
  Pencil,
  Trash2,
  CircleAlert} from "lucide-react";
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
import { agentsApi, clustersApi } from "../../../utils/api-service";

export function Agents() {
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [editAgentOpen, setEditAgentOpen] = useState(false);
  const [deleteAgentOpen, setDeleteAgentOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Form state for creating agent
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPhone, setNewAgentPhone] = useState("");
  const [newAgentCluster, setNewAgentCluster] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("AGENT");
  const [newAgentStatus, setNewAgentStatus] = useState("PENDING");

  // Form state for editing agent
  const [editAgentName, setEditAgentName] = useState("");
  const [editAgentEmail, setEditAgentEmail] = useState("");
  const [editAgentPhone, setEditAgentPhone] = useState("");
  const [editAgentCluster, setEditAgentCluster] = useState("");
  const [editAgentRole, setEditAgentRole] = useState("");
  const [editAgentStatus, setEditAgentStatus] = useState("");

  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clusters data
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    fetchAgents();
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

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agentsApi.getAll();
      setAgents(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch agents",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgentName || !newAgentEmail) {
      setError("Name and email are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await agentsApi.create({
        name: newAgentName,
        email: newAgentEmail,
        phone: newAgentPhone,
        cluster: newAgentCluster || null,
        role: newAgentRole,
        status: newAgentStatus,
      });
      await fetchAgents();
      setCreateAgentOpen(false);
      // Reset form
      setNewAgentName("");
      setNewAgentEmail("");
      setNewAgentPhone("");
      setNewAgentCluster("");
      setNewAgentRole("AGENT");
      setNewAgentStatus("PENDING");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create agent",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setSelectedAgentId(agentId);
      setEditAgentName(agent.name);
      setEditAgentEmail(agent.email);
      setEditAgentPhone(agent.phone || "");
      setEditAgentCluster(agent.clusterId || "");
      setEditAgentRole(agent.role || "AGENT");
      setEditAgentStatus((agent.status || "PENDING").toUpperCase());
      setEditAgentOpen(true);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgentId) return;
    setLoading(true);
    setError(null);
    try {
      const updateData: any = {};
      if (editAgentName) updateData.name = editAgentName;
      if (editAgentEmail) updateData.email = editAgentEmail;
      if (editAgentPhone) updateData.phone = editAgentPhone;
      if (editAgentCluster) updateData.cluster = editAgentCluster;
      if (editAgentRole) updateData.role = editAgentRole;
      if (editAgentStatus) updateData.status = editAgentStatus;

      await agentsApi.update(selectedAgentId, updateData);
      await fetchAgents();
      setEditAgentOpen(false);
      setSelectedAgentId(null);
      // Reset edit form
      setEditAgentName("");
      setEditAgentEmail("");
      setEditAgentPhone("");
      setEditAgentCluster("");
      setEditAgentRole("");
      setEditAgentStatus("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update agent",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setDeleteAgentOpen(true);
  };

  const confirmDeleteAgent = async () => {
    if (!selectedAgentId) return;
    setLoading(true);
    setError(null);
    try {
      await agentsApi.delete(selectedAgentId);
      await fetchAgents();
      setDeleteAgentOpen(false);
      setSelectedAgentId(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete agent",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{agents.length}</div>
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
              {agents.reduce((sum, agent) => sum + agent.activeDeals, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commission
            </CardTitle>
            {/* <Icon className="h-4 w-4 text-muted-foreground" /> */}
            <p className="text-muted-foreground text-xl">₦</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              ₦
              {agents
                .reduce((sum, agent) => sum + agent.totalCommission, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agent Performance</CardTitle>
          {/* Create Agent Dialog */}
          <Dialog open={createAgentOpen} onOpenChange={setCreateAgentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>
                  Enter the details for the new agent.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="agent-name">Agent Name*</Label>
                  <Input
                    id="agent-name"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-email">Email Address*</Label>
                  <Input
                    id="agent-email"
                    type="email"
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                    placeholder="e.g., john.doe@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-phone">Phone Number</Label>
                  <Input
                    id="agent-phone"
                    value={newAgentPhone}
                    onChange={(e) => setNewAgentPhone(e.target.value)}
                    placeholder="e.g., +234 801 234 5678"
                  />
                </div>
                <div>
                  <Label htmlFor="agent-cluster">Cluster</Label>
                  <Select
                    value={newAgentCluster}
                    onValueChange={setNewAgentCluster}
                  >
                    <SelectTrigger id="agent-cluster">
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
                  <Label htmlFor="agent-role">Role</Label>
                  <Select value={newAgentRole} onValueChange={setNewAgentRole}>
                    <SelectTrigger id="agent-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                      <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                      <SelectItem value="INVESTOR">Investor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="agent-status">Status</Label>
                  <Select
                    value={newAgentStatus}
                    onValueChange={setNewAgentStatus}
                  >
                    <SelectTrigger id="agent-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateAgentOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent} disabled={loading}>
                  {loading ? "Creating..." : "Create Agent"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active Deals</TableHead>
                <TableHead>Closed Deals</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Commission Rate (%)</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    {agent.serialId || agent.id}
                  </TableCell>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.phone}</TableCell>
                  <TableCell>{agent.cluster}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.role}</Badge>
                  </TableCell>
                  <TableCell>{agent.activeDeals}</TableCell>
                  <TableCell>{agent.closedDeals}</TableCell>
                  <TableCell>
                    ₦{agent.totalCommission.toLocaleString()}
                  </TableCell>
                  <TableCell>{agent.commissionRate ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        agent.performance >= 100 ? "default" : "secondary"
                      }
                    >
                      {agent.performance}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        String(agent.status || "").toUpperCase() === "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {String(agent.status || "UNKNOWN").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAgent(agent.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
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

      {/* Edit Agent Dialog */}
      <Dialog open={editAgentOpen} onOpenChange={setEditAgentOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update the details for this agent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="edit-agent-name">Agent Name</Label>
              <Input
                id="edit-agent-name"
                value={editAgentName}
                onChange={(e) => setEditAgentName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-agent-email">Email Address</Label>
              <Input
                id="edit-agent-email"
                type="email"
                value={editAgentEmail}
                onChange={(e) => setEditAgentEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-agent-phone">Phone Number</Label>
              <Input
                id="edit-agent-phone"
                value={editAgentPhone}
                onChange={(e) => setEditAgentPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-agent-cluster">Cluster</Label>
              <Select
                value={editAgentCluster}
                onValueChange={setEditAgentCluster}
              >
                <SelectTrigger id="edit-agent-cluster">
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
              <Label htmlFor="edit-agent-role">Role</Label>
              <Select value={editAgentRole} onValueChange={setEditAgentRole}>
                <SelectTrigger id="edit-agent-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="INVESTOR">Investor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-agent-status">Status</Label>
              <Select
                value={editAgentStatus}
                onValueChange={setEditAgentStatus}
              >
                <SelectTrigger id="edit-agent-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditAgentOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAgent} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Agent Dialog */}
      <Dialog open={deleteAgentOpen} onOpenChange={setDeleteAgentOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete Agent</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete this agent? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAgentOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAgent}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

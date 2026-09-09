import {
  Users as UsersIcon,
  Target,
  Plus,
  Pencil,
  Trash2,
  CircleAlert,
  UserCog,
  Eye,
  EyeOff,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { formatDate } from "../../../utils/format";

import { useEffect, useState } from "react";
import { useAuth } from "../auth-provider";
import {
  usersApi,
  clustersApi,
  agentsApi,
  freelancersApi,
  leadsApi,
} from "../../../utils/api-service";

export function Users() {
  const { data: authUser } = useAuth();
  const isAdmin = String(authUser?.role || "").toUpperCase() === "ADMIN";
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("AGENT");

  // Form state for creating user
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserCluster, setNewUserCluster] = useState("");
  const [newUserRole, setNewUserRole] = useState("AGENT");
  const [newUserStatus, setNewUserStatus] = useState("PENDING");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // Form state for editing user
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserCluster, setEditUserCluster] = useState("");
  const [editUserRole, setEditUserRole] = useState("");
  const [editUserStatus, setEditUserStatus] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clusters data
  const [clusters, setClusters] = useState<any[]>([]);

  useEffect(() => {
    fetchClusters();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const fetchClusters = async () => {
    try {
      const data = await clustersApi.getAll();
      setClusters(data);
    } catch (err) {
      console.error("Failed to fetch clusters:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAll({ role: selectedRole });
      setUsers(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to fetch users",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      setError("Name, email, and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await usersApi.create({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        phone: newUserPhone,
        role: newUserRole,
        status: newUserStatus,
      });

      if (newUserRole === "AGENT") {
        try {
          await agentsApi.create({
            name: newUserName,
            email: newUserEmail,
            phone: newUserPhone,
            cluster: newUserCluster || undefined,
            role: newUserRole,
            status: newUserStatus,
          });
        } catch (agentErr: any) {
          console.warn(
            "Agent profile creation failed (user still created):",
            agentErr?.message,
          );
        }
      }

      if (newUserRole === "FREELANCER") {
        try {
          await freelancersApi.create({
            name: newUserName,
            email: newUserEmail,
            phone: newUserPhone,
            cluster: newUserCluster || undefined,
            status: newUserStatus,
          });
        } catch (flErr: any) {
          console.warn(
            "Freelancer profile creation failed (user still created):",
            flErr?.message,
          );
        }
      }

      if (newUserRole === "INVESTOR") {
        try {
          await leadsApi.create({
            name: newUserName,
            email: newUserEmail,
            phone: newUserPhone,
            leadSource: "investor-app",
            status: "available",
            cluster: newUserCluster || undefined,
          });
        } catch (leadErr: any) {
          console.warn(
            "Lead record creation failed (investor user still created):",
            leadErr?.message,
          );
        }
      }

      await fetchUsers();
      setCreateUserOpen(false);
      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserPhone("");
      setNewUserCluster("");
      setNewUserRole("AGENT");
      setNewUserStatus("PENDING");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to create user",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setEditUserName(user.name || "");
      setEditUserEmail(user.email || "");
      setEditUserPhone(user.phone || "");
      setEditUserCluster(user.clusterId || "");
      setEditUserRole(user.role || "AGENT");
      setEditUserStatus(String(user.status || "PENDING").toUpperCase());
      setEditUserOpen(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const updateData: any = {};
      if (editUserName) updateData.name = editUserName;
      if (editUserEmail) updateData.email = editUserEmail;
      if (editUserPhone) updateData.phone = editUserPhone;
      if (editUserRole) updateData.role = editUserRole;
      if (editUserStatus) updateData.status = editUserStatus;

      await usersApi.update(selectedUserId, updateData);
      await fetchUsers();
      setEditUserOpen(false);
      setSelectedUserId(null);
      // Reset edit form
      setEditUserName("");
      setEditUserEmail("");
      setEditUserPhone("");
      setEditUserCluster("");
      setEditUserRole("");
      setEditUserStatus("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to update user",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setSelectedUserId(userId);
    setDeleteUserOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      await usersApi.delete(selectedUserId);
      await fetchUsers();
      setDeleteUserOpen(false);
      setSelectedUserId(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to delete user",
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      AGENT: "Agents",
      TEAM_LEAD: "Team Leads",
      FREELANCER: "Freelancers",
      INVESTOR: "Investors",
    };
    return labels[role] || role;
  };

  const getRoleIcon = () => {
    switch (selectedRole) {
      case "AGENT":
        return <UserCog className="h-4 w-4 text-muted-foreground" />;
      case "TEAM_LEAD":
        return <UsersIcon className="h-4 w-4 text-muted-foreground" />;
      case "FREELANCER":
        return <UsersIcon className="h-4 w-4 text-muted-foreground" />;
      case "INVESTOR":
        return <NairaSign className="h-4 w-4 text-muted-foreground" />;
      default:
        return <UsersIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getClusterName = (user: any) => {
    if (user.agentProfile?.cluster?.name) return user.agentProfile.cluster.name;
    if (user.freelancerProfile?.cluster?.name)
      return user.freelancerProfile.cluster.name;
    // For team leads, show their managed clusters
    if (user.managedClusters && user.managedClusters.length > 0) {
      return user.managedClusters.map((c: any) => c.name).join(", ");
    }
    return "—";
  };

  const getTotalInvested = (user: any) => {
    if (!user.transactions || user.transactions.length === 0) return 0;
    return user.transactions.reduce(
      (sum: number, tx: any) => sum + (tx.totalAmount || 0),
      0,
    );
  };

  const getStatusBadgeClass = (status?: string) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "ACTIVE") return "bg-accent text-accent-foreground";
    if (normalized === "INACTIVE")
      return "bg-destructive text-destructive-foreground";
    if (normalized === "PENDING") return "bg-warning text-warning-foreground";
    return "";
  };

  return (
    <div className="space-y-6">
      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="AGENT">Agents</TabsTrigger>
          <TabsTrigger value="TEAM_LEAD">Team Leads</TabsTrigger>
          <TabsTrigger value="FREELANCER">Freelancers</TabsTrigger>
          <TabsTrigger value="INVESTOR">Investors</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedRole} className="space-y-6">
          {/* User Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total {getRoleLabel(selectedRole)}
                </CardTitle>
                {getRoleIcon()}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{users.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {
                    users.filter(
                      (u) => String(u.status).toUpperCase() === "ACTIVE",
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Users
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {
                    users.filter(
                      (u) => String(u.status).toUpperCase() === "PENDING",
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management Table */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{getRoleLabel(selectedRole)} Management</CardTitle>
              {/* Create User Dialog — hidden on FREELANCER tab (admin can only view) */}
              {selectedRole !== "FREELANCER" && (
                <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setNewUserRole(selectedRole)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create {getRoleLabel(selectedRole).slice(0, -1)}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new user.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      {error && (
                        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                          {error}
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          User ID
                        </Label>
                        <Input
                          value="Auto-generated"
                          disabled
                          className="bg-muted text-muted-foreground"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-name">Name*</Label>
                        <Input
                          id="user-name"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="e.g., John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-email">Email Address*</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="e.g., john.doe@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-password">Password*</Label>
                        <div className="relative">
                          <Input
                            id="user-password"
                            type={showNewUserPassword ? "text" : "password"}
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Min. 8 characters, include number & special char"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowNewUserPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewUserPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Must be at least 8 characters with a number and
                          special character
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="user-phone">Phone Number</Label>
                        <Input
                          id="user-phone"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          placeholder="e.g., +234 801 234 5678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-role">Role</Label>
                        <Input
                          id="user-role"
                          value={
                            {
                              AGENT: "Agent",
                              TEAM_LEAD: "Team Lead",
                              FREELANCER: "Freelancer",
                              INVESTOR: "Investor",
                            }[newUserRole] || newUserRole
                          }
                          disabled
                          className="bg-muted text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Role is determined by the selected tab.
                        </p>
                      </div>
                      {(newUserRole === "AGENT" ||
                        newUserRole === "FREELANCER" ||
                        newUserRole === "INVESTOR") && (
                        <div>
                          <Label htmlFor="user-cluster">Cluster</Label>
                          <Select
                            value={newUserCluster || "unassigned"}
                            onValueChange={(value) =>
                              setNewUserCluster(
                                value === "unassigned" ? "" : value,
                              )
                            }
                          >
                            <SelectTrigger id="user-cluster">
                              <SelectValue placeholder="Select cluster" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                Unassigned
                              </SelectItem>
                              {clusters.map((cluster) => (
                                <SelectItem key={cluster.id} value={cluster.id}>
                                  {cluster.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="user-status">Status*</Label>
                        <Select
                          value={newUserStatus}
                          onValueChange={setNewUserStatus}
                        >
                          <SelectTrigger id="user-status">
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
                        onClick={() => setCreateUserOpen(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} disabled={loading}>
                        {loading ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {loading && <div className="text-center py-8">Loading...</div>}
              {error && !loading && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              {!loading && !error && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        {selectedRole === "TEAM_LEAD" && (
                          <>
                            <TableHead>Cluster Count</TableHead>
                          </>
                        )}
                        {selectedRole === "INVESTOR" && (
                          <>
                            <TableHead>Total Invested</TableHead>
                            <TableHead>Transactions</TableHead>
                          </>
                        )}
                        {(selectedRole === "AGENT" ||
                          selectedRole === "FREELANCER") && (
                          <>
                            <TableHead>Cluster</TableHead>
                            <TableHead>Active Deals</TableHead>
                            <TableHead>Closed Deals</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Performance</TableHead>
                          </>
                        )}
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No {getRoleLabel(selectedRole).toLowerCase()} found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-sm">
                              {user.serialId || user.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone || "—"}</TableCell>

                            {selectedRole === "TEAM_LEAD" && (
                              <>
                                <TableCell>
                                  {user.managedClusters?.length || 0}
                                </TableCell>
                              </>
                            )}

                            {selectedRole === "INVESTOR" && (
                              <>
                                <TableCell>
                                  ₦{getTotalInvested(user).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {user.transactions?.length || 0}
                                </TableCell>
                              </>
                            )}

                            {(selectedRole === "AGENT" ||
                              selectedRole === "FREELANCER") && (
                              <>
                                <TableCell>{getClusterName(user)}</TableCell>
                                <TableCell>
                                  {user.agentProfile?.activeDeals ||
                                    user.freelancerProfile?.activeDeals ||
                                    0}
                                </TableCell>
                                <TableCell>
                                  {user.agentProfile?.closedDeals ||
                                    user.freelancerProfile?.closedDeals ||
                                    0}
                                </TableCell>
                                <TableCell>
                                  ₦
                                  {(
                                    user.agentProfile?.totalCommission ||
                                    user.freelancerProfile?.totalCommission ||
                                    0
                                  ).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      (user.agentProfile?.performance ||
                                        user.freelancerProfile?.performance ||
                                        0) >= 100
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {user.agentProfile?.performance ||
                                      user.freelancerProfile?.performance ||
                                      0}
                                    %
                                  </Badge>
                                </TableCell>
                              </>
                            )}

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(user.status)}
                              >
                                {String(user.status || "UNKNOWN").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewUser(user)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the details for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="edit-user-name">Name</Label>
              <Input
                id="edit-user-name"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-email">Email Address</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-phone">Phone Number</Label>
              <Input
                id="edit-user-phone"
                value={editUserPhone}
                onChange={(e) => setEditUserPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-user-role">Role</Label>
              <Select value={editUserRole} onValueChange={setEditUserRole}>
                <SelectTrigger id="edit-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="TEAM_LEAD">Team Lead</SelectItem>
                  <SelectItem value="FREELANCER">Freelancer</SelectItem>
                  <SelectItem value="INVESTOR">Investor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-user-status">Status</Label>
              <Select value={editUserStatus} onValueChange={setEditUserStatus}>
                <SelectTrigger id="edit-user-status">
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
              onClick={() => setEditUserOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete User</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Sheet */}
      <Sheet open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {viewUser && (
            <>
              <SheetHeader>
                <SheetTitle>{viewUser.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">User ID</div>
                  <div className="font-mono">
                    {viewUser.serialId || viewUser.id}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div>{viewUser.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div>{viewUser.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Role</div>
                  <div>
                    <Badge variant="outline">{viewUser.role}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeClass(viewUser.status)}
                    >
                      {String(viewUser.status || "UNKNOWN").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {/* Team Lead specific fields */}
                {viewUser.role === "TEAM_LEAD" && (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Cluster Count
                      </div>
                      <div>{viewUser.managedClusters?.length || 0}</div>
                    </div>
                    {viewUser.managedClusters &&
                      viewUser.managedClusters.length > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Managed Clusters
                          </div>
                          <ul className="list-disc list-inside space-y-1">
                            {viewUser.managedClusters.map((cluster: any) => (
                              <li key={cluster.id} className="text-sm">
                                {cluster.name}
                                {cluster.location && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({cluster.location})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                )}

                {/* Investor specific fields */}
                {viewUser.role === "INVESTOR" && (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total Invested
                      </div>
                      <div>₦{getTotalInvested(viewUser).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total Transactions
                      </div>
                      <div>{viewUser.transactions?.length || 0}</div>
                    </div>
                    {viewUser.transactions &&
                      viewUser.transactions.length > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Recent Transactions
                          </div>
                          <div className="space-y-2">
                            {viewUser.transactions
                              .slice(0, 3)
                              .map((tx: any) => (
                                <div
                                  key={tx.id}
                                  className="text-xs p-2 bg-muted rounded"
                                >
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {tx.asset?.name || "N/A"}
                                    </span>
                                    <span>
                                      ₦{(tx.totalAmount || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-muted-foreground mt-1">
                                    {formatDate(tx.date)} • {tx.status}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </>
                )}

                {/* Agent/Freelancer specific fields */}
                {(viewUser.role === "AGENT" ||
                  viewUser.role === "FREELANCER") && (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Cluster
                      </div>
                      <div>{getClusterName(viewUser)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Active Deals
                      </div>
                      <div>
                        {viewUser.agentProfile?.activeDeals ||
                          viewUser.freelancerProfile?.activeDeals ||
                          0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Closed Deals
                      </div>
                      <div>
                        {viewUser.agentProfile?.closedDeals ||
                          viewUser.freelancerProfile?.closedDeals ||
                          0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Total Commission
                      </div>
                      <div>
                        ₦
                        {(
                          viewUser.agentProfile?.totalCommission ||
                          viewUser.freelancerProfile?.totalCommission ||
                          0
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Performance
                      </div>
                      <div>
                        <Badge
                          variant={
                            (viewUser.agentProfile?.performance ||
                              viewUser.freelancerProfile?.performance ||
                              0) >= 100
                              ? "default"
                              : "secondary"
                          }
                        >
                          {viewUser.agentProfile?.performance ||
                            viewUser.freelancerProfile?.performance ||
                            0}
                          %
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
                {viewUser.agentProfile?.commissionRate && (
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Commission Rate
                    </div>
                    <div>{viewUser.agentProfile.commissionRate}%</div>
                  </div>
                )}
                {(viewUser.freelancerProfile?.registrarName ||
                  viewUser.freelancerProfile?.registrarType) && (
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Registered By
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {viewUser.freelancerProfile.registrarName || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {viewUser.freelancerProfile.registrarType || "—"}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">
                    Created At
                  </div>
                  <div>
                    {viewUser.createdAt ? formatDate(viewUser.createdAt) : "—"}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Globe,
  Palette,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "../ui/button";

// Import the User type from your application's user model or API types
// Replace the path below with the actual path to your User type definition

// Extend the User type to include 'phone'
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { useAuth } from "../auth-provider";
import { toast } from "sonner";
import { authApi, api } from "../../../utils/api-service";
// Adjust the path if your api instance is elsewhere

export function Settings() {
  type UserProfile = {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    transactionAlerts?: boolean;
    weeklyReports?: boolean;
    agentUpdates?: boolean;
    // Add other fields as needed
  };
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { updateUser } = useAuth();

  // Profile settings
  const [name, setName] = useState(data?.name || "");
  const [email, setEmail] = useState(data?.email || "");
  const [phone, setPhone] = useState(data?.phone || "");

  // System settings
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("NGN");

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [agentUpdates, setAgentUpdates] = useState(true);

  async function fetchProfile() {
    setLoading(true);
    try {
      const user = await authApi.getProfile();
      setData(user);
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setTimezone(user.timezone || "Africa/Lagos");
      setDateFormat(user.dateFormat || "DD/MM/YYYY");
      setCurrency(user.currency || "NGN");
      setEmailNotifications(user.emailNotifications ?? true);
      setPushNotifications(user.pushNotifications ?? true);
      setTransactionAlerts(user.transactionAlerts ?? true);
      setWeeklyReports(user.weeklyReports ?? false);
      setAgentUpdates(user.agentUpdates ?? true);
      updateUser(user);
    } finally {
      setLoading(false);
    }
  }
  // Fetch on mount
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);
  const [activeTab, setActiveTab] = useState("profile");

  // Security settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isCurrentPasswordEmpty = currentPassword.trim() === "";
  const isNewPasswordEmpty = newPassword.trim() === "";
  const isConfirmPasswordEmpty = confirmPassword.trim() === "";
  const isNewPasswordTooShort =
    newPassword.length > 0 && newPassword.length < 8;
  const passwordMismatch =
    newPassword !== "" &&
    confirmPassword !== "" &&
    newPassword !== confirmPassword;
  const isChangePasswordDisabled =
    isCurrentPasswordEmpty ||
    isNewPasswordEmpty ||
    isConfirmPasswordEmpty ||
    isNewPasswordTooShort ||
    passwordMismatch;

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "system", label: "System", icon: Globe },
  ];

  // Nigerian phone validation
  function isValidNigerianPhone(phone: string): boolean {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/\D/g, "");
    // With country code
    if (cleaned.startsWith("234")) {
      const rest = cleaned.slice(3);
      return rest.length === 10 || rest.length === 11;
    }
    // Without country code
    return cleaned.length === 10 || cleaned.length === 11;
  }

  const handleSaveProfile = async () => {
    if (!isValidNigerianPhone(phone)) {
      toast.error("Enter a valid Nigerian phone number");
      return;
    }
    try {
      // Assume PATCH /auth/me or similar endpoint for updating profile
      await api.put("/users/me", { phone });
      updateUser({ phone });
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to change password",
      );
    }
  };

  const handleSaveNotifications = async () => {
    try {
      // Assume PATCH /auth/me or /notifications/settings endpoint
      await api.put("/users/me", {
        emailNotifications,
        pushNotifications,
        transactionAlerts,
        weeklyReports,
        agentUpdates,
      });
      updateUser({
        emailNotifications,
        pushNotifications,
        transactionAlerts,
        weeklyReports,
        agentUpdates,
      });
      toast.success("Notification preferences saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to save notification preferences",
      );
    }
  };

  const handleSaveSystem = async () => {
    try {
      // Assume PATCH /auth/me or /settings/system endpoint
      await api.put("/users/me", {
        timezone,
        dateFormat,
        currency,
      });
      updateUser({
        timezone,
        dateFormat,
        currency,
      });
      toast.success("System settings saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to save system settings",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span className="text-lg text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4">
          {/* Sidebar Tabs */}
          <div className="lg:border-r border-border p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 p-6">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    Profile Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your account information
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        readOnly
                        className="bg-muted cursor-not-allowed text-grey"
                        placeholder="Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        readOnly
                        className="bg-muted cursor-not-allowed text-grey"
                        placeholder="Email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +2348012345678 or 08012345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={data?.role || "Administrator"}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    Security Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your password and security preferences
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {isCurrentPasswordEmpty && (
                      <p className="text-sm text-destructive">
                        Current password is required.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {isNewPasswordTooShort && (
                      <p className="text-sm text-destructive">
                        New password must be at least 8 characters.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="text-sm text-destructive">
                        Passwords do not match.
                      </p>
                    )}
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Password must be at least 8 characters long and include a
                      mix of letters, numbers, and special characters.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangePasswordDisabled}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    Notification Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Customize how you receive notifications
                  </p>
                </div>

                <Separator />

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="transaction-alerts">
                        Transaction Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new transactions and payments
                      </p>
                    </div>
                    <Switch
                      id="transaction-alerts"
                      checked={transactionAlerts}
                      onCheckedChange={setTransactionAlerts}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly-reports">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly performance reports via email
                      </p>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={weeklyReports}
                      onCheckedChange={setWeeklyReports}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="agent-updates">Agent Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when agents update lead status
                      </p>
                    </div>
                    <Switch
                      id="agent-updates"
                      checked={agentUpdates}
                      onCheckedChange={setAgentUpdates}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-1">
                    System Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Configure system-wide preferences
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="America/New_York">
                        America/New York (EST)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <select
                      id="date-format"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="NGN">Nigerian Naira (₦)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      System settings affect how data is displayed across the
                      entire platform. Changes will take effect immediately.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSystem}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { FeedbackWidget } from "../components/FeedbackWidget";
import { assetsApi, transactionsApi } from "../utils/api-service";
import { NotificationsPopover } from "./components/notifications-popover";
import { UserDropdown } from "./components/user-dropdown";
import { useNavigate } from "react-router-dom";
import { SignIn } from "./components/sign-in";
import { Toaster } from "./components/ui/sonner";
import { lazy, Suspense, useState } from "react";
import { ThemeProvider, useTheme } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./components/auth-provider";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import {
  LayoutDashboard,
  Building2,
  Home,
  Briefcase,
  UserCog,
  UserPlus,
  Receipt,
  CreditCard,
  FileBarChart,
  Settings as SettingsIcon,
  Menu,
  Search,
  Moon,
  Sun,
  Users,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
const AnalyticsDashboard = lazy(() => import("./components/dashboard/analytics-dashboard").then((m) => ({ default: m.AnalyticsDashboard })));
const CompanyManagement = lazy(() => import("./components/dashboard/company-management").then((m) => ({ default: m.CompanyManagement })));
const AssetManagement = lazy(() =>
  import("./components/dashboard/asset-management").then((module) => ({
    default: module.AssetManagement,
  })),
);
const Clusters = lazy(() => import("./components/dashboard/clusters").then((m) => ({ default: m.Clusters })));
const UserManagement = lazy(() => import("./components/dashboard/users").then((m) => ({ default: m.Users })));
const TransactionsCommissions = lazy(() => import("./components/dashboard/transactions-commissions-new").then((m) => ({ default: m.TransactionsCommissions })));
const Reports = lazy(() => import("./components/dashboard/reports").then((m) => ({ default: m.Reports })));
const InstallmentPayments = lazy(() => import("./components/dashboard/installment-payments").then((m) => ({ default: m.InstallmentPayments })));
const InvoiceEntries = lazy(() => import("./components/dashboard/invoice-entries").then((m) => ({ default: m.InvoiceEntries })));
const LeadManagement = lazy(() => import("./components/dashboard/lead-management").then((m) => ({ default: m.LeadManagement })));
const Settings = lazy(() => import("./components/dashboard/settings").then((m) => ({ default: m.Settings })));
const ProfilePage = lazy(() => import("./components/profile-page").then((m) => ({ default: m.ProfilePage })));
const PaymentCallback = lazy(() => import("./components/payment-callback").then((m) => ({ default: m.PaymentCallback })));
const KycManagement = lazy(() => import("./components/dashboard/kyc-management").then((m) => ({ default: m.KycManagement })));

// FIXED NAVIGATION GROUPS
const navigationGroups = [
  {
    name: "Overview",
    id: "overview",
    items: [{ name: "Dashboard", icon: LayoutDashboard, id: "dashboard" }],
  },
  {
    name: "Property Management",
    id: "property",
    items: [
      { name: "Companies", icon: Building2, id: "companies" },
      { name: "Assets", icon: Home, id: "assets" },
    ],
  },
  {
    name: "Sales Team",
    id: "sales-team",
    items: [
      { name: "Leads", icon: Users, id: "leads" },
      { name: "Clusters", icon: Briefcase, id: "clusters" },
      { name: "Users", icon: UserCog, id: "users" },
    ],
  },
  {
    name: "Financial",
    id: "financial",
    items: [
      { name: "Transactions", icon: Receipt, id: "transactions" },
      { name: "Installment Plans", icon: CreditCard, id: "installments" },
    ],
  },
  {
    name: "Compliance",
    id: "compliance",
    items: [{ name: "KYC Review", icon: ShieldCheck, id: "kyc" }],
  },
  {
    name: "Reports",
    id: "reports",
    items: [{ name: "Reports", icon: FileBarChart, id: "reports" }],
  },
  {
    name: "Free Invoice",
    id: "free-invoice",
    items: [{ name: "Invoice Entries", icon: FileText, id: "invoices" }],
  },
  {
    name: "Settings",
    id: "settings",
    items: [{ name: "Settings", icon: SettingsIcon, id: "settings" }],
  },
];

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Real search handler: filter assets/transactions by name/id
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const q = searchQuery.trim().toLowerCase();
      const [assetResponse, transactions] = await Promise.all([
        assetsApi.getAll({ search: q, limit: 10 }),
        transactionsApi.getAll(),
      ]);
      const assets = Array.isArray(assetResponse) ? assetResponse : assetResponse.data;
      // Filter assets by name, id, location, or type
      const assetResults = (assets || []).filter(
        (a: any) =>
          (a.name && a.name.toLowerCase().includes(q)) ||
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.id && a.id.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q)) ||
          (a.type && a.type.toLowerCase().includes(q)),
      );
      // Filter transactions by id or related info
      const transactionResults = (transactions || []).filter(
        (t: any) =>
          (t.id && t.id.toLowerCase().includes(q)) ||
          (t.asset && t.asset.name && t.asset.name.toLowerCase().includes(q)) ||
          (t.buyer && t.buyer.name && t.buyer.name.toLowerCase().includes(q)),
      );
      setSearchResults([
        ...assetResults.map((a: any) => ({ ...a, _type: "asset" })),
        ...transactionResults.map((t: any) => ({ ...t, _type: "transaction" })),
      ]);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <img
              src="/logo.svg"
              alt="BuyOps Admin"
              className="h-8 w-auto dark:brightness-0 dark:invert"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {navigationGroups.map((group) => (
              <div key={group.id} className="mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                  {group.name}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.id}
                      to={`/${item.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User profile at bottom */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || "Admin User"}
                </div>
                <div className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email || "admin@buyops.com"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* <form className="relative flex-1 max-w-md" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assets, transactions..."
                className="pl-10 bg-muted/50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form> */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="relative"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <NotificationsPopover />
            <UserDropdown
              onNavigate={(screen) => {
                if (screen === "profile") navigate("/profile");
                if (screen === "settings") navigate("/settings");
              }}
            />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {searching && (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            )}
            {searchQuery && !searching && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}
            <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
            <Routes>
              <Route path="/dashboard" element={<AnalyticsDashboard />} />
              <Route path="/companies" element={<CompanyManagement />} />
              <Route
                path="/assets"
                element={<AssetManagement />}
              />
              <Route path="/leads" element={<LeadManagement />} />
              <Route path="/clusters" element={<Clusters />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/kyc" element={<KycManagement />} />
              <Route
                path="/transactions"
                element={<TransactionsCommissions />}
              />
              <Route path="/installments" element={<InstallmentPayments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/invoices" element={<InvoiceEntries />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payments/callback" element={<PaymentCallback />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <DashboardContent />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/sign-in"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignIn />
        }
      />
    </Routes>
  );
}

const THUEBRIDGE_APP_ID = import.meta.env.VITE_THUEBRIDGE_APP_ID as
  | string
  | undefined;
const THUEBRIDGE_API_KEY = import.meta.env.VITE_THUEBRIDGE_API_KEY as
  | string
  | undefined;
const THUEBRIDGE_API_BASE_URL = import.meta.env.VITE_THUEBRIDGE_API_BASE_URL as
  | string
  | undefined;

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <AppContent />
          <Toaster />
          {THUEBRIDGE_APP_ID && THUEBRIDGE_API_KEY && (
            <FeedbackWidget
              appId={THUEBRIDGE_APP_ID}
              apiKey={THUEBRIDGE_API_KEY}
              apiBaseUrl={THUEBRIDGE_API_BASE_URL}
            />
          )}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

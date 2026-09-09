import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../utils/api-service";

interface User {
  email: string;
  name: string;
  role: string;
  phone?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  transactionAlerts?: boolean;
  weeklyReports?: boolean;
  agentUpdates?: boolean;
}

interface AuthContextType {
  data: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    requiresTwoFactor?: boolean;
    interimToken?: string;
    notAdmin?: boolean;
  }>;
  verify2FA: (
    interimToken: string,
    token: string,
  ) => Promise<{ ok: boolean; notAdmin?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("buyops_user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
    setIsReady(true);
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updates } as User;
      localStorage.setItem("buyops_user", JSON.stringify(next));
      return next;
    });
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      // 2FA challenge: no full JWT yet
      if (data?.requiresTwoFactor) {
        return {
          ok: false,
          requiresTwoFactor: true,
          interimToken: data.interimToken,
        };
      }
      if (data && data.user && data.access_token && data.refresh_token) {
        if (data.user.role?.toUpperCase() !== "ADMIN") {
          return { ok: false, notAdmin: true };
        }
        localStorage.setItem("buyops_user", JSON.stringify(data.user));
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const verify2FA = async (
    interimToken: string,
    token: string,
  ): Promise<{ ok: boolean; notAdmin?: boolean }> => {
    try {
      const data = await authApi.verify2FA(interimToken, token);
      if (data && data.user && data.access_token) {
        if (data.user.role?.toUpperCase() !== "ADMIN") {
          return { ok: false, notAdmin: true };
        }
        localStorage.setItem("buyops_user", JSON.stringify(data.user));
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        setUser(data.user);
        return { ok: true };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const logout = async () => {
    // await authApi.logout();
    localStorage.removeItem("buyops_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    navigate("/sign-in", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        data: user,
        isAuthenticated: !!user,
        isReady,
        login,
        verify2FA,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

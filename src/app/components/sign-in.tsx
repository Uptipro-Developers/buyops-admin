import { useState } from "react";
const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "./auth-provider";
import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 2FA state
  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");
  const [interimToken, setInterimToken] = useState("");
  const [totpCode, setTotpCode] = useState("");

  const { login, verify2FA } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    setEmailError("");
    try {
      const result = await login(trimmedEmail, password);
      if (result.requiresTwoFactor && result.interimToken) {
        setInterimToken(result.interimToken);
        setStep("twoFactor");
      } else if (result.notAdmin) {
        setError("Access denied. This portal is for administrators only.");
      } else if (!result.ok) {
        setError("Invalid email or password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await verify2FA(interimToken, totpCode);
      if (result.notAdmin) {
        setError("Access denied. This portal is for administrators only.");
      } else if (!result.ok) {
        setError("Invalid 2FA code. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {step === "twoFactor" ? (
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-9 w-9 text-primary-foreground" />
              </div>
            ) : (
              <img
                src="/logo.svg"
                alt="BuyOps"
                className="h-14 w-auto dark:brightness-0 dark:invert"
              />
            )}
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            {step === "twoFactor" ? "Two-Factor Auth" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground">
            {step === "twoFactor"
              ? "Enter the 6-digit code from your authenticator app"
              : "Sign in to access your admin dashboard"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          {/* ── Step 1: Credentials ── */}
          {step === "credentials" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      const trimmed = e.target.value.trim();
                      if (!trimmed) setEmailError("");
                      else if (!emailRegex.test(trimmed))
                        setEmailError("Please enter a valid email address.");
                      else setEmailError("");
                    }}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                  {emailError && (
                    <div className="text-xs text-destructive mt-1">
                      {emailError}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* ── Step 2: 2FA Verification ── */}
          {step === "twoFactor" && (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="totp">Authenticator Code</Label>
                <Input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading || totpCode.length < 6}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setTotpCode("");
                }}
              >
                ← Back to login
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 BuyOps. All rights reserved.
        </p>
      </div>
    </div>
  );
}

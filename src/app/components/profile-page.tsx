import { useState } from "react";
import { useAuth } from "./auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ShieldCheck, ShieldOff, QrCode } from "lucide-react";
import { authApi } from "../../utils/api-service";
import { toast } from "sonner";

export function ProfilePage() {
  const { data } = useAuth();

  // 2FA Setup dialog
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupStep, setSetupStep] = useState<"scan" | "verify">("scan");

  // 2FA Disable dialog
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableToken, setDisableToken] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  // Optimistic 2FA status (we don't have it from `data` yet, default false)
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean>(
    (data as any)?.twoFactorEnabled ?? false,
  );

  if (!data) return <div className="text-center py-8">Loading profile...</div>;

  const handleOpenSetup = async () => {
    setSetupStep("scan");
    setVerifyToken("");
    setSetupOpen(true);
    setSetupLoading(true);
    try {
      const res = await authApi.setup2FA();
      setQrCode(res.qrCode);
      setSecret(res.secret);
    } catch {
      toast.error("Failed to generate 2FA secret");
      setSetupOpen(false);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (verifyToken.length < 6) return;
    setSetupLoading(true);
    try {
      await authApi.enable2FA(verifyToken);
      setTwoFAEnabled(true);
      setSetupOpen(false);
      toast.success("Two-factor authentication enabled");
    } catch {
      toast.error("Invalid code. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disableToken.length < 6) return;
    setDisableLoading(true);
    try {
      await authApi.disable2FA(disableToken);
      setTwoFAEnabled(false);
      setDisableOpen(false);
      setDisableToken("");
      toast.success("Two-factor authentication disabled");
    } catch {
      toast.error("Invalid code. Please try again.");
    } finally {
      setDisableLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="text-lg font-medium">{data.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-lg font-medium">{data.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="text-lg font-medium capitalize">{data.role}</div>
            </div>
          </div>
          <div className="mt-6">
            <Button variant="outline" disabled>
              Edit Profile (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Add an extra layer of security to your account
              </p>
              <Badge variant={twoFAEnabled ? "default" : "secondary"}>
                {twoFAEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {twoFAEnabled ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDisableToken("");
                  setDisableOpen(true);
                }}
              >
                <ShieldOff className="h-4 w-4 mr-1" />
                Disable 2FA
              </Button>
            ) : (
              <Button size="sm" onClick={handleOpenSetup}>
                <QrCode className="h-4 w-4 mr-1" />
                Set Up 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Auth</DialogTitle>
          </DialogHeader>

          {setupLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Generating QR code...
            </p>
          )}

          {!setupLoading && setupStep === "scan" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <div className="flex justify-center">
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>
              )}
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Or enter this secret manually:
                </p>
                <code className="text-xs font-mono break-all">{secret}</code>
              </div>
              <Button className="w-full" onClick={() => setSetupStep("verify")}>
                Next: Verify Code
              </Button>
            </div>
          )}

          {!setupLoading && setupStep === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to confirm
                setup.
              </p>
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyToken}
                  onChange={(e) =>
                    setVerifyToken(e.target.value.replace(/\D/g, ""))
                  }
                  className="text-center text-xl tracking-widest"
                  autoFocus
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setSetupStep("scan")}>
                  Back
                </Button>
                <Button
                  onClick={handleEnable2FA}
                  disabled={verifyToken.length < 6 || setupLoading}
                >
                  {setupLoading ? "Verifying..." : "Enable 2FA"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Auth</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter your current authenticator code to disable 2FA.
          </p>
          <div className="space-y-2">
            <Label>Authenticator Code</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={disableToken}
              onChange={(e) =>
                setDisableToken(e.target.value.replace(/\D/g, ""))
              }
              className="text-center text-xl tracking-widest"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDisableOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={disableToken.length < 6 || disableLoading}
            >
              {disableLoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

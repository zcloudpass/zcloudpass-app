import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Lock, AlertCircle, CheckCircle2, Sun, Moon } from "lucide-react";

interface SettingsProps {
  onLogout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function Settings({ onLogout, theme, toggleTheme }: SettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess("Password changed successfully! Please log in again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Logout after 2 seconds
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/vault")}
            className="w-11 h-11 rounded-2xl border hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Manage your master vault security
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Authentication</CardTitle>
            </div>
            <CardDescription>
              Update your master password to enhance vault security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Master Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Master Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-[11px] text-muted-foreground ml-1">
                  Use at least 12 characters with symbols for maximum safety.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="p-4 rounded-xl bg-muted border flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  <strong>Warning:</strong> Your new master password will be used to re-encrypt everything. If forgotten, no one can recover your data.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? "Processing..." : "Update Security Keys"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Account Session</CardTitle>
            <CardDescription>Manage your current access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm font-medium">Encryption Status</span>
              <span className="text-xs font-bold px-2 py-1 bg-primary text-primary-foreground rounded-lg">Active (AES-GCM)</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div className="space-y-0.5">
                <span className="text-sm font-medium block">Active Session</span>
                <span className="text-xs text-muted-foreground block">Expires on browser close</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all"
              >
                Terminate Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

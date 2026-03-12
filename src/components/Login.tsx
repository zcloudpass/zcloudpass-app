import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Lock, Mail, AlertCircle, Fingerprint } from "lucide-react";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await api.isBiometricAvailable();
      setBiometricAvailable(available);
    };
    checkBiometric();
  }, []);

  const handleBiometricAuth = async () => {
    setBiometricLoading(true);
    setError("");

    try {
      const authenticated = await api.authenticateWithBiometric();
      if (authenticated) {
        // If biometric succeeds, we still need email/password for server auth
        // But we can show a hint to remember credentials
        setError("Biometric recognized. Please enter your credentials to complete login.");
      } else {
        setError("Biometric authentication failed");
      }
    } catch (err) {
      console.error("Biometric auth error:", err);
      setError(err instanceof Error ? err.message : "Biometric authentication failed");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login({
        email,
        master_password: password,
      });
      onLoginSuccess();
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center text-foreground">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Securely access your digital keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {biometricAvailable && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base font-semibold flex items-center justify-center gap-2"
                onClick={handleBiometricAuth}
                disabled={biometricLoading || loading}
              >
                <Fingerprint className="w-5 h-5" />
                {biometricLoading ? "Scanning..." : "Unlock with Biometric"}
              </Button>
            )}

            {biometricAvailable && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-medium">Master Password</Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? "Decrypting..." : "Unlock Vault"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col pt-0 pb-6">
          <div className="text-sm text-muted-foreground text-center">
            New to zCloudPass?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Generate an account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

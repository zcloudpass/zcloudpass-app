import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  decryptVault,
  encryptVault,
  type Vault,
  type VaultEntry,
} from "../lib/crypto";
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
import {
  Search,
  ExternalLink,
  User,
  Unlock,
  Lock,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Settings,
  LogOut,
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  ChevronRight,
  X,
  Save,
  Globe,
  FileText,
  ArrowLeft,
  LucideDice3,
  Pencil,
  Fingerprint,
} from "lucide-react";
import PasswordGenerator from "./Passwordgenerator";

interface VaultProps {
  onLogout: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

type ViewMode = "view" | "create" | "edit";

const getFaviconUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
  } catch {
    return null;
  }
};

const colorFromName = (name: string) => {
  const colors = [
    "#0ea5e9",
    "#7c3aed",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#ef6aa7",
    "#64748b",
  ];
  const sum = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return colors[sum % colors.length];
};

const getLetterAvatarUrl = (name: string, size = 128) => {
  const letter = (name && name.charAt(0).toUpperCase()) || "?";
  const bg = colorFromName(name || "");
  const fg = "#ffffff";
  const fontSize = Math.floor(size * 0.5);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}' rx='${Math.floor(
    size * 0.12,
  )}'/><text x='50%' y='50%' dy='0.35em' text-anchor='middle' font-family='system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' font-size='${fontSize}' font-weight='bold' fill='${fg}'>${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default function Vault({ onLogout, theme, toggleTheme }: VaultProps) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("view");
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [faviconErrors, setFaviconErrors] = useState<Record<string, boolean>>(
    {},
  );
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const navigate = useNavigate();

  const [entryForm, setEntryForm] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  });

  const loadVault = async () => {
    try {
      setLoading(true);
      const response = await api.getVault();

      if (response.encrypted_vault) {
        setVault(null);
        setUnlocked(false);
      } else {
        setVault({ entries: [] });
        setUnlocked(true);
      }
    } catch (err) {
      console.error("Load vault error:", err);
      setError(err instanceof Error ? err.message : "Failed to load vault");
      if (err instanceof Error && err.message.includes("Session expired")) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVault();
  }, []);

  // Check biometric availability and whether we have a stored password
  useEffect(() => {
    const checkBiometric = async () => {
      const hasSavedPw = !!sessionStorage.getItem("_bp");
      if (hasSavedPw) {
        const available = await api.isBiometricAvailable();
        setBiometricAvailable(available);
      }
    };
    checkBiometric();
  }, [unlocked]);

  const handleBiometricUnlock = async () => {
    setBiometricLoading(true);
    setError("");
    try {
      const authenticated = await api.authenticateWithBiometric();
      if (!authenticated) {
        setError("Biometric authentication failed");
        return;
      }
      const savedPw = sessionStorage.getItem("_bp");
      if (!savedPw) {
        setError("No saved credentials. Please unlock with your master password first.");
        return;
      }
      const pw = atob(savedPw);
      setMasterPassword(pw);

      const response = await api.getVault();
      if (!response.encrypted_vault) {
        setError("No vault found");
        return;
      }
      const decrypted = await decryptVault(response.encrypted_vault, pw);
      setVault(decrypted);
      setUnlocked(true);
    } catch (err) {
      console.error("Biometric unlock error:", err);
      setError("Biometric unlock failed. Please use your master password.");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setError("");
      const response = await api.getVault();

      if (!response.encrypted_vault) {
        setError("No vault found");
        return;
      }

      const decrypted = await decryptVault(
        response.encrypted_vault,
        masterPassword,
      );
      setVault(decrypted);
      setUnlocked(true);
      // Store password for biometric unlock in current session
      sessionStorage.setItem("_bp", btoa(masterPassword));
    } catch (err) {
      console.error("Unlock error:", err);
      setError("Failed to unlock vault. Wrong password?");
    }
  };

  const handleLock = () => {
    setVault(null);
    setMasterPassword("");
    setUnlocked(false);
    setSelectedEntry(null);
    setViewMode("view");
    setShowPassword({});
    setShowMobileDetail(false);
    setEntryForm({
      name: "",
      username: "",
      password: "",
      url: "",
      notes: "",
    });
  };

  const saveVault = async (updatedVault: Vault) => {
    try {
      setSaving(true);
      setError("");
      const encrypted = await encryptVault(updatedVault, masterPassword);
      await api.updateVault({ encrypted_vault: encrypted });
      setVault(updatedVault);
      if (selectedEntry) {
        const updated = updatedVault.entries.find(
          (e) => e.id === selectedEntry.id,
        );
        setSelectedEntry(updated || null);
      }
    } catch (err) {
      console.error("Save vault error:", err);
      setError(err instanceof Error ? err.message : "Failed to save vault");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntry = () => {
    setEntryForm({ name: "", username: "", password: "", url: "", notes: "" });
    setSelectedEntry(null);
    setViewMode("create");
    setShowMobileDetail(true);
  };

  const handleEditEntry = (entry: VaultEntry) => {
    setEntryForm({
      name: entry.name,
      username: entry.username || "",
      password: entry.password || "",
      url: entry.url || "",
      notes: entry.notes || "",
    });
    setSelectedEntry(entry);
    setViewMode("edit");
    setShowMobileDetail(true);
  };

  const handleSaveEntry = async () => {
    if (!vault || !masterPassword || !entryForm.name) return;

    const newEntry: VaultEntry = {
      id: selectedEntry?.id || Date.now().toString(),
      name: entryForm.name,
      username: entryForm.username || undefined,
      password: entryForm.password || undefined,
      url: entryForm.url || undefined,
      notes: entryForm.notes || undefined,
    };

    const updatedEntries =
      viewMode === "edit" && selectedEntry
        ? vault.entries.map((e) => (e.id === selectedEntry.id ? newEntry : e))
        : [...vault.entries, newEntry];

    await saveVault({ entries: updatedEntries });
    setSelectedEntry(newEntry);
    setViewMode("view");
  };

  const handleCancelEdit = () => {
    if (selectedEntry && viewMode === "edit") {
      setViewMode("view");
    } else {
      setViewMode("view");
      setSelectedEntry(null);
      setShowMobileDetail(false);
    }
  };

  const handleBackToList = () => {
    setShowMobileDetail(false);
    setSelectedEntry(null);
    setViewMode("view");
  };

  const handleDeleteEntry = async (id: string) => {
    if (!vault || !masterPassword || !confirm("Delete this entry?")) return;
    const updatedEntries = vault.entries.filter((e) => e.id !== id);
    await saveVault({ entries: updatedEntries });
    setSelectedEntry(null);
    setViewMode("view");
    setShowMobileDetail(false);
  };


  const handleCopy = async (text: string) => {
    try {
      // Use Tauri's clipboard with auto-clear after 10 seconds
      await api.copyToClipboard(text, 10);
    } catch (err) {
      // Fallback to regular clipboard if Tauri method fails
      navigator.clipboard.writeText(text).catch(() => {
        console.error("Failed to copy to clipboard");
      });
    }
  };

  const handleGeneratePassword = () => {
    setGeneratorOpen(true);
  };

  const handlePasswordGenerated = (password: string) => {
    setEntryForm({ ...entryForm, password });
  };

  const handleFaviconError = (entryId: string) => {
    setFaviconErrors({ ...faviconErrors, [entryId]: true });
  };

  const handleSelectEntry = (entry: VaultEntry) => {
    setSelectedEntry(entry);
    setViewMode("view");
    setShowMobileDetail(true);
  };

  const filteredEntries =
    vault?.entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.url?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Unlock Vault
            </CardTitle>
            <CardDescription className="text-center">
              Provide your master password to decrypt your keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {biometricAvailable && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-semibold flex items-center justify-center gap-2"
                  onClick={handleBiometricUnlock}
                  disabled={biometricLoading}
                >
                  <Fingerprint className="w-5 h-5" />
                  {biometricLoading ? "Authenticating..." : "Unlock with Biometric"}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="masterPassword" title="masterPassword">
                Master Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="masterPassword"
                  type="password"
                  placeholder="••••••••"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <Button
              onClick={handleUnlock}
              className="w-full h-11 text-base font-semibold"
            >
              Unlock Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex-none w-full bg-background border-b px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              <img
                src="/favicon.svg"
                alt="zCloudPass"
                className="h-8 w-8 object-contain"
              />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block leading-none">
              zCloudPass
            </h1>
          </div>
          <div className="relative group flex-1 max-w-xs md:max-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 max-w-64 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-foreground/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLock}
            className="rounded-lg h-9 w-9 hover:text-primary"
            title="Lock Vault"
          >
            <Unlock className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg h-9 w-9 hidden md:flex"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="rounded-lg h-9 w-9"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="rounded-lg h-9 w-9 hover:text-destructive"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside
          className={`w-full md:w-80 border-r flex flex-col bg-muted/20 transition-transform duration-200 md:translate-x-0 ${
            showMobileDetail
              ? "-translate-x-full md:translate-x-0 absolute md:relative inset-0 md:inset-auto"
              : "translate-x-0"
          }`}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-px px-2 pt-4">
              <button
                onClick={handleAddEntry}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors group hover:bg-muted"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">New Entry</div>
                  <div className="text-xs text-muted-foreground">
                    Add a new password
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40" />
              </button>
            </div>
            <hr className="border-muted" />

            {filteredEntries.length > 0 ? (
              <div className="space-y-px px-2 pt-2">
                {filteredEntries.map((entry) => {
                  const faviconUrl = getFaviconUrl(entry.url);
                  const showFavicon = faviconUrl && !faviconErrors[entry.id];
                  const isActive =
                    selectedEntry?.id === entry.id && viewMode === "view";

                  return (
                    <div>
                      <button
                        key={entry.id}
                        onClick={() => handleSelectEntry(entry)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors group ${
                          isActive
                            ? "md:bg-foreground md:text-background"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                            isActive ? "text-foreground" : "text-primary"
                          }`}
                        >
                          {showFavicon ? (
                            <img
                              src={faviconUrl}
                              alt={entry.name}
                              className="w-full h-full object-cover"
                              onError={() => handleFaviconError(entry.id)}
                            />
                          ) : (
                            <img
                              src={getLetterAvatarUrl(entry.name)}
                              alt={entry.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {entry.name}
                          </div>
                          <div
                            className={`text-xs truncate ${isActive ? "text-background/60" : "text-muted-foreground"}`}
                          >
                            {entry.username ||
                              (entry.url
                                ? entry.url.replace(/^https?:\/\//, "")
                                : "No details")}
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isActive
                              ? "text-background/40"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                      <hr className="border-muted" />
                    </div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No entries found</p>
              </div>
            ) : null}
          </div>
        </aside>

        <main
          className={`flex-1 bg-background overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-12 transition-transform duration-200 ${
            showMobileDetail
              ? "translate-x-0"
              : "translate-x-full md:translate-x-0 absolute md:relative inset-0 md:inset-auto"
          }`}
        >
          {(viewMode !== "view" || selectedEntry) && (
            <div className="md:hidden mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to list
              </Button>
            </div>
          )}

          {viewMode === "view" && selectedEntry ? (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-start justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden">
                    {getFaviconUrl(selectedEntry.url) &&
                    !faviconErrors[selectedEntry.id] ? (
                      <img
                        src={getFaviconUrl(selectedEntry.url)!}
                        alt={selectedEntry.name}
                        className="w-full h-full object-cover"
                        onError={() => handleFaviconError(selectedEntry.id)}
                      />
                    ) : (
                      <img
                        src={getLetterAvatarUrl(selectedEntry.name, 128)}
                        alt={selectedEntry.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                      {selectedEntry.name}
                    </h2>
                    {selectedEntry.url && (
                      <a
                        href={selectedEntry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1 transition-colors truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{selectedEntry.url}</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditEntry(selectedEntry)}
                    className="h-10 w-10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteEntry(selectedEntry.id)}
                    className="h-10 w-10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-6">
                {selectedEntry.username && (
                  <div className="space-y-1.5 p-4 rounded-xl border bg-muted/10">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="w-3 h-3" /> Username / Email
                    </Label>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {selectedEntry.username}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopy(selectedEntry.username!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEntry.password && (
                  <div className="space-y-1.5 p-4 rounded-xl border bg-muted/10">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Password
                    </Label>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base md:text-lg tracking-wider truncate">
                        {showPassword[selectedEntry.id]
                          ? selectedEntry.password
                          : "••••••••••••"}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setShowPassword({
                              ...showPassword,
                              [selectedEntry.id]:
                                !showPassword[selectedEntry.id],
                            })
                          }
                        >
                          {showPassword[selectedEntry.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopy(selectedEntry.password!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEntry.notes && (
                  <div className="space-y-1.5 p-4 rounded-xl border bg-muted/10">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Notes
                    </Label>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {selectedEntry.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === "create" || viewMode === "edit" ? (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-start justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    {viewMode === "create" ? (
                      <Plus className="w-8 h-8 text-primary" />
                    ) : (
                      <Pencil className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                      {viewMode === "create" ? "New Entry" : "Edit Entry"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {viewMode === "create"
                        ? "Add a new password to your vault"
                        : "Update your entry details"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  className="h-10 w-10 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Google, GitHub, Reddit..."
                    value={entryForm.name}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, name: e.target.value })
                    }
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="url"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Website URL
                  </Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={entryForm.url}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, url: e.target.value })
                    }
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Username / Email
                  </Label>
                  <Input
                    id="username"
                    placeholder="user@example.com"
                    value={entryForm.username}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, username: e.target.value })
                    }
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      placeholder="Secret passphrase..."
                      value={entryForm.password}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, password: e.target.value })
                      }
                      className="flex-1 h-11 font-mono"
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleGeneratePassword}
                      className="h-11 px-3 md:px-4 gap-2 shrink-0"
                    >
                      <LucideDice3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Generate</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    placeholder="Recovery codes, special info..."
                    value={entryForm.notes}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, notes: e.target.value })
                    }
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEntry}
                    disabled={!entryForm.name || saving}
                    className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90 gap-2"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Encrypting...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save Entry</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
              <div className="w-40 h-40 flex items-center justify-center overflow-hidden">
                <img
                  src="/favicon.svg"
                  alt="zCloudPass"
                  className="w-32 h-32 object-contain"
                />
              </div>
              <div className="space-y-1 opacity-80">
                <h3 className="text-xl font-bold text-foreground">
                  Select an item
                </h3>
                <p className="max-w-[240px] text-sm">
                  Pick an entry from the list to view its secure details and
                  manage it.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <PasswordGenerator
        open={generatorOpen}
        onOpenChange={setGeneratorOpen}
        onGenerate={handlePasswordGenerated}
      />
    </div>
  );
}

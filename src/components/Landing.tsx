import { Link } from "react-router-dom";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "./ui/button";

interface LandingProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function Landing({ theme, toggleTheme }: LandingProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
            <img
              src="/favicon.svg"
              alt="zCloudPass"
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            zCloudPass
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-12 max-w-4xl mx-auto py-20">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
            Your Digital Keys,
            <br />
            Perfectly Secured.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A minimalist, open-source password manager focused on speed and
            end-to-end encryption. No bloat. Pure security.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-medium bg-foreground text-background hover:bg-foreground/90"
            >
              Create Your Vault <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Minimalist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left w-full">
          <div className="space-y-3 p-6 border rounded-xl">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Zero Knowledge</h3>
            <p className="text-muted-foreground text-sm">
              We never see your master password or your data. Everything is
              encrypted locally.
            </p>
          </div>
          <div className="space-y-3 p-6 border rounded-xl">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">AES-256 GCM</h3>
            <p className="text-muted-foreground text-sm">
              Bank-grade encryption protocols protect every character of your
              digital life.
            </p>
          </div>
          <div className="space-y-3 p-6 border rounded-xl">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Cloud Sync</h3>
            <p className="text-muted-foreground text-sm">
              Securely sync across all your devices while maintaining full
              privacy control.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t text-center text-muted-foreground text-sm">
        <p>
          &copy; {new Date().getFullYear()} zCloudPass. Secure. Simple.
          Synchronised.
        </p>
      </footer>
    </div>
  );
}

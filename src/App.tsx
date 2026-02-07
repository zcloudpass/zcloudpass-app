import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Vault from "./components/Vault";
import Settings from "./components/Settings";
import Landing from "./components/Landing";
import { api } from "./lib/api";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  });

  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated());
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate("/vault");
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/vault" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/vault" replace />
            ) : (
              <Register onRegisterSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route
          path="/vault"
          element={
            isAuthenticated ? (
              <Vault
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <Settings
                onLogout={handleLogout}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/vault" replace />
            ) : (
              <Landing theme={theme} toggleTheme={toggleTheme} />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

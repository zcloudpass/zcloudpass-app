import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../src/App";
import { api } from "../../src/lib/api";

// Mock the API module
vi.mock("../../src/lib/api", () => ({
  api: {
    isAuthenticated: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getVault: vi.fn(),
    updateVault: vi.fn(),
    checkHealth: vi.fn(),
    changePassword: vi.fn(),
  },
}));

// Mock crypto to avoid Web Crypto API issues in jsdom
vi.mock("../../src/lib/crypto", () => ({
  encryptVault: vi.fn().mockResolvedValue("encrypted"),
  decryptVault: vi.fn().mockResolvedValue({ entries: [] }),
  createEmptyVault: vi.fn(() => ({ entries: [] })),
  generatePassword: vi.fn(() => "MockPassword123!"),
}));

// Mock DecryptedText since it uses canvas/animation APIs
vi.mock("../../src/components/DecryptedText", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

// Mock GridScan since it uses canvas
vi.mock("../../src/components/GridScan", () => ({
  default: () => <div data-testid="grid-scan" />,
}));

describe("App Routing Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Unauthenticated user", () => {
    beforeEach(() => {
      (api.isAuthenticated as any).mockReturnValue(false);
    });

    it("should render Landing page at root path", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      // Landing page has the tagline
      expect(screen.getByText("Your Digital Keys,")).toBeTruthy();
    });

    it("should render Login page at /login", () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App />
        </MemoryRouter>,
      );

      expect(screen.getByText("Welcome Back")).toBeTruthy();
    });

    it("should render Register page at /register", () => {
      render(
        <MemoryRouter initialEntries={["/register"]}>
          <App />
        </MemoryRouter>,
      );

      expect(screen.getByText("Secure Your World")).toBeTruthy();
    });

    it("should redirect /vault to /login when unauthenticated", () => {
      render(
        <MemoryRouter initialEntries={["/vault"]}>
          <App />
        </MemoryRouter>,
      );

      // Should see login page, not vault
      expect(screen.getByText("Welcome Back")).toBeTruthy();
    });

    it("should redirect /settings to /login when unauthenticated", () => {
      render(
        <MemoryRouter initialEntries={["/settings"]}>
          <App />
        </MemoryRouter>,
      );

      expect(screen.getByText("Welcome Back")).toBeTruthy();
    });
  });

  describe("Authenticated user", () => {
    beforeEach(() => {
      (api.isAuthenticated as any).mockReturnValue(true);
      localStorage.setItem("session_token", "valid-token");
      localStorage.setItem("master_password_hash", "test-password");
      (api.getVault as any).mockResolvedValue({ encrypted_vault: null });
    });

    it("should redirect / to /vault when authenticated", async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      // Should not see landing page
      await waitFor(() => {
        expect(screen.queryByText("Your Digital Keys,")).toBeNull();
      });
    });

    it("should redirect /login to /vault when authenticated", async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.queryByText("Welcome Back")).toBeNull();
      });
    });

    it("should redirect /register to /vault when authenticated", async () => {
      render(
        <MemoryRouter initialEntries={["/register"]}>
          <App />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.queryByText("Secure Your World")).toBeNull();
      });
    });
  });
});

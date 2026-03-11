import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Settings from "../../src/components/Settings";
import { api } from "../../src/lib/api";

// Mock the API module
vi.mock("../../src/lib/api", () => ({
  api: {
    changePassword: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(() => true),
  },
}));

describe("Settings Flow Integration", () => {
  const mockOnLogout = vi.fn();
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Change Password Flow", () => {
    it("should complete full password change: fill form → submit → success → auto-logout", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      (api.changePassword as any).mockResolvedValueOnce({});

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      // Fill current password
      await user.type(
        screen.getByLabelText("Current Master Password"),
        "OldPassword123!",
      );

      // Fill new password
      await user.type(
        screen.getByLabelText("New Master Password"),
        "NewSecurePass456!",
      );

      // Fill confirm password
      await user.type(
        screen.getByLabelText("Confirm New Password"),
        "NewSecurePass456!",
      );

      // Submit
      await user.click(
        screen.getByRole("button", { name: /update security keys/i }),
      );

      // Verify API called with correct data
      await waitFor(() => {
        expect(api.changePassword).toHaveBeenCalledWith({
          current_password: "OldPassword123!",
          new_password: "NewSecurePass456!",
        });
      });

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeTruthy();
      });

      // After 2 seconds, should auto-logout
      vi.advanceTimersByTime(2500);

      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalledOnce();
      });
    });

    it("should show error when new passwords do not match", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      await user.type(
        screen.getByLabelText("Current Master Password"),
        "CurrentPass",
      );
      await user.type(
        screen.getByLabelText("New Master Password"),
        "NewPassword1!",
      );
      await user.type(
        screen.getByLabelText("Confirm New Password"),
        "DifferentPassword!",
      );

      await user.click(
        screen.getByRole("button", { name: /update security keys/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("New passwords do not match")).toBeTruthy();
      });

      // API should NOT be called
      expect(api.changePassword).not.toHaveBeenCalled();
    });

    it("should show error when new password is too short", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      await user.type(
        screen.getByLabelText("Current Master Password"),
        "CurrentPass",
      );
      await user.type(screen.getByLabelText("New Master Password"), "short");
      await user.type(screen.getByLabelText("Confirm New Password"), "short");

      await user.click(
        screen.getByRole("button", { name: /update security keys/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText("New password must be at least 8 characters long"),
        ).toBeTruthy();
      });

      expect(api.changePassword).not.toHaveBeenCalled();
    });

    it("should display API error when password change fails", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      (api.changePassword as any).mockRejectedValueOnce(
        new Error("Current password is incorrect"),
      );

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      await user.type(
        screen.getByLabelText("Current Master Password"),
        "WrongPassword",
      );
      await user.type(
        screen.getByLabelText("New Master Password"),
        "NewValidPass123!",
      );
      await user.type(
        screen.getByLabelText("Confirm New Password"),
        "NewValidPass123!",
      );

      await user.click(
        screen.getByRole("button", { name: /update security keys/i }),
      );

      await waitFor(() => {
        expect(screen.getByText("Current password is incorrect")).toBeTruthy();
      });

      // Should NOT auto-logout on error
      expect(mockOnLogout).not.toHaveBeenCalled();
    });

    it("should show loading state during password change", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      let resolveChange: (value: any) => void;
      const changePromise = new Promise((resolve) => {
        resolveChange = resolve;
      });
      (api.changePassword as any).mockReturnValueOnce(changePromise);

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      await user.type(
        screen.getByLabelText("Current Master Password"),
        "CurrentPass",
      );
      await user.type(
        screen.getByLabelText("New Master Password"),
        "NewPassword123!",
      );
      await user.type(
        screen.getByLabelText("Confirm New Password"),
        "NewPassword123!",
      );

      await user.click(
        screen.getByRole("button", { name: /update security keys/i }),
      );

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText("Processing...")).toBeTruthy();
      });

      // Resolve the promise
      resolveChange!({});

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeTruthy();
      });
    });
  });

  describe("Settings UI Integration", () => {
    it("should display security info section", () => {
      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      expect(screen.getByText("Settings")).toBeTruthy();
      expect(screen.getByText("Authentication")).toBeTruthy();
      expect(screen.getByText("Active (AES-GCM)")).toBeTruthy();
      expect(screen.getByText("Account Session")).toBeTruthy();
    });

    it("should trigger logout when terminate session button is clicked", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );

      const terminateButton = screen.getByRole("button", {
        name: /terminate session/i,
      });
      await user.click(terminateButton);

      expect(mockOnLogout).toHaveBeenCalledOnce();
    });

    it("should render with both theme variants", () => {
      const { unmount } = render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="light"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );
      expect(screen.getByText("Settings")).toBeTruthy();
      unmount();

      render(
        <MemoryRouter>
          <Settings
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>,
      );
      expect(screen.getByText("Settings")).toBeTruthy();
    });
  });
});

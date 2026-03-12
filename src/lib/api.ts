// API client for zCloudPass backend
// Uses VITE_API_BASE_URL env variable if set, otherwise defaults to production backend
import { invoke } from "@tauri-apps/api/core";
import { authenticate, checkStatus as biometricStatus } from "@tauri-apps/plugin-biometric";
import { writeText, clear as clearClipboard } from "@tauri-apps/plugin-clipboard-manager";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://zcloudpass-backend.onrender.com/api/v1";

interface RegisterRequest {
  username?: string;
  email: string;
  master_password: string;
  encrypted_vault?: string;
}

interface RegisterResponse {
  id: number;
  email: string;
}

interface LoginRequest {
  email: string;
  master_password: string;
}

interface LoginResponse {
  session_token: string;
  expires_at: string;
}

interface VaultResponse {
  encrypted_vault: string | null;
}

interface VaultUpdate {
  encrypted_vault: string;
}

interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem("session_token");
    if (!token) {
      throw new Error("No session token found");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error [${response.status}]:`, errorText);

      if (response.status === 401) {
        // Session expired or invalid
        localStorage.removeItem("session_token");
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(
        `API error ${response.status}: ${errorText || response.statusText}`,
      );
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return {} as T;
    }

    return response.json();
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    console.log("API: Registering user", data.email);
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse<RegisterResponse>(response);
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log("API: Logging in", data.email);
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<LoginResponse>(response);

    // Store session token
    localStorage.setItem("session_token", result.session_token);
    console.log("Session token stored, expires:", result.expires_at);

    return result;
  }

  async getVault(): Promise<VaultResponse> {
    console.log("API: Fetching vault");
    const response = await fetch(`${this.baseUrl}/vault`, {
      method: "GET",
      headers: this.getAuthHeader(),
    });
    return this.handleResponse<VaultResponse>(response);
  }

  async updateVault(data: VaultUpdate): Promise<void> {
    console.log("API: Updating vault");
    const response = await fetch(`${this.baseUrl}/vault`, {
      method: "PUT",
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });
    await this.handleResponse<void>(response);
    console.log("Vault updated successfully");
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    console.log("API: Changing password");
    const response = await fetch(`${this.baseUrl}/auth/change-password`, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify(data),
    });
    await this.handleResponse<void>(response);
    console.log("Password changed successfully");
  }

  async checkHealth(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/health`);
    return response.text();
  }

  // Biometric authentication methods
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const result = await biometricStatus();
      return result.isAvailable;
    } catch (err) {
      console.error("Biometric availability check failed:", err);
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      await authenticate("Unlock your vault securely with biometric authentication", {
        allowDeviceCredential: true,
      });
      return true;
    } catch (err) {
      console.error("Biometric authentication failed:", err);
      return false;
    }
  }

  async copyToClipboard(text: string, delaySecs: number = 10): Promise<void> {
    try {
      await invoke<void>("copy_and_clear", {
        text,
        delaySecs,
      });
    } catch (err) {
      // Fallback: use plugin directly and set our own timer
      console.warn("copy_and_clear command failed, using fallback:", err);
      await writeText(text);
      setTimeout(async () => {
        try {
          await clearClipboard();
        } catch {
          // Ignore clear failures
        }
      }, delaySecs * 1000);
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("session_token");
  }

  logout(): void {
    localStorage.removeItem("session_token");
    console.log("Logged out, session token removed");
  }
}

export const api = new ApiClient(API_BASE_URL);

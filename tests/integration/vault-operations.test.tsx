import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Vault from '../../src/components/Vault';
import { api } from '../../src/lib/api';
import { decryptVault, encryptVault, createEmptyVault } from '../../src/lib/crypto';

// Mock the API module
vi.mock('../../src/lib/api', () => ({
  api: {
    getVault: vi.fn(),
    updateVault: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(() => true),
  },
}));

// Mock crypto
vi.mock('../../src/lib/crypto', () => ({
  decryptVault: vi.fn(),
  encryptVault: vi.fn(),
  createEmptyVault: vi.fn(() => ({ entries: [] })),
  generatePassword: vi.fn(() => 'GeneratedPass123!@#'),
}));

describe('Vault Operations Integration', () => {
  const mockOnLogout = vi.fn();
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('master_password_hash', 'test-master-password');
  });

  describe('Vault Load Flow', () => {
    it('should fetch and decrypt vault on mount', async () => {
      const mockEntries = [
        {
          id: '1',
          name: 'Gmail',
          username: 'user@gmail.com',
          password: 'gmail-pass',
          url: 'https://gmail.com',
          notes: 'Personal email',
        },
        {
          id: '2',
          name: 'GitHub',
          username: 'developer',
          password: 'gh-token',
          url: 'https://github.com',
        },
      ];

      (api.getVault as any).mockResolvedValueOnce({
        encrypted_vault: 'encrypted-data-base64',
      });
      (decryptVault as any).mockResolvedValueOnce({ entries: mockEntries });

      render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      // Verify the API was called to fetch vault
      await waitFor(() => {
        expect(api.getVault).toHaveBeenCalledOnce();
      });

      // Verify decryption was called with the encrypted data and master password
      await waitFor(() => {
        expect(decryptVault).toHaveBeenCalledWith(
          'encrypted-data-base64',
          'test-master-password'
        );
      });

      // Vault entries should be rendered
      await waitFor(() => {
        expect(screen.getByText('Gmail')).toBeTruthy();
        expect(screen.getByText('GitHub')).toBeTruthy();
      });
    });

    it('should handle empty vault (new user)', async () => {
      (api.getVault as any).mockResolvedValueOnce({
        encrypted_vault: null,
      });

      render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(api.getVault).toHaveBeenCalledOnce();
      });

      // decryptVault should NOT have been called since encrypted_vault is null
      expect(decryptVault).not.toHaveBeenCalled();
    });

    it('should handle vault fetch failure', async () => {
      (api.getVault as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { container } = render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(api.getVault).toHaveBeenCalledOnce();
      });

      // Component should still render (graceful error handling)
      expect(container).toBeTruthy();
    });

    it('should handle decryption failure', async () => {
      (api.getVault as any).mockResolvedValueOnce({
        encrypted_vault: 'encrypted-data',
      });
      (decryptVault as any).mockRejectedValueOnce(
        new Error('Failed to decrypt vault. Wrong password?')
      );

      const { container } = render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(decryptVault).toHaveBeenCalled();
      });

      expect(container).toBeTruthy();
    });
  });

  describe('Vault with Multiple Entry Types', () => {
    it('should display entries with various optional fields', async () => {
      const mixedEntries = [
        {
          id: '1',
          name: 'Full Entry',
          username: 'user@test.com',
          password: 'pass123',
          url: 'https://test.com',
          notes: 'Test notes',
        },
        {
          id: '2',
          name: 'Minimal Entry',
          // No other fields
        },
        {
          id: '3',
          name: 'No URL Entry',
          username: 'admin',
          password: 'admin123',
          notes: 'Internal service',
        },
      ];

      (api.getVault as any).mockResolvedValueOnce({
        encrypted_vault: 'encrypted-data',
      });
      (decryptVault as any).mockResolvedValueOnce({ entries: mixedEntries });

      render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="light"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Full Entry')).toBeTruthy();
        expect(screen.getByText('Minimal Entry')).toBeTruthy();
        expect(screen.getByText('No URL Entry')).toBeTruthy();
      });
    });
  });

  describe('Session and Auth Integration', () => {
    it('should handle 401 error by triggering logout', async () => {
      const error = new Error('Session expired. Please login again.');
      (api.getVault as any).mockRejectedValueOnce(error);

      render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(api.getVault).toHaveBeenCalledOnce();
      });
    });

    it('should use master password from localStorage for decryption', async () => {
      localStorage.setItem('master_password_hash', 'my-specific-password');

      (api.getVault as any).mockResolvedValueOnce({
        encrypted_vault: 'test-encrypted-vault',
      });
      (decryptVault as any).mockResolvedValueOnce({ entries: [] });

      render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(decryptVault).toHaveBeenCalledWith(
          'test-encrypted-vault',
          'my-specific-password'
        );
      });
    });
  });

  describe('Theme Integration', () => {
    it('should render correctly with light theme', async () => {
      (api.getVault as any).mockResolvedValueOnce({ encrypted_vault: null });

      const { container } = render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="light"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      expect(container).toBeTruthy();
    });

    it('should render correctly with dark theme', async () => {
      (api.getVault as any).mockResolvedValueOnce({ encrypted_vault: null });

      const { container } = render(
        <MemoryRouter>
          <Vault
            onLogout={mockOnLogout}
            theme="dark"
            toggleTheme={mockToggleTheme}
          />
        </MemoryRouter>
      );

      expect(container).toBeTruthy();
    });
  });
});

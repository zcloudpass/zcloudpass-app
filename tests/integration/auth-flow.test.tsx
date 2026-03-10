import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../src/components/Login';
import Register from '../../src/components/Register';
import { api } from '../../src/lib/api';
import { encryptVault, createEmptyVault } from '../../src/lib/crypto';

// Mock the API module
vi.mock('../../src/lib/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    logout: vi.fn(),
  },
}));

// Mock crypto
vi.mock('../../src/lib/crypto', () => ({
  encryptVault: vi.fn().mockResolvedValue('encrypted-vault-data'),
  decryptVault: vi.fn().mockResolvedValue({ entries: [] }),
  createEmptyVault: vi.fn(() => ({ entries: [] })),
  generatePassword: vi.fn(() => 'MockPassword123!'),
}));

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Login Flow', () => {
    const mockOnLoginSuccess = vi.fn();

    it('should complete full login flow: fill form → submit → success', async () => {
      const user = userEvent.setup();

      (api.login as any).mockResolvedValueOnce({
        session_token: 'test-token-123',
        expires_at: '2025-12-31T00:00:00Z',
      });

      render(
        <MemoryRouter>
          <Login onLoginSuccess={mockOnLoginSuccess} />
        </MemoryRouter>
      );

      // Fill in the email field
      const emailInput = screen.getByPlaceholderText('name@example.com');
      await user.type(emailInput, 'test@example.com');
      expect((emailInput as HTMLInputElement).value).toBe('test@example.com');

      // Fill in the password field
      const passwordInput = screen.getByPlaceholderText('••••••••');
      await user.type(passwordInput, 'SecurePass123!');
      expect((passwordInput as HTMLInputElement).value).toBe('SecurePass123!');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /unlock vault/i });
      await user.click(submitButton);

      // Verify API was called with correct credentials
      await waitFor(() => {
        expect(api.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          master_password: 'SecurePass123!',
        });
      });

      // Verify success callback was triggered
      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalledOnce();
      });
    });

    it('should display error message when login fails', async () => {
      const user = userEvent.setup();

      (api.login as any).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      render(
        <MemoryRouter>
          <Login onLoginSuccess={mockOnLoginSuccess} />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText('name@example.com'), 'wrong@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /unlock vault/i }));

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeTruthy();
      });

      // Success callback should NOT have been called
      expect(mockOnLoginSuccess).not.toHaveBeenCalled();
    });

    it('should show loading state while login is in progress', async () => {
      const user = userEvent.setup();

      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      (api.login as any).mockReturnValueOnce(loginPromise);

      render(
        <MemoryRouter>
          <Login onLoginSuccess={mockOnLoginSuccess} />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await user.click(screen.getByRole('button', { name: /unlock vault/i }));

      // Button should show loading text
      await waitFor(() => {
        expect(screen.getByText('Decrypting...')).toBeTruthy();
      });

      // Resolve the login
      resolveLogin!({ session_token: 'token', expires_at: '2025-12-31' });

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it('should have a link to navigate to register page', () => {
      render(
        <MemoryRouter>
          <Login onLoginSuccess={mockOnLoginSuccess} />
        </MemoryRouter>
      );

      const registerLink = screen.getByText('Generate an account');
      expect(registerLink).toBeTruthy();
      expect(registerLink.closest('a')?.getAttribute('href')).toBe('/register');
    });
  });

  describe('Registration Flow', () => {
    const mockOnRegisterSuccess = vi.fn();

    it('should complete full registration flow: fill form → encrypt → register → login → success', async () => {
      const user = userEvent.setup();

      (api.register as any).mockResolvedValueOnce({
        id: 1,
        email: 'new@example.com',
      });
      (api.login as any).mockResolvedValueOnce({
        session_token: 'new-token',
        expires_at: '2025-12-31T00:00:00Z',
      });

      render(
        <MemoryRouter>
          <Register onRegisterSuccess={mockOnRegisterSuccess} />
        </MemoryRouter>
      );

      // Fill email
      await user.type(screen.getByPlaceholderText('name@example.com'), 'new@example.com');

      // Fill password — Register has two password fields (password + confirm)
      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'StrongPass123!');
      await user.type(passwordInputs[1], 'StrongPass123!');

      // Submit
      await user.click(screen.getByRole('button', { name: /create master vault/i }));

      // Verify crypto was called to create and encrypt vault
      await waitFor(() => {
        expect(createEmptyVault).toHaveBeenCalled();
        expect(encryptVault).toHaveBeenCalledWith(
          { entries: [] },
          'StrongPass123!'
        );
      });

      // Verify register API was called
      await waitFor(() => {
        expect(api.register).toHaveBeenCalledWith({
          email: 'new@example.com',
          master_password: 'StrongPass123!',
          encrypted_vault: 'encrypted-vault-data',
        });
      });

      // Verify auto-login after registration
      await waitFor(() => {
        expect(api.login).toHaveBeenCalledWith({
          email: 'new@example.com',
          master_password: 'StrongPass123!',
        });
      });

      // Verify success callback
      await waitFor(() => {
        expect(mockOnRegisterSuccess).toHaveBeenCalledOnce();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Register onRegisterSuccess={mockOnRegisterSuccess} />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'Password123!');
      await user.type(passwordInputs[1], 'DifferentPass!');

      await user.click(screen.getByRole('button', { name: /create master vault/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });

      // API should not be called
      expect(api.register).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Register onRegisterSuccess={mockOnRegisterSuccess} />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'short');
      await user.type(passwordInputs[1], 'short');

      await user.click(screen.getByRole('button', { name: /create master vault/i }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters long')).toBeTruthy();
      });

      expect(api.register).not.toHaveBeenCalled();
    });

    it('should display registration API error messages', async () => {
      const user = userEvent.setup();

      (api.register as any).mockRejectedValueOnce(
        new Error('Email already exists')
      );

      render(
        <MemoryRouter>
          <Register onRegisterSuccess={mockOnRegisterSuccess} />
        </MemoryRouter>
      );

      await user.type(screen.getByPlaceholderText('name@example.com'), 'existing@example.com');

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInputs[0], 'ValidPass123!');
      await user.type(passwordInputs[1], 'ValidPass123!');

      await user.click(screen.getByRole('button', { name: /create master vault/i }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeTruthy();
      });

      expect(mockOnRegisterSuccess).not.toHaveBeenCalled();
    });

    it('should display password strength indicator', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Register onRegisterSuccess={mockOnRegisterSuccess} />
        </MemoryRouter>
      );

      const passwordInputs = screen.getAllByPlaceholderText('••••••••');

      // Type a weak password
      await user.type(passwordInputs[0], 'weak');
      expect(screen.getByText('Weak')).toBeTruthy();

      // Clear and type a medium password
      await user.clear(passwordInputs[0]);
      await user.type(passwordInputs[0], 'MediumPass1');
      expect(screen.getByText('Medium')).toBeTruthy();
    });

    it('should have a link to navigate to login page', () => {
      render(
        <MemoryRouter>
          <Register onRegisterSuccess={mockOnRegisterSuccess} />
        </MemoryRouter>
      );

      const loginLink = screen.getByText('Unlock existing');
      expect(loginLink).toBeTruthy();
      expect(loginLink.closest('a')?.getAttribute('href')).toBe('/login');
    });
  });
});

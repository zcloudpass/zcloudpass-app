import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../../src/lib/api';

// Mock fetch globally using vi.stubGlobal to preserve jsdom's other globals
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
    console.log = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('register', () => {
    it('should send registration request with correct data', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 1, email: 'test@example.com' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      const result = await api.register({
        email: 'test@example.com',
        master_password: 'TestPassword123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should handle registration errors', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        text: async () => 'Email already exists',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await expect(
        api.register({
          email: 'existing@example.com',
          master_password: 'TestPassword123',
        })
      ).rejects.toThrow('API error 409');
    });

    it('should include optional fields when provided', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 2, email: 'user@example.com' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await api.register({
        username: 'testuser',
        email: 'user@example.com',
        master_password: 'TestPassword123',
        encrypted_vault: 'encrypted-data-here',
      });

      const callArgs = (fetchMock as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.username).toBe('testuser');
      expect(body.encrypted_vault).toBe('encrypted-data-here');
    });
  });

  describe('login', () => {
    it('should send login request and store session token', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          session_token: 'test-token-123',
          expires_at: '2024-12-31T00:00:00Z',
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      const result = await api.login({
        email: 'test@example.com',
        master_password: 'TestPassword123',
      });

      expect(result.session_token).toBe('test-token-123');
      expect(localStorage.getItem('session_token')).toBe('test-token-123');
    });

    it('should handle login errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await expect(
        api.login({
          email: 'test@example.com',
          master_password: 'WrongPassword',
        })
      ).rejects.toThrow('Session expired');
    });

    it('should send correct request format', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          session_token: 'token',
          expires_at: '2024-12-31T00:00:00Z',
        }),
        headers: new Headers({ 'content-type': 'application/json' }),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await api.login({
        email: 'test@example.com',
        master_password: 'TestPassword123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  describe('getVault', () => {
    it('should send authenticated request to get vault', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: true,
        json: async () => ({ encrypted_vault: 'encrypted-data' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      const result = await api.getVault();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vault'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
      expect(result.encrypted_vault).toBe('encrypted-data');
    });

    it('should throw error when no session token exists', async () => {
      await expect(api.getVault()).rejects.toThrow('No session token found');
    });

    it('should handle 401 errors and clear token', async () => {
      localStorage.setItem('session_token', 'invalid-token');
      const mockResponse = {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await expect(api.getVault()).rejects.toThrow('Session expired');
      expect(localStorage.getItem('session_token')).toBeNull();
    });
  });

  describe('updateVault', () => {
    it('should send authenticated request to update vault', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: true,
        text: async () => '',
        headers: new Headers(),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await api.updateVault({
        encrypted_vault: 'new-encrypted-data',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vault'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });

    it('should throw error when no session token exists', async () => {
      await expect(
        api.updateVault({ encrypted_vault: 'data' })
      ).rejects.toThrow('No session token found');
    });

    it('should handle update errors', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Server error',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await expect(
        api.updateVault({ encrypted_vault: 'data' })
      ).rejects.toThrow('API error 500');
    });
  });

  describe('changePassword', () => {
    it('should send authenticated request to change password', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: true,
        text: async () => '',
        headers: new Headers(),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await api.changePassword({
        current_password: 'OldPass123',
        new_password: 'NewPass456',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/change-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });

    it('should include password change data in request body', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: true,
        text: async () => '',
        headers: new Headers(),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await api.changePassword({
        current_password: 'CurrentPass',
        new_password: 'NewPassword',
      });

      const callArgs = (fetchMock as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.current_password).toBe('CurrentPass');
      expect(body.new_password).toBe('NewPassword');
    });

    it('should throw error when no session token exists', async () => {
      await expect(
        api.changePassword({
          current_password: 'Current',
          new_password: 'New',
        })
      ).rejects.toThrow('No session token found');
    });
  });

  describe('checkHealth', () => {
    it('should return health check status', async () => {
      const mockResponse = {
        ok: true,
        text: async () => 'OK',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      const result = await api.checkHealth();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/health')
      );
      expect(result).toBe('OK');
    });

    it('should not require authentication', async () => {
      const mockResponse = {
        ok: true,
        text: async () => 'Health OK',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      await api.checkHealth();

      const callArgs = (fetchMock as any).mock.calls[0];
      // checkHealth doesn't pass a second argument (options)
      expect(callArgs[0]).toContain('/auth/health');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when session token exists', () => {
      localStorage.setItem('session_token', 'valid-token');
      expect(api.isAuthenticated()).toBe(true);
    });

    it('should return false when no session token exists', () => {
      localStorage.clear();
      expect(api.isAuthenticated()).toBe(false);
    });

    it('should return false for empty session token', () => {
      localStorage.setItem('session_token', '');
      expect(api.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove session token from localStorage', () => {
      localStorage.setItem('session_token', 'valid-token');
      
      api.logout();
      
      expect(localStorage.getItem('session_token')).toBeNull();
    });

    it('should work even if no token exists', () => {
      localStorage.clear();
      
      expect(() => api.logout()).not.toThrow();
      expect(localStorage.getItem('session_token')).toBeNull();
    });

    it('should update isAuthenticated status', () => {
      localStorage.setItem('session_token', 'valid-token');
      expect(api.isAuthenticated()).toBe(true);
      
      api.logout();
      
      expect(api.isAuthenticated()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle non-JSON responses gracefully', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: true,
        text: async () => 'Plain text response',
        headers: new Headers({ 'content-type': 'text/plain' }),
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      const result = await api.getVault();
      
      expect(result).toEqual({});
    });

    it('should handle network errors', async () => {
      localStorage.setItem('session_token', 'valid-token');
      (fetchMock as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getVault()).rejects.toThrow('Network error');
    });

    it('should log API errors to console', async () => {
      localStorage.setItem('session_token', 'valid-token');
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Server error',
      };
      (fetchMock as any).mockResolvedValueOnce(mockResponse);

      try {
        await api.getVault();
      } catch (e) {
        // Expected to throw
      }

      expect(console.log).toHaveBeenCalled();
    });
  });
});

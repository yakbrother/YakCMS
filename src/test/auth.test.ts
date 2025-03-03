import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { rest } from 'msw';

describe('Authentication System', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('Password Reset', () => {
    it('should request password reset successfully', async () => {
      const mockResponse = { success: true };
      server.use(
        rest.post('/api/auth/reset-password', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it('should handle reset password with valid token', async () => {
      const mockResponse = { success: true };
      server.use(
        rest.put('/api/auth/reset-password', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: 'valid-token',
          password: 'newPassword123'
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it('should handle expired reset token', async () => {
      server.use(
        rest.put('/api/auth/reset-password', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Token expired' })
          );
        })
      );

      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: 'expired-token',
          password: 'newPassword123'
        }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBe('Token expired');
    });
  });

  describe('Email Verification', () => {
    it('should request email verification successfully', async () => {
      const mockResponse = { success: true };
      server.use(
        rest.post('/api/auth/verify-email', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it('should verify email with valid token', async () => {
      const mockResponse = { success: true };
      server.use(
        rest.put('/api/auth/verify-email', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-token' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it('should handle invalid verification token', async () => {
      server.use(
        rest.put('/api/auth/verify-email', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Invalid token' })
          );
        })
      );

      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token' }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBe('Invalid token');
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should setup 2FA successfully', async () => {
      const mockResponse = { 
        secret: 'ABCDEFGHIJKLMNOP',
        qrCode: 'data:image/png;base64,..." 
      };
      server.use(
        rest.post('/api/auth/2fa/setup', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('secret');
      expect(data).toHaveProperty('qrCode');
    });

    it('should verify 2FA token successfully', async () => {
      const mockResponse = { success: true };
      server.use(
        rest.post('/api/auth/2fa/verify', (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        })
      );

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: '123456' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it('should handle invalid 2FA token', async () => {
      server.use(
        rest.post('/api/auth/2fa/verify', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ error: 'Invalid token' })
          );
        })
      );

      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid' }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBe('Invalid token');
    });
  });
});

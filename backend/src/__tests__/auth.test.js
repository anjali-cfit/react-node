import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database
jest.unstable_mockModule('../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

// Mock bcrypt
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
  },
}));

// Mock jwt
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn(),
  },
}));

// Mock uuid
jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('Auth Service', () => {
  let authService;
  let db;
  let bcrypt;
  let jwt;

  beforeEach(async () => {
    jest.clearAllMocks();

    db = await import('../config/database.js');
    bcrypt = (await import('bcryptjs')).default;
    jwt = (await import('jsonwebtoken')).default;

    const authModule = await import('../services/authService.js');
    authService = authModule.authService;
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'mock-uuid',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'customer',
        }],
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should throw error if email already exists', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-user' }],
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          first_name: 'John',
          last_name: 'Doe',
          role: 'customer',
          is_active: true,
        }],
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid email', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          is_active: true,
        }],
      });
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for deactivated account', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-id',
          email: 'test@example.com',
          password: 'hashed_password',
          is_active: false,
        }],
      });

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Account is deactivated');
    });
  });
});

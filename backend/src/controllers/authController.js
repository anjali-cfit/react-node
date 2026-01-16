import { authService } from '../services/authService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: 'customer',
    });

    ApiResponse.created(result, 'User registered successfully').send(res);
  }),

  registerAdmin: asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
    });

    ApiResponse.created(result, 'Admin registered successfully').send(res);
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    ApiResponse.success(result, 'Login successful').send(res);
  }),

  getProfile: asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.id);

    ApiResponse.success(profile).send(res);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { firstName, lastName } = req.body;

    const profile = await authService.updateProfile(req.user.id, {
      firstName,
      lastName,
    });

    ApiResponse.success(profile, 'Profile updated successfully').send(res);
  }),
};

import { orderService } from '../services/orderService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const orderController = {
  create: asyncHandler(async (req, res) => {
    const { shippingAddress } = req.body;

    const order = await orderService.createOrder(req.user.id, shippingAddress);

    ApiResponse.created(order, 'Order placed successfully').send(res);
  }),

  getMyOrders: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const result = await orderService.getUserOrders(req.user.id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
    });

    ApiResponse.success(result).send(res);
  }),

  getOrderById: asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === 'admin';

    const order = await orderService.getOrderById(
      req.params.id,
      req.user.id,
      isAdmin
    );

    ApiResponse.success(order).send(res);
  }),

  getAllOrders: asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, userId } = req.query;

    const result = await orderService.getAllOrders({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      userId,
    });

    ApiResponse.success(result).send(res);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.body;

    const order = await orderService.updateOrderStatus(req.params.id, status);

    ApiResponse.success(order, 'Order status updated').send(res);
  }),
};

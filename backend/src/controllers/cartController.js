import { cartService } from '../services/cartService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const cartController = {
  getCart: asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user.id);

    ApiResponse.success(cart).send(res);
  }),

  addItem: asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    const cart = await cartService.addToCart(req.user.id, productId, quantity);

    ApiResponse.success(cart, 'Item added to cart').send(res);
  }),

  updateItem: asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(req.user.id, productId, quantity);

    ApiResponse.success(cart, 'Cart updated').send(res);
  }),

  removeItem: asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const cart = await cartService.removeFromCart(req.user.id, productId);

    ApiResponse.success(cart, 'Item removed from cart').send(res);
  }),

  clearCart: asyncHandler(async (req, res) => {
    const cart = await cartService.clearCart(req.user.id);

    ApiResponse.success(cart, 'Cart cleared').send(res);
  }),
};

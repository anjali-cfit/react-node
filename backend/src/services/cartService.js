import { cartRepository } from '../repositories/cartRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import ApiError from '../utils/ApiError.js';

export const cartService = {
  async getCart(userId) {
    return cartRepository.getCartWithItems(userId);
  },

  async addToCart(userId, productId, quantity) {
    // Validate product exists and is active
    const product = await productRepository.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (!product.is_active) {
      throw ApiError.badRequest('Product is not available');
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      throw ApiError.badRequest(`Insufficient stock. Only ${product.stock_quantity} items available`);
    }

    return cartRepository.addItem(userId, productId, quantity);
  },

  async updateCartItem(userId, productId, quantity) {
    // Validate product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // If increasing quantity, check stock
    if (quantity > 0 && product.stock_quantity < quantity) {
      throw ApiError.badRequest(`Insufficient stock. Only ${product.stock_quantity} items available`);
    }

    return cartRepository.updateItemQuantity(userId, productId, quantity);
  },

  async removeFromCart(userId, productId) {
    return cartRepository.removeItem(userId, productId);
  },

  async clearCart(userId) {
    return cartRepository.clearCart(userId);
  },
};

import { orderRepository } from '../repositories/orderRepository.js';
import { cartRepository } from '../repositories/cartRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import ApiError from '../utils/ApiError.js';

export const orderService = {
  async createOrder(userId, shippingAddress) {
    // Get user's cart
    const cart = await cartRepository.getCartWithItems(userId);

    if (cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const product = await productRepository.findById(item.product.id);

      if (!product) {
        throw ApiError.badRequest(`Product "${item.product.name}" is no longer available`);
      }

      if (!product.is_active) {
        throw ApiError.badRequest(`Product "${item.product.name}" is not available`);
      }

      if (product.stock_quantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for "${item.product.name}". Only ${product.stock_quantity} available`
        );
      }
    }

    // Create order
    const orderData = {
      userId,
      totalAmount: cart.totalPrice,
      shippingAddress,
      items: cart.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
    };

    const order = await orderRepository.create(orderData);

    // Clear the cart after successful order
    await cartRepository.clearCart(userId);

    return order;
  },

  async getOrderById(orderId, userId = null, isAdmin = false) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Check authorization
    if (!isAdmin && userId && order.userId !== userId) {
      throw ApiError.forbidden('Not authorized to view this order');
    }

    return order;
  },

  async getUserOrders(userId, options = {}) {
    return orderRepository.findByUserId(userId, options);
  },

  async getAllOrders(options = {}) {
    return orderRepository.findAll(options);
  },

  async updateOrderStatus(orderId, status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // If cancelling, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await productRepository.updateStock(item.productId, item.quantity);
      }
    }

    return orderRepository.updateStatus(orderId, status);
  },
};

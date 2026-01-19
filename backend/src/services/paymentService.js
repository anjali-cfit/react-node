import stripe from '../config/stripe.js';
import { config } from '../config/index.js';
import { cartRepository } from '../repositories/cartRepository.js';
import { productRepository } from '../repositories/productRepository.js';
import { orderRepository } from '../repositories/orderRepository.js';
import ApiError from '../utils/ApiError.js';

// Map Stripe error types to appropriate API errors
const handleStripeError = (error) => {
  const errorMap = {
    StripeCardError: () => ApiError.badRequest(error.message),
    StripeInvalidRequestError: () => ApiError.badRequest(`Invalid request: ${error.message}`),
    StripeAPIError: () => ApiError.internal('Stripe service error. Please try again.'),
    StripeConnectionError: () => ApiError.internal('Network error. Please try again.'),
    StripeAuthenticationError: () => ApiError.internal('Payment service configuration error.'),
  };

  const handler = errorMap[error.type];
  return handler ? handler() : ApiError.internal(`Payment failed: ${error.message}`);
};

// Validate cart items have sufficient stock
const validateCartStock = async (items) => {
  for (const item of items) {
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
};

// Create Stripe line items from cart
const createLineItems = (items) =>
  items.map((item) => {
    const productData = { name: item.product.name };

    // Only add image if it's a valid absolute URL (Stripe requires https://)
    if (item.product.imageUrl?.startsWith('https://')) {
      productData.images = [item.product.imageUrl];
    }

    return {
      price_data: {
        currency: 'usd',
        product_data: productData,
        unit_amount: Math.round(Number(item.product.price) * 100),
      },
      quantity: item.quantity,
    };
  });

export const paymentService = {
  async createCheckoutSession(userId, shippingAddress) {
    try {
      const cart = await cartRepository.getCartWithItems(userId);

      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Cart is empty');
      }

      await validateCartStock(cart.items);

      const lineItems = createLineItems(cart.items);

      const order = await orderRepository.create({
        userId,
        totalAmount: cart.totalPrice,
        shippingAddress,
        status: 'pending_payment',
        items: cart.items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
      });

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${config.frontendUrl}/payment/cancel?order_id=${order.id}`,
        metadata: { orderId: order.id, userId },
      });

      return {
        sessionId: session.id,
        sessionUrl: session.url,
        orderId: order.id,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      if (error.type) throw handleStripeError(error);
      throw ApiError.internal(`Payment initialization failed: ${error.message}`);
    }
  },

  async handlePaymentSuccess(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw ApiError.badRequest('Payment not completed');
    }

    const { orderId, userId } = session.metadata;

    const order = await orderRepository.updateStatus(orderId, 'pending');
    await cartRepository.clearCart(userId);

    return order;
  },

  async handlePaymentCancel(orderId) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status === 'pending_payment') {
      for (const item of order.items) {
        await productRepository.updateStock(item.productId, item.quantity);
      }
      await orderRepository.updateStatus(orderId, 'cancelled');
    }

    return { message: 'Order cancelled' };
  },

  async getPaymentStatus(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
      paymentStatus: session.payment_status,
      orderId: session.metadata.orderId,
    };
  },
};

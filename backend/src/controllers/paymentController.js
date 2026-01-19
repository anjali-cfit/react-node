import { paymentService } from '../services/paymentService.js';

export const paymentController = {
  async createCheckoutSession(req, res, next) {
    console.log('=== Payment Controller: createCheckoutSession called ===');
    console.log('User:', req.user?.id);
    console.log('Body:', req.body);
    try {
      const { shippingAddress } = req.body;
      const result = await paymentService.createCheckoutSession(req.user.id, shippingAddress);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async handleSuccess(req, res, next) {
    try {
      const { session_id } = req.query;
      const order = await paymentService.handlePaymentSuccess(session_id);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async handleCancel(req, res, next) {
    try {
      const { order_id } = req.query;
      const result = await paymentService.handlePaymentCancel(order_id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPaymentStatus(req, res, next) {
    try {
      const { session_id } = req.query;
      const result = await paymentService.getPaymentStatus(session_id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

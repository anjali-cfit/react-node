import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = Router();

/**
 * @route POST /api/payment/create-checkout-session
 * @desc Create a Stripe checkout session
 * @access Private
 */
router.post(
  '/create-checkout-session',
  authenticate,
  validate([
    body('shippingAddress')
      .trim()
      .notEmpty()
      .withMessage('Shipping address is required')
      .isLength({ min: 10 })
      .withMessage('Please provide a complete shipping address'),
  ]),
  paymentController.createCheckoutSession
);

/**
 * @route GET /api/payment/success
 * @desc Handle successful payment
 * @access Private
 */
router.get(
  '/success',
  authenticate,
  validate([
    query('session_id')
      .notEmpty()
      .withMessage('Session ID is required'),
  ]),
  paymentController.handleSuccess
);

/**
 * @route GET /api/payment/cancel
 * @desc Handle cancelled payment
 * @access Private
 */
router.get(
  '/cancel',
  authenticate,
  validate([
    query('order_id')
      .notEmpty()
      .withMessage('Order ID is required'),
  ]),
  paymentController.handleCancel
);

/**
 * @route GET /api/payment/status
 * @desc Get payment status
 * @access Private
 */
router.get(
  '/status',
  authenticate,
  validate([
    query('session_id')
      .notEmpty()
      .withMessage('Session ID is required'),
  ]),
  paymentController.getPaymentStatus
);

export default router;

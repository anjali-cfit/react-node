import { body, param, query } from 'express-validator';

export const createOrderValidation = [
  body('shippingAddress')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required'),
];

export const getOrdersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
];

export const orderIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
];

export const updateOrderStatusValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid order ID'),
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status. Must be: pending, processing, shipped, delivered, or cancelled'),
];

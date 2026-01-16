import { body, param } from 'express-validator';

export const addToCartValidation = [
  body('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

export const updateCartItemValidation = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
];

export const removeFromCartValidation = [
  param('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
];

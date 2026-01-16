import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database
jest.unstable_mockModule('../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

// Mock uuid
jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('Cart Service', () => {
  let cartService;
  let db;

  beforeEach(async () => {
    jest.clearAllMocks();

    db = await import('../config/database.js');

    const cartModule = await import('../services/cartService.js');
    cartService = cartModule.cartService;
  });

  describe('getCart', () => {
    it('should return cart with items', async () => {
      // Mock findOrCreateCart
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'cart-1',
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      // Mock getCartWithItems
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'item-1',
          quantity: 2,
          product_id: 'product-1',
          product_name: 'Product 1',
          product_description: 'Description',
          product_price: '10.00',
          product_stock: 100,
          product_image: null,
          product_active: true,
          subtotal: '20.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      const result = await cartService.getCart('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.totalPrice).toBe(20);
      expect(result.items[0].product.name).toBe('Product 1');
    });
  });

  describe('addToCart', () => {
    it('should add item to cart successfully', async () => {
      // Mock product lookup
      const productDb = await import('../config/database.js');
      productDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'product-1',
          name: 'Product 1',
          price: '10.00',
          stock_quantity: 100,
          is_active: true,
        }],
      });

      // Mock findOrCreateCart
      productDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'cart-1',
          user_id: 'user-1',
        }],
      });

      // Mock check existing cart item
      productDb.query.mockResolvedValueOnce({ rows: [] });

      // Mock insert cart item
      productDb.query.mockResolvedValueOnce({ rowCount: 1 });

      // Mock getCartWithItems (called twice due to the flow)
      productDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'cart-1',
          user_id: 'user-1',
        }],
      });

      productDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'item-1',
          quantity: 1,
          product_id: 'product-1',
          product_name: 'Product 1',
          product_price: '10.00',
          product_stock: 100,
          product_active: true,
          subtotal: '10.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      });

      const result = await cartService.addToCart('user-1', 'product-1', 1);

      expect(result.items).toHaveLength(1);
    });

    it('should throw error for inactive product', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'product-1',
          name: 'Product 1',
          is_active: false,
        }],
      });

      await expect(
        cartService.addToCart('user-1', 'product-1', 1)
      ).rejects.toThrow('Product is not available');
    });

    it('should throw error for insufficient stock', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'product-1',
          name: 'Product 1',
          stock_quantity: 5,
          is_active: true,
        }],
      });

      await expect(
        cartService.addToCart('user-1', 'product-1', 10)
      ).rejects.toThrow('Insufficient stock');
    });
  });
});

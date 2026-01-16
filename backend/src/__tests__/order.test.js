import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the database
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.unstable_mockModule('../config/database.js', () => ({
  query: jest.fn(),
  getClient: jest.fn().mockResolvedValue(mockClient),
}));

// Mock uuid
jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('Order Service', () => {
  let orderService;
  let db;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();

    db = await import('../config/database.js');

    const orderModule = await import('../services/orderService.js');
    orderService = orderModule.orderService;
  });

  describe('createOrder', () => {
    it('should throw error if cart is empty', async () => {
      // Mock empty cart
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'cart-1', user_id: 'user-1' }],
      });
      db.query.mockResolvedValueOnce({ rows: [] }); // No items

      await expect(
        orderService.createOrder('user-1', '123 Main St')
      ).rejects.toThrow('Cart is empty');
    });
  });

  describe('getOrderById', () => {
    it('should return order with items', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-1',
        user_email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        total_amount: '100.00',
        status: 'pending',
        shipping_address: '123 Main St',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockItems = [
        {
          id: 'item-1',
          product_id: 'product-1',
          product_name: 'Product 1',
          product_price: '50.00',
          quantity: 2,
          subtotal: '100.00',
        },
      ];

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });
      db.query.mockResolvedValueOnce({ rows: mockItems });

      const result = await orderService.getOrderById('order-1');

      expect(result.id).toBe('order-1');
      expect(result.items).toHaveLength(1);
      expect(result.totalAmount).toBe(100);
    });

    it('should throw error if order not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(orderService.getOrderById('nonexistent')).rejects.toThrow(
        'Order not found'
      );
    });

    it('should throw error if user not authorized', async () => {
      const mockOrder = {
        id: 'order-1',
        user_id: 'user-1',
        user_email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        total_amount: '100.00',
        status: 'pending',
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        orderService.getOrderById('order-1', 'different-user', false)
      ).rejects.toThrow('Not authorized to view this order');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'order-1',
          status: 'pending',
          items: [],
        }],
      });
      db.query.mockResolvedValueOnce({ rows: [] }); // Items query for findById

      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'order-1',
          status: 'processing',
        }],
      });

      // Mock the findById call in updateStatus
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'order-1',
          user_id: 'user-1',
          user_email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          total_amount: '100.00',
          status: 'processing',
        }],
      });
      db.query.mockResolvedValueOnce({ rows: [] }); // Items

      const result = await orderService.updateOrderStatus('order-1', 'processing');

      expect(result.status).toBe('processing');
    });

    it('should throw error for invalid status', async () => {
      await expect(
        orderService.updateOrderStatus('order-1', 'invalid')
      ).rejects.toThrow('Invalid status');
    });
  });
});

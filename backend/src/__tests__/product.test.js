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

describe('Product Service', () => {
  let productService;
  let db;

  beforeEach(async () => {
    jest.clearAllMocks();

    db = await import('../config/database.js');

    const productModule = await import('../services/productService.js');
    productService = productModule.productService;
  });

  describe('getAllProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          description: 'Description 1',
          price: '10.00',
          stock_quantity: 100,
          category_id: 'cat-1',
          category_name: 'Category 1',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Product 2',
          description: 'Description 2',
          price: '20.00',
          stock_quantity: 50,
          category_id: 'cat-1',
          category_name: 'Category 1',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      db.query.mockResolvedValueOnce({ rows: mockProducts }); // Products query
      db.query.mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Count query

      const result = await productService.getAllProducts({ page: 1, limit: 10 });

      expect(result.products).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.products[0].name).toBe('Product 1');
    });

    it('should filter by category', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await productService.getAllProducts({ categoryId: 'cat-1' });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('category_id'),
        expect.arrayContaining(['cat-1'])
      );
    });

    it('should filter by price range', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });

      await productService.getAllProducts({ minPrice: 10, maxPrice: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('price >='),
        expect.arrayContaining([10, 50])
      );
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: '1',
        name: 'Product 1',
        description: 'Description',
        price: '10.00',
        stock_quantity: 100,
        category_id: 'cat-1',
        category_name: 'Category 1',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const result = await productService.getProductById('1');

      expect(result.id).toBe('1');
      expect(result.name).toBe('Product 1');
    });

    it('should throw error if product not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(productService.getProductById('nonexistent')).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const mockProduct = {
        id: 'mock-uuid',
        name: 'New Product',
        description: 'Description',
        price: '15.00',
        stock_quantity: 50,
        category_id: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const result = await productService.createProduct({
        name: 'New Product',
        description: 'Description',
        price: 15,
        stockQuantity: 50,
      });

      expect(result.name).toBe('New Product');
      expect(result.price).toBe(15);
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const existingProduct = {
        id: '1',
        name: 'Old Name',
        price: '10.00',
        stock_quantity: 100,
        is_active: true,
      };

      const updatedProduct = {
        ...existingProduct,
        name: 'New Name',
        price: '20.00',
      };

      db.query.mockResolvedValueOnce({ rows: [existingProduct] }); // findById
      db.query.mockResolvedValueOnce({ rows: [updatedProduct] }); // update

      const result = await productService.updateProduct('1', {
        name: 'New Name',
        price: 20,
      });

      expect(result.name).toBe('New Name');
    });

    it('should throw error if product not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        productService.updateProduct('nonexistent', { name: 'New Name' })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: '1' }] }); // findById
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // delete

      const result = await productService.deleteProduct('1');

      expect(result.message).toBe('Product deleted successfully');
    });

    it('should throw error if product not found', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(productService.deleteProduct('nonexistent')).rejects.toThrow(
        'Product not found'
      );
    });
  });
});

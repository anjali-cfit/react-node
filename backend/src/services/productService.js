import { productRepository } from '../repositories/productRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import ApiError from '../utils/ApiError.js';

export const productService = {
  async createProduct(productData) {
    const { categoryId } = productData;

    // Validate category if provided
    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw ApiError.badRequest('Invalid category ID');
      }
    }

    const product = await productRepository.create(productData);
    return this.formatProduct(product);
  },

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    return this.formatProduct(product);
  },

  async getAllProducts(options) {
    const result = await productRepository.findAll(options);

    return {
      products: result.products.map(this.formatProduct),
      pagination: result.pagination,
    };
  },

  async updateProduct(id, productData) {
    // Check if product exists
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Product not found');
    }

    // Validate category if provided
    if (productData.categoryId) {
      const category = await categoryRepository.findById(productData.categoryId);
      if (!category) {
        throw ApiError.badRequest('Invalid category ID');
      }
    }

    const product = await productRepository.update(id, productData);
    return this.formatProduct(product);
  },

  async deleteProduct(id) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Product not found');
    }

    await productRepository.delete(id);
    return { message: 'Product deleted successfully' };
  },

  formatProduct(product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stockQuantity: product.stock_quantity,
      categoryId: product.category_id,
      categoryName: product.category_name || null,
      imageUrl: product.image_url,
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  },
};

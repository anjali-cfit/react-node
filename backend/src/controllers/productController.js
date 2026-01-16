import { productService } from '../services/productService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const productController = {
  create: asyncHandler(async (req, res) => {
    const { name, description, price, stockQuantity, categoryId, imageUrl } = req.body;

    const product = await productService.createProduct({
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      imageUrl,
    });

    ApiResponse.created(product, 'Product created successfully').send(res);
  }),

  getAll: asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      categoryId,
      minPrice,
      maxPrice,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      categoryId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      sortBy,
      sortOrder,
      includeInactive: req.user?.role === 'admin',
    };

    const result = await productService.getAllProducts(options);

    ApiResponse.success(result).send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);

    ApiResponse.success(product).send(res);
  }),

  update: asyncHandler(async (req, res) => {
    const { name, description, price, stockQuantity, categoryId, imageUrl, isActive } = req.body;

    const product = await productService.updateProduct(req.params.id, {
      name,
      description,
      price,
      stockQuantity,
      categoryId,
      imageUrl,
      isActive,
    });

    ApiResponse.success(product, 'Product updated successfully').send(res);
  }),

  delete: asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);

    res.status(204).send();
  }),
};

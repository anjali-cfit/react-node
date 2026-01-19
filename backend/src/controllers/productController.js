import { productService } from '../services/productService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { deleteFile, getFilePath } from '../middleware/upload.js';

export const productController = {
  create: asyncHandler(async (req, res) => {
    const { name, description, price, stockQuantity, categoryId, isActive } = req.body;

    // Get image URL from uploaded file
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const product = await productService.createProduct({
      name,
      description,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10),
      categoryId: categoryId || null,
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
    const { name, description, price, stockQuantity, categoryId, isActive, removeImage } = req.body;

    // Get current product to check for existing image
    const existingProduct = await productService.getProductById(req.params.id);

    let imageUrl = existingProduct.imageUrl;

    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (existingProduct.imageUrl) {
        const oldFilePath = getFilePath(existingProduct.imageUrl);
        deleteFile(oldFilePath);
      }
      imageUrl = `/uploads/products/${req.file.filename}`;
    } else if (removeImage === 'true') {
      // Remove image if requested
      if (existingProduct.imageUrl) {
        const oldFilePath = getFilePath(existingProduct.imageUrl);
        deleteFile(oldFilePath);
      }
      imageUrl = null;
    }

    const product = await productService.updateProduct(req.params.id, {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : undefined,
      categoryId: categoryId || null,
      imageUrl,
      isActive: isActive === 'true' || isActive === true,
    });

    ApiResponse.success(product, 'Product updated successfully').send(res);
  }),

  delete: asyncHandler(async (req, res) => {
    // Get product to delete its image
    const product = await productService.getProductById(req.params.id);

    if (product.imageUrl) {
      const filePath = getFilePath(product.imageUrl);
      deleteFile(filePath);
    }

    await productService.deleteProduct(req.params.id);

    res.status(204).send();
  }),
};

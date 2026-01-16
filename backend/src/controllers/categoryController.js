import { categoryService } from '../services/categoryService.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const categoryController = {
  create: asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const category = await categoryService.createCategory({ name, description });

    ApiResponse.created(category, 'Category created successfully').send(res);
  }),

  getAll: asyncHandler(async (req, res) => {
    const includeInactive = req.user?.role === 'admin';

    const categories = await categoryService.getAllCategories({ includeInactive });

    ApiResponse.success(categories).send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);

    ApiResponse.success(category).send(res);
  }),

  update: asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;

    const category = await categoryService.updateCategory(req.params.id, {
      name,
      description,
      isActive,
    });

    ApiResponse.success(category, 'Category updated successfully').send(res);
  }),

  delete: asyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);

    res.status(204).send();
  }),
};

import { categoryRepository } from '../repositories/categoryRepository.js';
import ApiError from '../utils/ApiError.js';

export const categoryService = {
  async createCategory(categoryData) {
    // Check if category name already exists
    const existing = await categoryRepository.findByName(categoryData.name);
    if (existing) {
      throw ApiError.conflict('Category with this name already exists');
    }

    const category = await categoryRepository.create(categoryData);
    return this.formatCategory(category);
  },

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    return this.formatCategory(category);
  },

  async getAllCategories(options = {}) {
    const categories = await categoryRepository.findAll(options);
    return categories.map(this.formatCategory);
  },

  async updateCategory(id, categoryData) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Category not found');
    }

    // Check if new name conflicts with another category
    if (categoryData.name && categoryData.name !== existing.name) {
      const nameExists = await categoryRepository.findByName(categoryData.name);
      if (nameExists) {
        throw ApiError.conflict('Category with this name already exists');
      }
    }

    const category = await categoryRepository.update(id, categoryData);
    return this.formatCategory(category);
  },

  async deleteCategory(id) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Category not found');
    }

    await categoryRepository.delete(id);
    return { message: 'Category deleted successfully' };
  },

  formatCategory(category) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  },
};

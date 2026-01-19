import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { buildUpdateFields } from '../utils/repositoryHelpers.js';

// Field mapping for category updates
const CATEGORY_FIELD_MAP = {
  name: 'name',
  description: 'description',
  isActive: 'is_active',
};

export const categoryRepository = {
  async create(categoryData) {
    const { name, description } = categoryData;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [id, name, description]
    );

    return result.rows[0];
  },

  async findById(id) {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  },

  async findByName(name) {
    const result = await query('SELECT * FROM categories WHERE name = $1', [name]);
    return result.rows[0];
  },

  async findAll(options = {}) {
    const { includeInactive = false } = options;
    const conditions = includeInactive ? '' : 'WHERE is_active = true';

    const result = await query(`SELECT * FROM categories ${conditions} ORDER BY name ASC`);
    return result.rows;
  },

  async update(id, categoryData) {
    const { fields, values, paramIndex } = buildUpdateFields(categoryData, CATEGORY_FIELD_MAP);

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },

  async countProductsByCategory(categoryId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [categoryId]
    );
    return parseInt(result.rows[0].count, 10);
  },
};

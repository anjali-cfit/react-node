import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const categoryRepository = {
  async create(categoryData) {
    const { name, description } = categoryData;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO categories (id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, name, description]
    );

    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByName(name) {
    const result = await query(
      'SELECT * FROM categories WHERE name = $1',
      [name]
    );
    return result.rows[0];
  },

  async findAll(options = {}) {
    const { includeInactive = false } = options;

    let queryText = 'SELECT * FROM categories';
    const params = [];

    if (!includeInactive) {
      queryText += ' WHERE is_active = true';
    }

    queryText += ' ORDER BY name ASC';

    const result = await query(queryText, params);
    return result.rows;
  },

  async update(id, categoryData) {
    const { name, description, isActive } = categoryData;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  },
};

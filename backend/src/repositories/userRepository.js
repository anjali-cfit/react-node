import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const userRepository = {
  async create(userData) {
    const { email, password, firstName, lastName, role = 'customer' } = userData;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO users (id, email, password, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      [id, email, password, firstName, lastName, role]
    );

    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findAll(options = {}) {
    const { page = 1, limit = 10, role } = options;
    const offset = (page - 1) * limit;

    let queryText = 'SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at FROM users';
    const params = [];

    if (role) {
      queryText += ' WHERE role = $1';
      params.push(role);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    const countParams = [];
    if (role) {
      countQuery += ' WHERE role = $1';
      countParams.push(role);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async update(id, userData) {
    const { firstName, lastName, isActive } = userData;
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }

    if (lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
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
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      values
    );

    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  },
};

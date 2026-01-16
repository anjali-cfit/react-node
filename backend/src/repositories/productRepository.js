import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const productRepository = {
  async create(productData) {
    const { name, description, price, stockQuantity, categoryId, imageUrl } = productData;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO products (id, name, description, price, stock_quantity, category_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, name, description, price, stockQuantity, categoryId, imageUrl]
    );

    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      minPrice,
      maxPrice,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      includeInactive = false,
    } = options;

    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (!includeInactive) {
      conditions.push(`p.is_active = true`);
    }

    if (categoryId) {
      conditions.push(`p.category_id = $${paramIndex++}`);
      params.push(categoryId);
    }

    if (minPrice !== undefined) {
      conditions.push(`p.price >= $${paramIndex++}`);
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      conditions.push(`p.price <= $${paramIndex++}`);
      params.push(maxPrice);
    }

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort options
    const allowedSortFields = ['name', 'price', 'created_at', 'stock_quantity'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryText = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortField} ${order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);

    // Get total count
    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*) FROM products p
      ${whereClause}
    `;

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);

    return {
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async update(id, productData) {
    const { name, description, price, stockQuantity, categoryId, imageUrl, isActive } = productData;
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

    if (price !== undefined) {
      fields.push(`price = $${paramIndex++}`);
      values.push(price);
    }

    if (stockQuantity !== undefined) {
      fields.push(`stock_quantity = $${paramIndex++}`);
      values.push(stockQuantity);
    }

    if (categoryId !== undefined) {
      fields.push(`category_id = $${paramIndex++}`);
      values.push(categoryId);
    }

    if (imageUrl !== undefined) {
      fields.push(`image_url = $${paramIndex++}`);
      values.push(imageUrl);
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
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async updateStock(id, quantity) {
    const result = await query(
      `UPDATE products SET stock_quantity = stock_quantity + $1
       WHERE id = $2 AND stock_quantity + $1 >= 0
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount > 0;
  },
};

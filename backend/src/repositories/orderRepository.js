import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import {
  buildPagination,
  buildPaginationResponse,
  buildWhereConditions,
  transformOrder,
} from '../utils/repositoryHelpers.js';

// Private helper to fetch order items
const fetchOrderItems = async (orderId) => {
  const result = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  return result.rows;
};

export const orderRepository = {
  async create(orderData) {
    const { userId, items, totalAmount, shippingAddress, status = 'pending' } = orderData;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const orderId = uuidv4();
      await client.query(
        `INSERT INTO orders (id, user_id, total_amount, shipping_address, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, userId, totalAmount, shippingAddress, status]
      );

      for (const item of items) {
        const subtotal = item.price * item.quantity;
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [uuidv4(), orderId, item.productId, item.productName, item.price, item.quantity, subtotal]
        );

        const stockResult = await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1
           WHERE id = $2 AND stock_quantity >= $1
           RETURNING id`,
          [item.quantity, item.productId]
        );

        if (stockResult.rowCount === 0) {
          throw new Error(`Insufficient stock for product: ${item.productName}`);
        }
      }

      await client.query('COMMIT');
      return this.findById(orderId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findById(id) {
    const orderResult = await query(
      `SELECT o.*, u.email as user_email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (!orderResult.rows[0]) return null;

    const items = await fetchOrderItems(id);
    return transformOrder(orderResult.rows[0], items, { includeUser: true });
  },

  async findByUserId(userId, options = {}) {
    const { page, limit, offset } = buildPagination(options);
    const filters = { userId, ...(options.status && { status: options.status }) };

    const { conditions, params, paramIndex } = buildWhereConditions(filters, {
      userId: 'o.user_id',
      status: 'o.status',
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const ordersResult = await query(
      `SELECT o.* FROM orders o ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const items = await fetchOrderItems(order.id);
        return transformOrder(order, items);
      })
    );

    return { orders, pagination: buildPaginationResponse(total, page, limit) };
  },

  async findAll(options = {}) {
    const { page, limit, offset } = buildPagination(options);
    const filters = {
      ...(options.status && { status: options.status }),
      ...(options.userId && { userId: options.userId }),
    };

    const { conditions, params, paramIndex } = buildWhereConditions(filters, {
      status: 'o.status',
      userId: 'o.user_id',
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const ordersResult = await query(
      `SELECT o.*, u.email as user_email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const items = await fetchOrderItems(order.id);
        return transformOrder(order, items, { includeUser: true });
      })
    );

    return { orders, pagination: buildPaginationResponse(total, page, limit) };
  },

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id`,
      [status, id]
    );

    if (!result.rows[0]) return null;
    return this.findById(id);
  },
};

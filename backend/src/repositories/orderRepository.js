import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const orderRepository = {
  async create(orderData) {
    const { userId, items, totalAmount, shippingAddress } = orderData;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Create order
      const orderId = uuidv4();
      const orderResult = await client.query(
        `INSERT INTO orders (id, user_id, total_amount, shipping_address)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [orderId, userId, totalAmount, shippingAddress]
      );

      // Create order items and update stock
      for (const item of items) {
        const itemId = uuidv4();
        const subtotal = item.price * item.quantity;

        // Insert order item
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [itemId, orderId, item.productId, item.productName, item.price, item.quantity, subtotal]
        );

        // Deduct stock
        const stockResult = await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1
           WHERE id = $2 AND stock_quantity >= $1
           RETURNING *`,
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

    if (!orderResult.rows[0]) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [id]
    );

    return {
      id: order.id,
      userId: order.user_id,
      userEmail: order.user_email,
      userName: `${order.first_name} ${order.last_name}`,
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      shippingAddress: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemsResult.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productPrice: parseFloat(item.product_price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
      })),
    };
  },

  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    const params = [userId];
    let paramIndex = 2;

    let whereClause = 'WHERE o.user_id = $1';

    if (status) {
      whereClause += ` AND o.status = $${paramIndex++}`;
      params.push(status);
    }

    params.push(limit, offset);

    const ordersResult = await query(
      `SELECT o.*
       FROM orders o
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    // Get count
    const countParams = status ? [userId, status] : [userId];
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );

        return {
          id: order.id,
          totalAmount: parseFloat(order.total_amount),
          status: order.status,
          shippingAddress: order.shipping_address,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          items: itemsResult.rows.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            productPrice: parseFloat(item.product_price),
            quantity: item.quantity,
            subtotal: parseFloat(item.subtotal),
          })),
        };
      })
    );

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findAll(options = {}) {
    const { page = 1, limit = 10, status, userId } = options;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(status);
    }

    if (userId) {
      conditions.push(`o.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const ordersResult = await query(
      `SELECT o.*, u.email as user_email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    // Get count
    const countParams = params.slice(0, -2);
    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );

        return {
          id: order.id,
          userId: order.user_id,
          userEmail: order.user_email,
          userName: `${order.first_name} ${order.last_name}`,
          totalAmount: parseFloat(order.total_amount),
          status: order.status,
          shippingAddress: order.shipping_address,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          items: itemsResult.rows.map(item => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            productPrice: parseFloat(item.product_price),
            quantity: item.quantity,
            subtotal: parseFloat(item.subtotal),
          })),
        };
      })
    );

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (!result.rows[0]) {
      return null;
    }

    return this.findById(id);
  },
};

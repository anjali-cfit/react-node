import { query, getClient } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const cartRepository = {
  async findOrCreateCart(userId) {
    // Try to find existing cart
    let result = await query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }

    // Create new cart
    const id = uuidv4();
    result = await query(
      `INSERT INTO carts (id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, userId]
    );

    return result.rows[0];
  },

  async getCartWithItems(userId) {
    const cart = await this.findOrCreateCart(userId);

    const result = await query(
      `SELECT
        ci.id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
        p.stock_quantity as product_stock,
        p.image_url as product_image,
        p.is_active as product_active,
        (ci.quantity * p.price) as subtotal
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at DESC`,
      [cart.id]
    );

    const items = result.rows.map(row => ({
      id: row.id,
      quantity: row.quantity,
      subtotal: parseFloat(row.subtotal),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      product: {
        id: row.product_id,
        name: row.product_name,
        description: row.product_description,
        price: parseFloat(row.product_price),
        stockQuantity: row.product_stock,
        imageUrl: row.product_image,
        isActive: row.product_active,
      },
    }));

    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: cart.id,
      userId: cart.user_id,
      items,
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice,
      createdAt: cart.created_at,
      updatedAt: cart.updated_at,
    };
  },

  async addItem(userId, productId, quantity) {
    const cart = await this.findOrCreateCart(userId);

    // Check if item already exists in cart
    const existing = await query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cart.id, productId]
    );

    if (existing.rows[0]) {
      // Update quantity
      await query(
        `UPDATE cart_items SET quantity = quantity + $1
         WHERE cart_id = $2 AND product_id = $3`,
        [quantity, cart.id, productId]
      );
    } else {
      // Insert new item
      const id = uuidv4();
      await query(
        `INSERT INTO cart_items (id, cart_id, product_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [id, cart.id, productId, quantity]
      );
    }

    return this.getCartWithItems(userId);
  },

  async updateItemQuantity(userId, productId, quantity) {
    const cart = await this.findOrCreateCart(userId);

    if (quantity <= 0) {
      await query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart.id, productId]
      );
    } else {
      await query(
        `UPDATE cart_items SET quantity = $1
         WHERE cart_id = $2 AND product_id = $3`,
        [quantity, cart.id, productId]
      );
    }

    return this.getCartWithItems(userId);
  },

  async removeItem(userId, productId) {
    const cart = await this.findOrCreateCart(userId);

    await query(
      'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cart.id, productId]
    );

    return this.getCartWithItems(userId);
  },

  async clearCart(userId) {
    const cart = await this.findOrCreateCart(userId);

    await query(
      'DELETE FROM cart_items WHERE cart_id = $1',
      [cart.id]
    );

    return this.getCartWithItems(userId);
  },
};

import { PAGINATION } from './constants.js';

/**
 * Build pagination parameters for SQL queries
 * @param {Object} options - Pagination options
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Items per page
 * @returns {Object} - offset, limit, and pagination info
 */
export const buildPagination = (options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(options.limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build pagination response object
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination response object
 */
export const buildPaginationResponse = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

/**
 * Build dynamic UPDATE query fields and values
 * @param {Object} data - Object with field names and values
 * @param {Object} fieldMapping - Maps input field names to database column names
 * @param {number} startIndex - Starting parameter index (default: 1)
 * @returns {Object} - { fields: string[], values: any[], paramIndex: number }
 */
export const buildUpdateFields = (data, fieldMapping, startIndex = 1) => {
  const fields = [];
  const values = [];
  let paramIndex = startIndex;

  for (const [inputField, dbColumn] of Object.entries(fieldMapping)) {
    if (data[inputField] !== undefined) {
      fields.push(`${dbColumn} = $${paramIndex++}`);
      values.push(data[inputField]);
    }
  }

  return { fields, values, paramIndex };
};

/**
 * Build dynamic WHERE conditions
 * @param {Object} filters - Filter conditions
 * @param {Object} fieldMapping - Maps filter names to database columns
 * @param {number} startIndex - Starting parameter index (default: 1)
 * @returns {Object} - { conditions: string[], params: any[], paramIndex: number }
 */
export const buildWhereConditions = (filters, fieldMapping, startIndex = 1) => {
  const conditions = [];
  const params = [];
  let paramIndex = startIndex;

  for (const [filterName, dbColumn] of Object.entries(fieldMapping)) {
    if (filters[filterName] !== undefined && filters[filterName] !== null) {
      conditions.push(`${dbColumn} = $${paramIndex++}`);
      params.push(filters[filterName]);
    }
  }

  return { conditions, params, paramIndex };
};

/**
 * Transform order item from database row to API response format
 * @param {Object} item - Database row for order item
 * @returns {Object} - Transformed order item
 */
export const transformOrderItem = (item) => ({
  id: item.id,
  productId: item.product_id,
  productName: item.product_name,
  productPrice: parseFloat(item.product_price),
  quantity: item.quantity,
  subtotal: parseFloat(item.subtotal),
});

/**
 * Transform order from database row to API response format
 * @param {Object} order - Database row for order
 * @param {Array} items - Array of order items
 * @param {Object} options - Additional options
 * @returns {Object} - Transformed order
 */
export const transformOrder = (order, items = [], options = {}) => {
  const result = {
    id: order.id,
    totalAmount: parseFloat(order.total_amount),
    status: order.status,
    shippingAddress: order.shipping_address,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map(transformOrderItem),
  };

  // Include user info if available (for admin queries)
  if (options.includeUser && order.user_id) {
    result.userId = order.user_id;
    if (order.user_email) result.userEmail = order.user_email;
    if (order.first_name && order.last_name) {
      result.userName = `${order.first_name} ${order.last_name}`;
    }
  }

  return result;
};

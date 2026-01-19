import { useAuthStore } from '../store/authStore';
import { createApiClient, getImageUrl as getImageUrlBase } from '../../../shared/apiUtils';
export { PLACEHOLDER_IMAGE } from '../../../shared/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

// Create configured API client
const api = createApiClient({
  baseURL: API_URL,
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().logout(),
});

// Helper to get full image URL
export const getImageUrl = (imageUrl) => getImageUrlBase(imageUrl, BASE_URL);

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products API
export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
};

// Cart API
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`),
  clear: () => api.delete('/cart'),
};

// Orders API
export const ordersApi = {
  create: (shippingAddress) => api.post('/orders', { shippingAddress }),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
};

// Payment API
export const paymentApi = {
  createCheckoutSession: (shippingAddress) => api.post('/payment/create-checkout-session', { shippingAddress }),
  handleSuccess: (sessionId) => api.get('/payment/success', { params: { session_id: sessionId } }),
  handleCancel: (orderId) => api.get('/payment/cancel', { params: { order_id: orderId } }),
  getStatus: (sessionId) => api.get('/payment/status', { params: { session_id: sessionId } }),
};

export default api;

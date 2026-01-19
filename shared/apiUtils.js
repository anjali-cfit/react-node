import axios from 'axios';

/**
 * Create configured axios instance with auth interceptors
 * @param {Object} options - Configuration options
 * @param {Function} options.getToken - Function to get auth token
 * @param {Function} options.onUnauthorized - Callback when 401 error occurs
 * @param {string} options.baseURL - API base URL
 * @returns {Object} - Configured axios instance
 */
export const createApiClient = ({ getToken, onUnauthorized, baseURL }) => {
  const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        onUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  return api;
};

/**
 * Get full image URL from relative path
 * @param {string} imageUrl - Image URL (relative or absolute)
 * @param {string} baseUrl - Base URL for relative paths
 * @returns {string|null} - Full image URL or null
 */
export const getImageUrl = (imageUrl, baseUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${baseUrl}${imageUrl}`;
};

/**
 * Extract error message from API error response
 * @param {Error} error - Axios error object
 * @param {string} fallbackMessage - Fallback message if extraction fails
 * @returns {string} - Error message
 */
export const getErrorMessage = (error, fallbackMessage = 'An error occurred') => {
  return error?.response?.data?.message || error?.message || fallbackMessage;
};

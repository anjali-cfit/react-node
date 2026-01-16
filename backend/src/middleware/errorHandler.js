import { config } from '../config/index.js';
import ApiError from '../utils/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors.length > 0 && { errors: error.errors }),
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  };

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  res.status(error.statusCode).json(response);
};

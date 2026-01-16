import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    next(ApiError.badRequest('Validation failed', extractedErrors));
  };
};

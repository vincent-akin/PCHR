import { ApiError } from '../utils/index.js';

/**
 * Validate request against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, query, params)
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw ApiError.unprocessableEntity('Validation failed', 'VALIDATION_ERROR', errors);
    }

    // Store validated data in a custom property to avoid read-only issues
    req.validated = req.validated || {};
    req.validated[property] = value;
    
    next();
  };
};
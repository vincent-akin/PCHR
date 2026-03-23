import Joi from 'joi';

export const dashboardQuerySchema = Joi.object({
    limit: Joi.number().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    }),
    months: Joi.number().min(1).max(24).default(6).messages({
        'number.base': 'Months must be a number',
        'number.min': 'Months must be at least 1',
        'number.max': 'Months cannot exceed 24'
    }),
    page: Joi.number().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
    })
});
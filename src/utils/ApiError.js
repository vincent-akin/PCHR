import httpStatus from './httpStatus.js';

class ApiError extends Error {
    constructor(statusCode, message, code = null, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || this.getDefaultCode(statusCode);
        this.isOperational = isOperational;
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    getDefaultCode(statusCode) {
        if (httpStatus.isClientError(statusCode)) {
        return 'CLIENT_ERROR';
        }
        if (httpStatus.isServerError(statusCode)) {
        return 'SERVER_ERROR';
        }
        return 'UNKNOWN_ERROR';
    }

  // Factory methods for common errors
    static badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
        return new ApiError(httpStatus.BAD_REQUEST, message, code);
    }

    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return new ApiError(httpStatus.UNAUTHORIZED, message, code);
    }

    static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
        return new ApiError(httpStatus.FORBIDDEN, message, code);
    }

    static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
        return new ApiError(httpStatus.NOT_FOUND, message, code);
    }

    static conflict(message = 'Resource conflict', code = 'CONFLICT') {
        return new ApiError(httpStatus.CONFLICT, message, code);
    }

    static unprocessableEntity(message = 'Unprocessable entity', code = 'UNPROCESSABLE_ENTITY') {
        return new ApiError(httpStatus.UNPROCESSABLE_ENTITY, message, code);
    }

    static tooManyRequests(message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
        return new ApiError(httpStatus.TOO_MANY_REQUESTS, message, code);
    }

    static internal(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
        return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, message, code);
    }
}

export default ApiError;
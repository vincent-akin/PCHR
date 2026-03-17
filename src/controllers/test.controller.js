import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from '../utils/httpStatus.js';

// Example test controller to demonstrate usage
export const testController = {
  // GET /test/success
    success: asyncHandler(async (req, res) => {
        const data = {
            message: 'This is a successful response',
            timestamp: new Date().toISOString(),
            user: req.user || 'No user yet'
        };
        
        return ApiResponse.success(data, 'Operation completed successfully').send(res);
    }),

  // GET /test/created
    created: asyncHandler(async (req, res) => {
        const newResource = {
            id: '123',
            name: 'Test Resource',
            createdAt: new Date().toISOString()
        };
        
        return ApiResponse.created(newResource).send(res);
    }),

  // GET /test/error
    error: asyncHandler(async (req, res) => {
        throw ApiError.badRequest('This is a test error');
    }),

  // GET /test/unauthorized
    unauthorized: asyncHandler(async (req, res) => {
        throw ApiError.unauthorized();
    }),

  // GET /test/not-found
    notFound: asyncHandler(async (req, res) => {
        throw ApiError.notFound('The requested resource was not found');
    }),

  // GET /test/validation-error
    validationError: asyncHandler(async (req, res) => {
        throw ApiError.unprocessableEntity('Validation failed', 'VALIDATION_ERROR');
    }),

  // GET /test/status-codes
    statusCodes: asyncHandler(async (req, res) => {
        const statusInfo = {
            OK: httpStatus.OK,
            CREATED: httpStatus.CREATED,
            BAD_REQUEST: httpStatus.BAD_REQUEST,
            UNAUTHORIZED: httpStatus.UNAUTHORIZED,
            FORBIDDEN: httpStatus.FORBIDDEN,
            NOT_FOUND: httpStatus.NOT_FOUND,
            INTERNAL_SERVER_ERROR: httpStatus.INTERNAL_SERVER_ERROR,
            isSuccess: httpStatus.isSuccess(httpStatus.OK),
            isClientError: httpStatus.isClientError(httpStatus.BAD_REQUEST),
            isServerError: httpStatus.isServerError(httpStatus.INTERNAL_SERVER_ERROR),
            reasonPhrase: httpStatus.getReasonPhrase(httpStatus.OK)
        };
        
        return ApiResponse.success(statusInfo, 'HTTP status codes reference').send(res);
    })
};

export default testController;
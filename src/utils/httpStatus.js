import { StatusCodes, ReasonPhrases } from 'http-status-codes';

export const httpStatus = {
    // Status codes
    OK: StatusCodes.OK,
    CREATED: StatusCodes.CREATED,
    ACCEPTED: StatusCodes.ACCEPTED,
    NO_CONTENT: StatusCodes.NO_CONTENT,
    BAD_REQUEST: StatusCodes.BAD_REQUEST,
    UNAUTHORIZED: StatusCodes.UNAUTHORIZED,
    FORBIDDEN: StatusCodes.FORBIDDEN,
    NOT_FOUND: StatusCodes.NOT_FOUND,
    METHOD_NOT_ALLOWED: StatusCodes.METHOD_NOT_ALLOWED,
    CONFLICT: StatusCodes.CONFLICT,
    UNPROCESSABLE_ENTITY: StatusCodes.UNPROCESSABLE_ENTITY,
    TOO_MANY_REQUESTS: StatusCodes.TOO_MANY_REQUESTS,
    INTERNAL_SERVER_ERROR: StatusCodes.INTERNAL_SERVER_ERROR,
    SERVICE_UNAVAILABLE: StatusCodes.SERVICE_UNAVAILABLE,
    GATEWAY_TIMEOUT: StatusCodes.GATEWAY_TIMEOUT,
    
    // Reason phrases
    getReasonPhrase: (statusCode) => ReasonPhrases[statusCode],
    
    // Helper methods
    isInformational: (statusCode) => statusCode >= 100 && statusCode < 200,
    isSuccess: (statusCode) => statusCode >= 200 && statusCode < 300,
    isRedirect: (statusCode) => statusCode >= 300 && statusCode < 400,
    isClientError: (statusCode) => statusCode >= 400 && statusCode < 500,
    isServerError: (statusCode) => statusCode >= 500 && statusCode < 600,
};

export default httpStatus;
import httpStatus from './httpStatus.js';

class ApiResponse {
    constructor(success, data, message = null, statusCode = httpStatus.OK) {
        this.success = success;
        this.statusCode = statusCode;
        
        if (data !== undefined && data !== null) {
            this.data = data;
        }
        
        if (message) {
            this.message = message;
        }
    }

  // Static factory methods for common responses
    static success(data, message = null, statusCode = httpStatus.OK) {
        return new ApiResponse(true, data, message, statusCode);
    }

    static created(data, message = 'Resource created successfully') {
        return new ApiResponse(true, data, message, httpStatus.CREATED);
    }

    static noContent() {
        return new ApiResponse(true, null, null, httpStatus.NO_CONTENT);
    }

  // Send method to use in controllers
    send(res) {
        const response = {
        success: this.success,
        ...(this.data && { data: this.data }),
        ...(this.message && { message: this.message }),
        timestamp: new Date().toISOString()
        };
        
        return res.status(this.statusCode).json(response);
    }
}

export default ApiResponse;
const logger = require('../utils/logger');

/* * 
* Unified error handling middleware */
function errorHandler(err, req, res, next) {
    // Record error log
    logger.error(`${req.method} ${req.path} - ${err.message}`, {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Default error response
    let status = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code;

    // Handle specific types of errors
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        status = 409;
        message = 'Resource already exists';
    } else if (err.code === 'SQLITE_CONSTRAINT_FOREIGN_KEY') {
        status = 400;
        message = 'Invalid reference to related resource';
    } else if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
        status = 400;
        message = 'Invalid data format or value';
    } else if (err.name === 'ValidationError') {
        status = 400;
        message = err.message;
    } else if (err.name === 'NotFoundError') {
        status = 404;
        message = err.message;
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Unauthorized access';
    } else if (err.name === 'ForbiddenError') {
        status = 403;
        message = 'Forbidden access';
    }

    // Build error response
    const errorResponse = {
        error: message,
        status: status
    };

    // Include more error messages in development environments
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.code = code;
    }

    res.status(status).json(errorResponse);
}

/* * 
* 404 error handling middleware */
function notFoundHandler(req, res, next) {
    const error = new Error(`Route ${req.method} ${req.path} not found`);
    error.status = 404;
    next(error);
}

/* * 
* Asynchronous routing error catching wrapper */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/* * 
* Create custom error classes */
class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode;
        this.code = code;
        this.name = this.constructor.name;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400);
        this.name = 'ValidationError';
        this.field = field;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden access') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError
};

const config = require('../config');

/* * 
* Unified response processing tool 
* Provide standardized API response format */

/* * 
* Successful response 
* @param {Object} res - Express response object 
* @param {*} data - response data 
* @param {string} message - response message 
* @param {number} statusCode - HTTP status code */
function success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
        success: true,
        message,
        data
    };
    
    return res.status(statusCode).json(response);
}

/* * 
* Create a successful response 
* @param {Object} res - Express response object 
* @param {*} data - response data 
* @param {string} message - response message */
function created(res, data = null, message = 'Created successfully') {
    return success(res, data, message, 201);
}

/* * 
*Update successful response 
* @param {Object} res - Express response object 
* @param {*} data - response data 
* @param {string} message - response message */
function updated(res, data = null, message = 'Updated successfully') {
    return success(res, data, message, 200);
}

/* * 
*Delete successful response 
* @param {Object} res - Express response object 
* @param {string} message - response message */
function deleted(res, message = 'Deleted successfully') {
    return success(res, null, message, 200);
}

/* * 
* Pagination response 
* @param {Object} res - Express response object 
* @param {Array} data - response data 
* @param {Object} pagination - paging information 
* @param {string} message - response message */
function paginated(res, data, pagination, message = 'Success') {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            total: pagination.total || 0,
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
        }
    };
    
    return res.status(200).json(response);
}

/* * 
* Error response 
* @param {Object} res - Express response object 
* @param {string} message - error message 
* @param {number} statusCode - HTTP status code 
* @param {*} details - error details */
function error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
    const response = {
        success: false,
        message,
        error: message
    };

    if (details && config.isDevelopment()) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
}

/* * 
* Verification error response 
* @param {Object} res - Express response object 
* @param {string|Array} errors - validation error message */
function validationError(res, errors) {
    const response = {
        success: false,
        message: 'Validation failed',
        error: 'Validation failed',
        errors: Array.isArray(errors) ? errors : [errors]
    };

    return res.status(400).json(response);
}

/* * 
* No response found 
* @param {Object} res - Express response object 
* @param {string} resource - resource name */
function notFound(res, resource = 'Resource') {
    return error(res, `${resource} not found`, 404);
}

/* * 
* Unauthorized response 
* @param {Object} res - Express response object 
* @param {string} message - error message */
function unauthorized(res, message = 'Unauthorized access') {
    return error(res, message, 401);
}

/* * 
* Access forbidden response 
* @param {Object} res - Express response object 
* @param {string} message - error message */
function forbidden(res, message = 'Forbidden access') {
    return error(res, message, 403);
}

/* * 
* Request error response 
* @param {Object} res - Express response object 
* @param {string} message - error message */
function badRequest(res, message = 'Bad request') {
    return error(res, message, 400);
}

/* * 
* Conflict response 
* @param {Object} res - Express response object 
* @param {string} message - error message */
function conflict(res, message = 'Resource conflict') {
    return error(res, message, 409);
}

/* * 
* Process database operation results 
* @param {Object} res - Express response object 
* @param {Object} result - database operation result 
* @param {string} operation - operation type ('create', 'update', 'delete') 
* @param {string} resource - resource name */
function handleDbResult(res, result, operation, resource = 'Resource') {
    if (!result) {
        return notFound(res, resource);
    }
    
    switch (operation) {
        case 'create':
            return created(res, { id: result.lastInsertRowid }, `${resource} created successfully`);
        case 'update':
            if (result.changes === 0) {
                return notFound(res, resource);
            }
            return updated(res, null, `${resource} updated successfully`);
        case 'delete':
            if (result.changes === 0) {
                return notFound(res, resource);
            }
            return deleted(res, `${resource} deleted successfully`);
        default:
            return success(res, result);
    }
}

/* * 
* Process query results 
* @param {Object} res - Express response object 
* @param {*} data - query results 
* @param {string} resource - resource name */
function handleQueryResult(res, data, resource = 'Resource') {
    if (Array.isArray(data)) {
        return success(res, data, `${resource} retrieved successfully`);
    } else if (data) {
        return success(res, data, `${resource} retrieved successfully`);
    } else {
        return notFound(res, resource);
    }
}

module.exports = {
    success,
    created,
    updated,
    deleted,
    paginated,
    error,
    validationError,
    badRequest,
    notFound,
    unauthorized,
    forbidden,
    conflict,
    handleDbResult,
    handleQueryResult
};

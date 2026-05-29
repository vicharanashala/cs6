// src/middlewares/errorHandler.js
// Centralized error handling middleware

const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);

  const statusCode = err.statusCode || 500;
  
  // Map HTTP statuses to error code constants from page 8 of API_v2.pdf
  let code = 'INTERNAL_ERROR';
  if (statusCode === 400) code = 'VALIDATION_ERROR';
  else if (statusCode === 401) code = 'UNAUTHORIZED';
  else if (statusCode === 403) code = 'FORBIDDEN';
  else if (statusCode === 404) code = 'NOT_FOUND';
  else if (statusCode === 409) code = 'DUPLICATE_QUESTION';
  else if (statusCode === 429) code = 'RATE_LIMITED';

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Internal Server Error',
      ...(err.fields && { fields: err.fields })
    }
  });
};

export default errorHandler;

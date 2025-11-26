const multer = require('multer');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'File size must be less than 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }

  // Handle custom errors with status codes
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message || 'An error occurred',
    });
  }

  // Default server error
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;

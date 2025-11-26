const path = require('path');

const config = {
  PORT: process.env.PORT || 5001,
  DATA_DIR: path.join(__dirname, '../../data'),
  ATTACHMENTS_DIR: path.join(__dirname, '../../attachments'),

  // File upload configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],

  // JSON payload limit
  JSON_LIMIT: '10mb',
};

module.exports = config;

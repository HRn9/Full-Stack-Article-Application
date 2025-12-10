require('dotenv').config();
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

  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'article_app_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_DIALECT: process.env.DB_DIALECT || 'postgres',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};

module.exports = config;

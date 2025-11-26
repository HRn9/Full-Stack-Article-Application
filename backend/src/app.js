const express = require('express');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const apiRouter = require('./routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: config.JSON_LIMIT }));

  app.use('/attachments', express.static(config.ATTACHMENTS_DIR));

  app.use('/api', apiRouter);

  app.use(errorHandler);

  return app;
}

module.exports = createApp;

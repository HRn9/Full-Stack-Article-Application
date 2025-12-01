const http = require('http');
const config = require('./config');
const createApp = require('./app');
const websocketManager = require('./websocket');
const { initializeDirectories } = require('./utils/fileUtils');
const { initializeDatabase, closeDatabase } = require('./utils/dbInit');

async function startServer() {
  try {
    await initializeDirectories();
    await initializeDatabase();

    const app = createApp();

    const server = http.createServer(app);

    websocketManager.initialize(server);

    server.listen(config.PORT, () => {
      console.log(`Server running on http://localhost:${config.PORT}`);
      console.log(`API available at http://localhost:${config.PORT}/api`);
      console.log(`WebSocket server running on ws://localhost:${config.PORT}`);
    });

    const shutdownServer = async () => {
      console.log('Shutting down...');
      server.close(async () => {
        try {
          await closeDatabase();
          console.log('Server closed');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdownServer);
    process.on('SIGINT', shutdownServer);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

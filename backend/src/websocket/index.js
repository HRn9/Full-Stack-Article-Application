const WebSocket = require('ws');

class WebSocketManager {
  constructor() {
    this.clients = new Set();
    this.wss = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket server initialized');
  }

  broadcastNotification(notification) {
    const message = JSON.stringify(notification);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = new WebSocketManager();

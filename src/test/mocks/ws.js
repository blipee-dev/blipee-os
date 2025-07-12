// ESM Mock for ws (WebSocket library)
import { MockWebSocket as WebSocket } from './isows-esm.js';

class MockWebSocketServer {
  constructor(options) {
    this.options = options;
    this.clients = new Set();
    this.on = jest.fn();
    this.emit = jest.fn();
    this.close = jest.fn((callback) => {
      if (callback) callback();
    });
  }
  
  handleUpgrade(request, socket, head, callback) {
    const ws = new WebSocket('ws://mock');
    this.clients.add(ws);
    if (callback) callback(ws);
  }
}

export { WebSocket, MockWebSocketServer as WebSocketServer };
export default { WebSocket, WebSocketServer: MockWebSocketServer };
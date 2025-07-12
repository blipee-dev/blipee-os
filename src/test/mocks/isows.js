// Mock for isows
module.exports = {
  WebSocket: class MockWebSocket {
    constructor() {
      this.readyState = 1;
    }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
};
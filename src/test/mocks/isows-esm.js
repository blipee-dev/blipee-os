// ESM Mock for isows (WebSocket polyfill)
class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = MockWebSocket.CONNECTING;
    this.bufferedAmount = 0;
    this.extensions = '';
    this.protocol = '';
    this.binaryType = 'blob';
    
    // Event handlers
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
  
  send(data) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate echo for testing
    if (this.onmessage) {
      setTimeout(() => {
        this.onmessage({ data, type: 'message' });
      }, 0);
    }
  }
  
  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose({ code, reason, type: 'close' });
      }
    }, 0);
  }
  
  addEventListener(event, handler) {
    this[`on${event}`] = handler;
  }
  
  removeEventListener(event, handler) {
    if (this[`on${event}`] === handler) {
      this[`on${event}`] = null;
    }
  }
}

// WebSocket states
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

export { MockWebSocket as WebSocket };
export default MockWebSocket;
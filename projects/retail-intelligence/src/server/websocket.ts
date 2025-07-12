import { createServer } from 'http';
import next from 'next';
import { initializeWebSocket } from '@/lib/websocket/server';
import { logger } from '@/lib/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3001', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Initialize WebSocket server
  const wsServer = initializeWebSocket(httpServer);

  httpServer.listen(port, () => {
    logger.info(`Server ready on http://${hostname}:${port}`);
    logger.info('WebSocket server ready on /ws');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });
  });
});

// Export for use in other parts of the application
export { app };
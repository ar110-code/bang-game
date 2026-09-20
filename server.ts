import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { setupSocketHandlers } from './src/lib/socket/handler';

const hasBuild = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));
const dev = process.env.NODE_ENV === 'development' || !hasBuild;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3005', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const pathname = parsedUrl.pathname || '';

      // High-performance caching: Cache all static cards, characters, roles and next assets forever
      if (
        pathname.startsWith('/assets/') ||
        pathname.startsWith('/_next/static/') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.webp')
      ) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Enable HTTP Keep-Alive for low-latency TCP reuse
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;

  // Ultra low-latency Socket.io configuration
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    perMessageDeflate: {
      threshold: 1024, // Only compress payloads larger than 1KB
    },
    pingTimeout: 30000,
    pingInterval: 15000,
    allowUpgrades: true,
  });

  setupSocketHandlers(io);

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> 🤠 Bang! Western Game Server running with turbo speed on http://0.0.0.0:${port}`);
  });
});

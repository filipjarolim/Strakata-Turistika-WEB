const { createServer } = require('http');
const { join } = require('path');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Handle service worker
      if (pathname === '/service-worker.js' || pathname === '/sw.js') {
        const filePath = join(__dirname, '.next', pathname === '/service-worker.js' ? 'service-worker.js' : 'sw.js');
        app.serveStatic(req, res, filePath);
      } else {
        handle(req, res, parsedUrl);
      }
    })
    .listen(3000, () => {
      console.log(`> Ready on http://localhost:3000`);
    });
  })
  .catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
  }); 
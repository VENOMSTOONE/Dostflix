import verifyHandler from '../auth/verify.js';
import sessionHandler from '../auth/session.js';
import logoutHandler from '../auth/logout.js';
import mediaHandler from '../media.js';

/**
 * Connect/Vite middleware for local development.
 * Maps /api/auth/* and /api/media and intercepts /WhatsApp* and /Polaroids/*
 * exactly like Vercel's production serverless routing.
 */
export function devAuthMiddleware() {
  return async (req, res, next) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(urlObj.pathname);

      // Helper to attach status and json to Node response if missing
      if (!res.status) {
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
      }
      if (!res.json) {
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };
      }

      req.query = Object.fromEntries(urlObj.searchParams.entries());

      // Helper to parse JSON body for POST requests
      if (req.method === 'POST' && !req.body) {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          req.body = JSON.parse(raw);
        } catch {
          req.body = {};
        }
      }

      // Route: /api/auth/verify
      if (pathname === '/api/auth/verify') {
        return await verifyHandler(req, res);
      }

      // Route: /api/auth/session
      if (pathname === '/api/auth/session') {
        return await sessionHandler(req, res);
      }

      // Route: /api/auth/logout
      if (pathname === '/api/auth/logout') {
        return await logoutHandler(req, res);
      }

      // Route: /api/media
      if (pathname === '/api/media') {
        return await mediaHandler(req, res);
      }

      // Intercept direct media paths: /WhatsApp* or /Polaroids/*
      if (pathname.startsWith('/WhatsApp') || pathname.startsWith('/Polaroids/')) {
        const relativePath = pathname.slice(1); // remove leading slash
        req.query.file = relativePath;
        return await mediaHandler(req, res);
      }

      return next();
    } catch (err) {
      console.error('Dev Auth Middleware Error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    }
  };
}

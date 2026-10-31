import fs from 'fs';
import path from 'path';
import { parseCookies, verifySessionToken, COOKIE_NAME } from './_lib/authCore.js';

const MIME_TYPES = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm'
};

export default async function handler(req, res) {
  // 1. Session verification
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  const isAuthenticated = verifySessionToken(token);

  if (!isAuthenticated) {
    return res.status(401).json({ 
      error: 'Authentication required to access protected media files.' 
    });
  }

  // 2. Resolve requested filename from query
  let requestedFile = req.query.file || req.query.name;
  if (!requestedFile && req.url) {
    const urlObj = new URL(req.url, 'http://localhost');
    requestedFile = urlObj.searchParams.get('file') || urlObj.searchParams.get('name');
  }

  if (!requestedFile || typeof requestedFile !== 'string') {
    return res.status(400).json({ error: 'Missing media file parameter' });
  }

  // Normalize and clean path to prevent directory traversal attacks
  const normalized = path.normalize(requestedFile).replace(/^(\.\.(\/|\\|$))+/, '');
  
  // Resolve against private_media or public root
  const privateDir = path.resolve(process.cwd(), 'private_media');
  const publicDir = path.resolve(process.cwd(), 'public');

  let targetPath = path.resolve(privateDir, normalized);
  if (!targetPath.startsWith(privateDir) || !fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.resolve(publicDir, normalized);
  }

  // Security check: target must be inside private_media or public
  if (!targetPath.startsWith(privateDir) && !targetPath.startsWith(publicDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    return res.status(404).json({ error: 'Media file not found' });
  }

  const stat = fs.statSync(targetPath);
  const fileSize = stat.size;
  const ext = path.extname(targetPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 3. Range request handling for video streaming and seeking
  const range = req.headers.range;
  if (range && contentType.startsWith('video/')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
      return res.end();
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(targetPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600'
    });
    return fileStream.pipe(res);
  }

  // 4. Standard stream for images / non-range requests
  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600'
  });
  return fs.createReadStream(targetPath).pipe(res);
}

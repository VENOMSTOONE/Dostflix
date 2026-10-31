import { 
  getAccessPassword, 
  constantTimeCompare, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetRateLimit, 
  createSessionToken, 
  makeSessionCookie 
} from '../_lib/authCore.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Identify client for rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({ error: rate.error });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const submittedPassword = typeof body?.password === 'string' ? body.password : '';
  const expectedPassword = getAccessPassword();

  const isValid = constantTimeCompare(submittedPassword, expectedPassword);

  if (!isValid) {
    recordFailedAttempt(ip);
    return res.status(401).json({ 
      error: "That passphrase didn't work. Give it another try." 
    });
  }

  // Password is correct
  resetRateLimit(ip);
  const token = createSessionToken();
  const isProduction = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', makeSessionCookie(token, isProduction));
  
  return res.status(200).json({ 
    success: true, 
    message: 'Welcome to our little world.' 
  });
}

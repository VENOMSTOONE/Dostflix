import { parseCookies, verifySessionToken, COOKIE_NAME } from '../_lib/authCore.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  const isValid = verifySessionToken(token);

  return res.status(200).json({ authenticated: isValid });
}

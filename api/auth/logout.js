import { makeLogoutCookie } from '../_lib/authCore.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const isProduction = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', makeLogoutCookie(isProduction));
  return res.status(200).json({ success: true });
}

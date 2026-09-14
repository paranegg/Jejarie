const { createSession, isAuthenticated, secureEqual } = require('../lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ authenticated: isAuthenticated(req) });
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: '관리자 설정이 아직 완료되지 않았습니다.' });
  }
  if (!secureEqual(req.body && req.body.password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: '비밀번호가 맞지 않습니다.' });
  }
  res.setHeader('Set-Cookie', `jejarie_session=${createSession()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`);
  return res.status(200).json({ ok: true });
};

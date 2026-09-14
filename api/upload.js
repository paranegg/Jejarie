const crypto = require('crypto');
const { isAuthenticated } = require('../lib/auth');
const { github } = require('../lib/github');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: '로그인이 필요합니다.' });

  try {
    const { content, mimeType } = req.body || {};
    if (!/^image\/(jpeg|png|webp)$/.test(mimeType || '') || typeof content !== 'string') {
      return res.status(400).json({ error: '지원하지 않는 이미지입니다.' });
    }
    const bytes = Buffer.from(content, 'base64');
    if (!bytes.length || bytes.length > 1500 * 1024) {
      return res.status(400).json({ error: '사진 한 장은 1.5MB 이하여야 합니다.' });
    }
    const blob = await github('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content, encoding: 'base64' })
    });
    const date = new Date().toISOString().slice(0, 10);
    const path = `uploads/${date}/${crypto.randomUUID()}.jpg`;
    return res.status(200).json({ sha: blob.sha, path });
  } catch (error) {
    return res.status(500).json({ error: error.message || '사진 업로드에 실패했습니다.' });
  }
};

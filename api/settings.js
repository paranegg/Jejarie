const { isAuthenticated } = require('../lib/auth');
const { repositoryState, commitJson } = require('../lib/content');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthenticated(req)) return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    const state = await repositoryState('site-settings.json', { ledgerUrl: '' });
    if (req.method === 'GET') return res.status(200).json(state.value);
    if (req.method !== 'PUT') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    const ledgerUrl = String((req.body || {}).ledgerUrl || '').trim().slice(0, 1000);
    if (ledgerUrl && !/^https:\/\/script\.google\.com\//.test(ledgerUrl)) return res.status(400).json({ error: 'Google Apps Script 웹앱 주소를 입력해 주세요.' });
    const value = { ledgerUrl, updatedAt: new Date().toISOString() };
    await commitJson({ path: 'site-settings.json', value, message: '사이트 설정 수정' });
    return res.status(200).json(value);
  } catch (error) {
    return res.status(400).json({ error: error.message || '설정을 저장하지 못했습니다.' });
  }
};

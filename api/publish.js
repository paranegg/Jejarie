const crypto = require('crypto');
const { isAuthenticated } = require('../lib/auth');
const { github, branch } = require('../lib/github');

const categories = ['목공사', '누수 복원', '인조대리석 문지방', '기타 집수리'];

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
  if (!isAuthenticated(req)) return res.status(401).json({ error: '로그인이 필요합니다.' });

  try {
    const body = req.body || {};
    const title = String(body.title || '').trim().slice(0, 100);
    const region = String(body.region || '').trim().slice(0, 60);
    const description = String(body.description || '').trim().slice(0, 2000);
    const images = Array.isArray(body.images) ? body.images : [];
    if (!categories.includes(body.category) || !title || !region || !description || !images.length || images.length > 12) {
      return res.status(400).json({ error: '입력 내용을 다시 확인해 주세요.' });
    }
    for (const image of images) {
      if (!/^[a-f0-9]{40}$/.test(image.sha || '') || !/^uploads\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.jpg$/.test(image.path || '')) {
        return res.status(400).json({ error: '사진 정보가 올바르지 않습니다.' });
      }
    }

    const ref = await github(`/git/ref/heads/${encodeURIComponent(branch)}`);
    const parent = await github(`/git/commits/${ref.object.sha}`);
    const currentFile = await github(`/contents/cases.json?ref=${encodeURIComponent(branch)}`);
    const currentCases = JSON.parse(Buffer.from(currentFile.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    const item = {
      id: crypto.randomUUID(),
      category: body.category,
      title,
      region,
      description,
      images: images.map(image => '/' + image.path),
      publishedAt: new Date().toISOString()
    };
    const nextCases = [item, ...(Array.isArray(currentCases) ? currentCases : [])];
    const casesBlob = await github('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: Buffer.from(JSON.stringify(nextCases, null, 2) + '\n').toString('base64'), encoding: 'base64' })
    });
    const tree = await github('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: parent.tree.sha,
        tree: [
          { path: 'cases.json', mode: '100644', type: 'blob', sha: casesBlob.sha },
          ...images.map(image => ({ path: image.path, mode: '100644', type: 'blob', sha: image.sha }))
        ]
      })
    });
    const commit = await github('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: `시공사례 추가: ${title}`, tree: tree.sha, parents: [ref.object.sha] })
    });
    await github(`/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha, force: false })
    });
    return res.status(200).json({ ok: true, item });
  } catch (error) {
    return res.status(500).json({ error: error.message || '게시하지 못했습니다.' });
  }
};

const crypto = require('crypto');
const { isAuthenticated } = require('../lib/auth');
const { repositoryState, commitJson } = require('../lib/content');

const defaultCategories = require('../categories.json');
const clean = (value, max = 5000) => String(value || '').trim().slice(0, max);
const cleanList = (value, limit, max) => (Array.isArray(value) ? value : []).slice(0, limit).map(item => clean(item, max)).filter(Boolean);
const cleanImage = (value, imagePaths) => imagePaths.includes(value) ? value : '';

function normalize(body, previous = {}, categories = defaultCategories) {
  const images = Array.isArray(body.images) ? body.images.slice(0, 20) : [];
  const imagePaths = images.map(image => typeof image === 'string' ? image : '/' + image.path);
  const uploads = images.filter(image => image && typeof image === 'object');
  for (const image of uploads) {
    if (!/^[a-f0-9]{40}$/.test(image.sha || '') || !/^uploads\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+\.jpg$/.test(image.path || '')) throw new Error('사진 정보가 올바르지 않습니다.');
  }
  const findings = cleanList(body.findings, 20, 300);
  const processSteps = (Array.isArray(body.processSteps) ? body.processSteps : []).slice(0, 20).map(step => ({
    title: clean(step && step.title, 120),
    description: clean(step && step.description, 2000),
    images: (Array.isArray(step && step.images) ? step.images : []).filter(path => imagePaths.includes(path)).slice(0, 8)
  })).filter(step => step.title || step.description || step.images.length);
  const followUp = {
    period: clean(body.followUp && body.followUp.period, 80),
    content: clean(body.followUp && body.followUp.content, 3000),
    image: cleanImage(body.followUp && body.followUp.image, imagePaths)
  };
  const item = {
    id: previous.id || crypto.randomUUID(),
    siteId: clean(body.siteId, 100),
    category: clean(body.category, 40),
    title: clean(body.title, 100),
    region: clean(body.region, 60),
    workDate: clean(body.workDate, 10),
    year: clean(body.workDate, 10).slice(0, 4) || clean(body.year, 4),
    description: clean(body.description, 500),
    details: clean(body.details, 10000),
    story: clean(body.story, 10000),
    findings,
    processSteps,
    beforeImage: cleanImage(body.beforeImage, imagePaths),
    afterImage: cleanImage(body.afterImage, imagePaths),
    result: clean(body.result, 5000),
    followUp,
    review: clean(body.review, 3000),
    reviewVisible: Boolean(body.reviewVisible && clean(body.review, 3000)),
    featured: Boolean(body.featured),
    hero: Boolean(body.hero),
    status: body.status === 'draft' ? 'draft' : 'published',
    images: imagePaths,
    coverImage: imagePaths.includes(body.coverImage) ? body.coverImage : imagePaths[Number(body.coverIndex) || 0] || imagePaths[0] || '',
    publishedAt: previous.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!categories.includes(item.category) || !item.title || !item.region || !item.description || !item.images.length) throw new Error('필수 입력 내용을 다시 확인해 주세요.');
  if (item.status === 'draft') item.hero = false;
  return { item, uploads };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthenticated(req)) return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    const [state, categoryState] = await Promise.all([
      repositoryState('cases.json', []), repositoryState('categories.json', defaultCategories)
    ]);
    const projects = Array.isArray(state.value) ? state.value : [];
    const categories = Array.isArray(categoryState.value) ? categoryState.value : defaultCategories;
    if (req.method === 'GET') return res.status(200).json({ projects });
    if (req.method === 'DELETE') {
      const id = clean((req.body || {}).id, 100);
      const next = projects.filter(item => item.id !== id);
      if (next.length === projects.length) return res.status(404).json({ error: '시공사례를 찾지 못했습니다.' });
      await commitJson({ path: 'cases.json', value: next, message: '시공사례 삭제' });
      return res.status(200).json({ ok: true });
    }
    if (!['POST', 'PUT'].includes(req.method)) return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    const body = req.body || {};
    const index = req.method === 'PUT' ? projects.findIndex(item => item.id === body.id) : -1;
    if (req.method === 'PUT' && index < 0) return res.status(404).json({ error: '시공사례를 찾지 못했습니다.' });
    const { item, uploads } = normalize(body, index >= 0 ? projects[index] : {}, categories);
    let next = [...projects];
    if (index >= 0) next[index] = item; else next.unshift(item);
    if (item.hero) next = next.map(project => project.id === item.id ? project : { ...project, hero: false });
    await commitJson({
      path: 'cases.json', value: next, message: `${index >= 0 ? '시공사례 수정' : '시공사례 추가'}: ${item.title}`,
      extraTree: uploads.map(image => ({ path: image.path, mode: '100644', type: 'blob', sha: image.sha }))
    });
    return res.status(200).json({ ok: true, item });
  } catch (error) {
    if (/GitHub 요청 실패 \(409\)/.test(error.message)) return res.status(409).json({ error: '다른 저장 작업과 겹쳤습니다. 다시 시도해 주세요.' });
    return res.status(400).json({ error: error.message || '저장하지 못했습니다.' });
  }
};

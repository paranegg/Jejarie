const { isAuthenticated } = require('../lib/auth');
const { repositoryState, commitJsonFiles } = require('../lib/content');
const defaults = require('../categories.json');
const protectedCategories = ['인조대리석 문지방'];

const clean = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 40);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthenticated(req)) return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    const [categoryState, projectState] = await Promise.all([
      repositoryState('categories.json', defaults), repositoryState('cases.json', [])
    ]);
    const current = Array.isArray(categoryState.value) ? categoryState.value : defaults;
    const projects = Array.isArray(projectState.value) ? projectState.value : [];
    if (req.method === 'GET') return res.status(200).json({ categories: current });
    if (req.method !== 'PUT') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
    const rows = Array.isArray(req.body && req.body.categories) ? req.body.categories : [];
    const normalized = rows.map(row => ({ original: clean(row.original), name: clean(row.name) })).filter(row => row.name);
    const names = normalized.map(row => row.name);
    if (!names.length || names.length > 30 || new Set(names).size !== names.length) return res.status(400).json({ error: '카테고리 이름을 확인해 주세요. 중복 이름은 사용할 수 없습니다.' });
    const changedProtected = protectedCategories.find(name => !normalized.some(row => row.original === name && row.name === name));
    if (changedProtected) return res.status(400).json({ error: `'${changedProtected}' 카테고리는 전문페이지 연동을 위해 이름을 변경하거나 삭제할 수 없습니다.` });
    const removed = current.filter(name => !normalized.some(row => row.original === name));
    const usedRemoved = removed.find(name => projects.some(project => project.category === name));
    if (usedRemoved) return res.status(400).json({ error: `'${usedRemoved}' 카테고리를 사용하는 시공사례가 있어 삭제할 수 없습니다.` });
    const renameMap = Object.fromEntries(normalized.filter(row => row.original && row.original !== row.name).map(row => [row.original, row.name]));
    const nextProjects = projects.map(project => renameMap[project.category] ? { ...project, category: renameMap[project.category], updatedAt: new Date().toISOString() } : project);
    await commitJsonFiles({ files: { 'categories.json': names, 'cases.json': nextProjects }, message: '카테고리 설정 수정' });
    return res.status(200).json({ categories: names });
  } catch (error) {
    return res.status(400).json({ error: error.message || '카테고리를 저장하지 못했습니다.' });
  }
};

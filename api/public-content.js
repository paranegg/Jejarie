const defaults = require('../categories.json');
const { repositoryState } = require('../lib/content');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: '허용되지 않은 요청입니다.' });
  try {
    const [projectState, categoryState] = await Promise.all([
      repositoryState('cases.json', []),
      repositoryState('categories.json', defaults)
    ]);
    const projects = (Array.isArray(projectState.value) ? projectState.value : [])
      .filter(project => project.status !== 'draft')
      .map(project => project.reviewVisible ? project : { ...project, review: '' });
    const categories = Array.isArray(categoryState.value) ? categoryState.value : defaults;
    return res.status(200).json({ projects, categories });
  } catch (error) {
    return res.status(500).json({ error: '시공사례를 불러오지 못했습니다.' });
  }
};

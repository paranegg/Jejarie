const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'cases.json'), 'utf8'));
const published = projects.filter(project => project.status === 'published' || !project.status);
const projectUrl = project => `/work/${project.slug || `project-${String(project.id).slice(0, 8)}`}/`;
const block = (html, name) => {
  const match = html.match(new RegExp(`<!-- BUILD:${name}:START -->([\\s\\S]*?)<!-- BUILD:${name}:END -->`));
  assert(match, `Missing generated block: ${name}`);
  return match[1];
};

for (const project of published) {
  const slug = project.slug || `project-${String(project.id).slice(0, 8)}`;
  const file = path.join(root, 'work', slug, 'index.html');
  assert(fs.existsSync(file), `Missing generated page: ${slug}`);
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes(`<h1>${project.title}</h1>`), `Missing H1: ${slug}`);
  assert(html.includes(`<link rel="canonical" href="https://www.jejarie.com/work/${slug}/">`), `Wrong canonical: ${slug}`);
  assert(html.includes('<meta name="description"'), `Missing description: ${slug}`);
  assert(html.includes('<meta property="og:title"'), `Missing og:title: ${slug}`);
  assert(html.includes('<script type="application/ld+json">'), `Missing structured data: ${slug}`);
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const project of published) {
  const slug = project.slug || `project-${String(project.id).slice(0, 8)}`;
  assert(sitemap.includes(`https://www.jejarie.com/work/${slug}/`), `Missing sitemap URL: ${slug}`);
}
for (const project of projects.filter(project => project.status === 'draft')) {
  const slug = project.slug || `project-${String(project.id).slice(0, 8)}`;
  assert(!sitemap.includes(`/work/${slug}/`), `Draft in sitemap: ${slug}`);
}

const target = fs.readFileSync(path.join(root, 'work', 'bathroom-threshold-water-damage', 'index.html'), 'utf8');
for (const content of ['현장 이야기.', '확인한 부분.', '작업 과정.', '작업 결과.']) assert(target.includes(content), `Target content missing: ${content}`);
assert(target.includes('욕실 물넘침으로 손상된 마루 | 인조대리석 문지방 시공 | 제자리에'));
assert(target.includes('alt="욕실 물넘침으로 마루까지 손상된 현장 시공 전"'));

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const work = fs.readFileSync(path.join(root, 'work/index.html'), 'utf8');
const threshold = fs.readFileSync(path.join(root, 'artificial-marble-threshold/index.html'), 'utf8');
const homeHero = block(home, 'HOME_HERO');
const homeProjects = block(home, 'HOME_PROJECTS');
const workProjects = block(work, 'WORK_PROJECTS');
const thresholdProjects = block(threshold, 'THRESHOLD_PROJECTS');
const hero = published.find(project => project.hero);
const featured = published.filter(project => project.featured)
  .sort((a,b) => String(b.publishedAt || b.workDate || '').localeCompare(String(a.publishedAt || a.workDate || ''))).slice(0, 4);
const thresholdCases = published.filter(project => project.category === '인조대리석 문지방');

assert(hero, 'Published HOME hero is missing');
assert(homeHero.includes(hero.title) && homeHero.includes(projectUrl(hero)), 'HOME hero was not generated from cases.json');
assert((homeProjects.match(/<article class="project reveal">/g) || []).length === featured.length, 'Wrong HOME project count');
for (const project of featured) assert(homeProjects.includes(projectUrl(project)), `Missing HOME link: ${project.slug}`);
assert((workProjects.match(/<a class="card"/g) || []).length === published.length, 'Wrong WORK project count');
for (const project of published) assert(workProjects.includes(projectUrl(project)), `Missing WORK link: ${project.slug}`);
assert((thresholdProjects.match(/<a class="card"/g) || []).length === thresholdCases.length, 'Wrong threshold project count');
for (const project of thresholdCases) assert(thresholdProjects.includes(projectUrl(project)), `Missing threshold link: ${project.slug}`);
for (const project of projects.filter(project => project.status === 'draft')) {
  assert(!homeProjects.includes(projectUrl(project)), `Draft in HOME: ${project.slug}`);
  assert(!workProjects.includes(projectUrl(project)), `Draft in WORK: ${project.slug}`);
  assert(!thresholdProjects.includes(projectUrl(project)), `Draft in threshold page: ${project.slug}`);
}
assert(home.includes('<link rel="canonical" href="https://www.jejarie.com/">'), 'Missing HOME canonical');
assert(work.includes('<link rel="canonical" href="https://www.jejarie.com/work/">'), 'Missing WORK canonical');
assert(home.includes("p=document.getElementById('projects');p.innerHTML="), 'HOME enhancement must replace static cards');
assert(work.includes('document.getElementById(\'grid\').innerHTML='), 'WORK enhancement must replace static cards');
assert(threshold.includes('document.getElementById(\'thresholdCases\').innerHTML='), 'Threshold enhancement must replace static cards');
const buildSource = fs.readFileSync(path.join(root, 'scripts/build-work-pages.js'), 'utf8');
assert(buildSource.includes("project.status === 'published'"), 'Build must explicitly exclude drafts');

console.log(`Validated ${published.length} WORK pages, ${featured.length} HOME cards, and ${thresholdCases.length} threshold cards`);

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'cases.json'), 'utf8'));
const published = projects.filter(project => project.status !== 'draft');

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

console.log(`Validated ${published.length} generated WORK pages`);

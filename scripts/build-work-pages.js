const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://www.jejarie.com';
const projects = JSON.parse(fs.readFileSync(path.join(root, 'cases.json'), 'utf8'));
const categories = JSON.parse(fs.readFileSync(path.join(root, 'categories.json'), 'utf8'));
const published = projects.filter(project => project.status === 'published' || !project.status);
const detailSource = fs.readFileSync(path.join(root, 'work/detail/index.html'), 'utf8');
const css = (detailSource.match(/<style>([\s\S]*?)<\/style>/) || [,''])[1];

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const escapeJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const trimDescription = value => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > 155 ? text.slice(0, 152).replace(/\s+\S*$/, '') + '…' : text;
};
const projectUrl = project => `/work/${project.slug || `project-${String(project.id).slice(0, 8)}`}/`;
const absolute = value => value ? new URL(value, siteUrl).href : '';
const projectDate = project => project.workDate || project.year || '';
const sortHome = (a,b) => String(b.publishedAt || b.workDate || '').localeCompare(String(a.publishedAt || a.workDate || ''));
const sortWork = (a,b) => String(b.workDate || b.publishedAt || '').localeCompare(String(a.workDate || a.publishedAt || ''));
const replaceBlock = (html, name, content) => {
  const start = `<!-- BUILD:${name}:START -->`;
  const end = `<!-- BUILD:${name}:END -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(html)) throw new Error(`Missing build markers: ${name}`);
  return html.replace(pattern, `${start}${content}${end}`);
};

const renderHomeCard = (project, index) => {
  const images = [project.coverImage || project.images?.[0]].filter(Boolean);
  return `<article class="project reveal"><div class="project-media"><div class="swiper"><div class="swiper-wrapper">${images.map((src,imageIndex) => `<div class="swiper-slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} 사진 ${imageIndex + 1}" loading="lazy"></div>`).join('')}</div>${images.length > 1 ? '<div class="swiper-pagination"></div><div class="swiper-button-prev"></div><div class="swiper-button-next"></div>' : ''}</div></div><div class="project-info"><div><div class="eyebrow">${escapeHtml(project.category)} / ${String(index + 1).padStart(2,'0')}</div><h3><a href="${projectUrl(project)}">${escapeHtml(project.title)}</a></h3></div><div class="project-copy"><div class="meta">${escapeHtml(project.region)}<br>${escapeHtml(projectDate(project))}<br>${images.length} PHOTOS</div><p class="desc">${escapeHtml(project.description)}</p></div></div></article>`;
};
const renderWorkCard = project => `<a class="card" href="${projectUrl(project)}"><div class="media"><img src="${escapeHtml(project.coverImage || project.images?.[0] || '')}" alt="${escapeHtml(project.title)} 완료 모습" loading="lazy"></div><div class="meta"><span>${escapeHtml(project.category)}</span><span>${escapeHtml(projectDate(project))}</span></div><h2>${escapeHtml(project.title)}</h2><p>${escapeHtml(project.description)}</p></a>`;
const renderThresholdCard = project => `<a class="card" href="${projectUrl(project)}"><div class="card-media"><img src="${escapeHtml(project.coverImage || project.images?.[0] || '')}" alt="${escapeHtml(project.title)} 인조대리석 문지방 시공" loading="lazy"></div><div class="card-meta"><span>${escapeHtml(project.region)}</span><span>${escapeHtml(projectDate(project))}</span></div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p></a>`;

function renderListingPages() {
  const featured = published.filter(project => project.featured).sort(sortHome).slice(0, 4);
  const hero = published.find(project => project.hero);
  const workProjects = [...published].sort(sortWork);
  const thresholdProjects = workProjects.filter(project => project.category === '인조대리석 문지방');

  let home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (hero) {
    const cover = hero.coverImage || hero.images?.[0] || '';
    const year = hero.year || String(hero.workDate || hero.publishedAt || '').slice(0, 4);
    home = replaceBlock(home, 'HOME_HERO', `<a class="shell hero-photo" id="heroProject" href="${projectUrl(hero)}"><img id="heroImage" src="${escapeHtml(cover)}" alt="${escapeHtml(hero.title)} 대표 시공사진" fetchpriority="high"><div class="caption"><span id="heroTitle">${escapeHtml(hero.title)}</span><span id="heroYear">JEJARIE / ${escapeHtml(year)}</span></div></a>`);
  } else home = replaceBlock(home, 'HOME_HERO', '<a class="shell hero-photo" id="heroProject" href="/work/rooftop-pergola-construction/"><img id="heroImage" src="images/R1.jpg" alt="제자리에 옥상 구조 시공 현장" fetchpriority="high"><div class="caption"><span id="heroTitle">옥상 파고라 구조 시공</span><span id="heroYear">JEJARIE / 2026</span></div></a>');
  home = replaceBlock(home, 'HOME_FILTERS', ['전체', ...categories].map((name,index) => `<button class="filter${index ? '' : ' active'}" data-filter="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join(''));
  home = replaceBlock(home, 'HOME_PROJECTS', featured.map(renderHomeCard).join('') || '<div class="loading">최근 작업을 준비하고 있습니다.</div>');
  fs.writeFileSync(path.join(root, 'index.html'), home);

  let work = fs.readFileSync(path.join(root, 'work/index.html'), 'utf8');
  work = replaceBlock(work, 'WORK_FILTERS', ['전체', ...categories].map((name,index) => `<button class="filter${index ? '' : ' active'}" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join(''));
  work = replaceBlock(work, 'WORK_PROJECTS', workProjects.map(renderWorkCard).join('') || '<div class="empty">시공사례를 준비하고 있습니다.</div>');
  fs.writeFileSync(path.join(root, 'work/index.html'), work);

  let threshold = fs.readFileSync(path.join(root, 'artificial-marble-threshold/index.html'), 'utf8');
  threshold = replaceBlock(threshold, 'THRESHOLD_PROJECTS', thresholdProjects.map(renderThresholdCard).join('') || '<p class="empty">문지방 시공사례를 준비하고 있습니다.</p>');
  fs.writeFileSync(path.join(root, 'artificial-marble-threshold/index.html'), threshold);
  return { hero, featured, workProjects, thresholdProjects };
}
const section = (label, title, body, className = '') => `<section class="record ${className}"><div class="shell"><div class="record-head"><div class="eyebrow">${label}</div><h2>${title}</h2></div>${body}</div></section>`;

function renderProject(project) {
  const images = Array.isArray(project.images) ? project.images : [];
  const cover = project.coverImage || images[0] || '';
  const steps = (Array.isArray(project.processSteps) ? project.processSteps : []).filter(step => step && (step.title || step.description || (step.images || []).length));
  const findings = (Array.isArray(project.findings) ? project.findings : []).filter(Boolean);
  const followUp = project.followUp || {};
  const used = new Set([cover, project.beforeImage, project.afterImage, followUp.image, ...steps.flatMap(step => Array.isArray(step.images) ? step.images : [])].filter(Boolean));
  const extras = images.filter(src => !used.has(src));
  const story = project.story || project.details || '';
  const title = project.seoTitle || `${project.title} | ${project.category} | 제자리에`;
  const description = project.metaDescription || trimDescription(project.description || story || `${project.region} ${project.category} 시공사례`);
  const canonical = `${siteUrl}${projectUrl(project)}`;
  const related = published.filter(item => item.id !== project.id && item.category === project.category)
    .sort((a,b) => String(b.workDate || b.publishedAt || '').localeCompare(String(a.workDate || a.publishedAt || ''))).slice(0, 3);
  const serviceUrl = project.category === '인조대리석 문지방' ? '/artificial-marble-threshold/' : `/work/?category=${encodeURIComponent(project.category)}`;
  const serviceLabel = project.category === '인조대리석 문지방' ? '인조대리석 문지방 서비스 보기' : `${project.category} 시공사례 보기`;

  const hero = `<header class="shell head"><div class="eyebrow">${escapeHtml(project.category)} / PROJECT RECORD</div><h1>${escapeHtml(project.title)}</h1><p class="lead">${escapeHtml(project.description)}</p><div class="facts"><span>${escapeHtml(project.region)}</span><span>${escapeHtml(project.workDate || project.year || '')}</span><span>${images.length} PHOTOS</span></div></header>${cover ? `<figure class="hero-media"><img src="${escapeHtml(cover)}" alt="${escapeHtml(project.title)} 완료 모습" fetchpriority="high"></figure>` : ''}`;
  const storySection = story ? section('01 / SITE STORY', '현장 이야기.', `<div class="record-copy">${escapeHtml(story)}</div>${project.beforeImage ? `<img class="story-photo" src="${escapeHtml(project.beforeImage)}" alt="${escapeHtml(project.title)} 시공 전" loading="lazy">` : ''}`) : '';
  const findingSection = findings.length ? section('02 / CHECKED', '확인한 부분.', `<div class="findings">${findings.map(item => `<div class="finding">${escapeHtml(item)}</div>`).join('')}</div>`) : '';
  const processSection = steps.length ? section('03 / PROCESS', '작업 과정.', `<div class="process-list">${steps.map((step,index) => {
    const photos = Array.isArray(step.images) ? step.images : [];
    const stepTitle = step.title || `작업 단계 ${index + 1}`;
    return `<article class="process-step"><div class="step-copy"><div class="step-number">${String(index + 1).padStart(2,'0')}</div><div><h3>${escapeHtml(stepTitle)}</h3>${step.description ? `<p>${escapeHtml(step.description)}</p>` : ''}</div></div>${photos.length ? `<div class="step-images ${photos.length === 1 ? 'one' : ''}">${photos.map((src,photoIndex) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} - ${escapeHtml(stepTitle)}${photos.length > 1 ? ` ${photoIndex + 1}` : ''}" loading="lazy">`).join('')}</div>` : ''}</article>`;
  }).join('')}</div>`) : '';
  const compareSection = project.beforeImage && project.afterImage ? section('04 / BEFORE & AFTER', '전과 후.', `<div class="compare"><figure><img src="${escapeHtml(project.beforeImage)}" alt="${escapeHtml(project.title)} 시공 전" loading="lazy"><figcaption><span>BEFORE</span><span>시공 전</span></figcaption></figure><figure><img src="${escapeHtml(project.afterImage)}" alt="${escapeHtml(project.title)} 시공 후" loading="lazy"><figcaption><span>AFTER</span><span>시공 후</span></figcaption></figure></div>`) : '';
  const gallerySection = extras.length ? section('FIELD PHOTOS', '현장 사진.', `<div class="archive-gallery">${extras.map((src,index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} 현장사진 ${index + 1}" loading="lazy">`).join('')}</div>`) : '';
  const resultSection = project.result ? section('05 / RESULT', '작업 결과.', `<div class="record-copy">${escapeHtml(project.result)}</div>`) : '';
  const followSection = followUp.period || followUp.content ? section('06 / FOLLOW-UP', '시공 후 경과.', `<div class="record-copy">${followUp.period ? `<span class="period">${escapeHtml(followUp.period)}</span>` : ''}${followUp.content ? `<div>${escapeHtml(followUp.content)}</div>` : ''}</div>${followUp.image ? `<img class="follow-photo" src="${escapeHtml(followUp.image)}" alt="${escapeHtml(project.title)} 시공 후 경과" loading="lazy">` : ''}`) : '';
  const reviewSection = project.reviewVisible && project.review ? section('07 / REVIEW', '고객 후기.', `<p class="quote">${escapeHtml(project.review)}</p>`, 'review') : '';
  const contact = `<section class="contact"><div class="shell contact-grid"><div><div class="eyebrow">CONSULTATION</div><h2>비슷한 문제로<br>고민하고 계신가요?</h2></div><div><p>어떤 공사가 필요한지 모르셔도 괜찮습니다. 현장 사진을 보내주시면 먼저 확인해드립니다.</p><div class="contact-actions"><a href="https://open.kakao.com/o/sRI5ZKNi" target="_blank" rel="noopener noreferrer">카카오로 사진 보내기 ↗</a><a href="tel:01023961935">전화 문의 010-2396-1935</a></div></div></div></section>`;
  const relatedSection = `<section class="related"><div class="shell"><div class="related-top"><div><div class="eyebrow">RELATED WORK</div><h2>같은 분야의<br>시공 기록.</h2></div><div><a class="more" href="${serviceUrl}">${serviceLabel} →</a><br><a class="more" href="/work/">더 많은 시공사례 보기 →</a></div></div>${related.length ? `<div class="related-grid">${related.map(item => `<a class="related-card" href="${projectUrl(item)}"><img src="${escapeHtml(item.coverImage || item.images?.[0] || '')}" alt="${escapeHtml(item.title)} 완료 모습" loading="lazy"><small>${escapeHtml(item.category)} · ${escapeHtml(item.region)}</small><h3>${escapeHtml(item.title)}</h3></a>`).join('')}</div>` : '<p class="related-empty">같은 분야의 다른 시공사례를 준비하고 있습니다.</p>'}</div></section>`;
  const structuredData = {
    '@context':'https://schema.org', '@type':'Article', headline:project.title, description,
    image:images.map(absolute), datePublished:project.publishedAt || project.workDate, dateModified:project.updatedAt || project.publishedAt || project.workDate,
    mainEntityOfPage:canonical, author:{'@type':'Organization',name:'제자리에',url:siteUrl}, publisher:{'@type':'Organization',name:'제자리에',url:siteUrl}
  };
  const breadcrumbs = {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'HOME',item:`${siteUrl}/`},
    {'@type':'ListItem',position:2,name:'WORK',item:`${siteUrl}/work/`},
    {'@type':'ListItem',position:3,name:project.title,item:canonical}
  ]};

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f2efe8"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="제자리에"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}">${cover ? `<meta property="og:image" content="${absolute(cover)}">` : ''}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">${cover ? `<meta name="twitter:image" content="${absolute(cover)}">` : ''}<script type="application/ld+json">${escapeJson(structuredData)}</script><script type="application/ld+json">${escapeJson(breadcrumbs)}</script><style>${css}</style></head><body><nav><div class="shell nav"><a class="logo" href="/">제자리에</a><a class="back" href="/work/">← WORK</a></div></nav><main>${hero}${storySection}${findingSection}${processSection}${compareSection}${gallerySection}${resultSection}${followSection}${reviewSection}${contact}${relatedSection}</main><footer><div class="shell">© 2026 JEJARIE</div></footer></body></html>`;
}

const listings = renderListingPages();

for (const project of published) {
  const slug = project.slug || `project-${String(project.id).slice(0, 8)}`;
  const directory = path.join(root, 'work', slug);
  fs.mkdirSync(directory, { recursive:true });
  fs.writeFileSync(path.join(directory, 'index.html'), renderProject({ ...project, slug }));
}

const staticUrls = [
  { loc:'/', changefreq:'monthly', priority:'1.0' },
  { loc:'/artificial-marble-threshold/', changefreq:'monthly', priority:'0.9' },
  { loc:'/work/', changefreq:'weekly', priority:'0.8' }
];
const urls = [...staticUrls, ...published.map(project => ({ loc:projectUrl(project), lastmod:String(project.updatedAt || project.publishedAt || project.workDate || '').slice(0,10), changefreq:'monthly', priority:'0.7' }))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item => `  <url><loc>${siteUrl}${item.loc}</loc>${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ''}<changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
console.log(`Generated ${published.length} WORK pages, ${listings.featured.length} HOME cards, ${listings.thresholdProjects.length} threshold cards, and sitemap.xml`);

const owner = process.env.GITHUB_OWNER || 'paranegg';
const repo = process.env.GITHUB_REPO || 'Jejarie';
const branch = process.env.GITHUB_BRANCH || 'main';

async function github(path, options = {}) {
  if (!process.env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN 환경 변수가 없습니다.');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub 요청 실패 (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.status === 204 ? null : response.json();
}

module.exports = { github, branch };

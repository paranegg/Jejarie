const { github, branch } = require('./github');

async function repositoryState(path, fallback) {
  const ref = await github(`/git/ref/heads/${encodeURIComponent(branch)}`);
  const parent = await github(`/git/commits/${ref.object.sha}`);
  try {
    const file = await github(`/contents/${path}?ref=${encodeURIComponent(branch)}`);
    const value = JSON.parse(Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8'));
    return { ref, parent, value };
  } catch (error) {
    if (/\(404\)/.test(error.message)) return { ref, parent, value: fallback };
    throw error;
  }
}

async function commitJson({ path, value, message, extraTree = [] }) {
  const { ref, parent } = await repositoryState(path, null);
  const content = Buffer.from(JSON.stringify(value, null, 2) + '\n').toString('base64');
  const blob = await github('/git/blobs', { method: 'POST', body: JSON.stringify({ content, encoding: 'base64' }) });
  const tree = await github('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }, ...extraTree] })
  });
  const commit = await github('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] })
  });
  await github(`/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false })
  });
  return commit;
}

module.exports = { repositoryState, commitJson };

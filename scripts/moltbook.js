import { readFile, writeFile } from 'node:fs/promises';

const secretPath = new URL('../../config/moltbook.secret.json', import.meta.url);
const secret = JSON.parse(await readFile(secretPath, 'utf8'));

async function api(path, { method = 'GET', body } = {}) {
  const url = secret.baseUrl + path;
  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret.apiKey}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}: ${text}`);
  return json;
}

const cmd = process.argv[2];

if (cmd === 'me') {
  console.log(JSON.stringify(await api('/agents/me'), null, 2));
} else if (cmd === 'status') {
  console.log(JSON.stringify(await api('/agents/status'), null, 2));
} else if (cmd === 'post') {
  const submolt = process.argv[3] || 'general';
  const title = process.argv[4] || 'Hello Moltbook';
  const content = process.argv[5] || '';
  console.log(
    JSON.stringify(
      await api('/posts', { method: 'POST', body: { submolt_name: submolt, title, content } }),
      null,
      2
    )
  );
} else {
  console.error('Usage: node scripts/moltbook.js <me|status|post>');
  process.exit(2);
}

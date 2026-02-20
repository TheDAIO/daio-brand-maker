import { readFile } from 'node:fs/promises';

const secretPath = new URL('../../config/clawdmatch.secret.json', import.meta.url);
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
  if (!resp.ok) {
    throw new Error(`${resp.status} ${resp.statusText}: ${text}`);
  }
  return json;
}

const cmd = process.argv[2];

if (cmd === 'me') {
  console.log(JSON.stringify(await api('/agents/me'), null, 2));
} else if (cmd === 'discover') {
  const limit = Number(process.argv[3] || 10);
  console.log(JSON.stringify(await api(`/agents/discover?limit=${limit}`), null, 2));
} else if (cmd === 'like') {
  const target = process.argv[3];
  if (!target) throw new Error('Usage: node scripts/clawdmatch.js like <target_agent_id>');
  console.log(JSON.stringify(await api('/swipes', { method: 'POST', body: { target_agent_id: target, action: 'like' } }), null, 2));
} else {
  console.error('Usage: node scripts/clawdmatch.js <me|discover|like>');
  process.exit(2);
}

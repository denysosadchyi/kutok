import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const [configText, handlerText, sourceReadme] = await Promise.all([
  readFile(new URL('vercel.json', root), 'utf8'),
  readFile(new URL('api/readme.mjs', root), 'utf8'),
  readFile(new URL('README.md', root), 'utf8'),
]);
const config = JSON.parse(configText);

assert.deepEqual(config.rewrites, [{ source: '/README.md', destination: '/api/readme' }]);
assert.equal(config.functions?.['api/readme.mjs']?.includeFiles, 'README.md');
assert.match(handlerText, /Content-Type'.*text\/markdown; charset=utf-8/);

const { default: handler } = await import(new URL('api/readme.mjs', root));
const headers = new Map();
let status;
let body;
handler({}, {
  setHeader(name, value) { headers.set(name.toLowerCase(), value); },
  status(code) { status = code; return this; },
  send(value) { body = value; },
});

assert.equal(status, 200);
assert.equal(headers.get('content-type'), 'text/markdown; charset=utf-8');
assert.equal(body, sourceReadme);

console.log('Vercel README fallback contract passes');

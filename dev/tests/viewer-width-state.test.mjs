import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const widthKeys = [...source.matchAll(/\{ key: '([^']+)'/g)].map((match) => match[1]);
const hashFor = source.match(/function hashFor[\s\S]*?\n}\n\nfunction syncWidthLinks/)[0]
  .replace(/\n\nfunction syncWidthLinks$/, '');
const hashState = source.match(/function hashState[\s\S]*?\n}\n\nfunction fromHash/)[0]
  .replace(/\n\nfunction fromHash$/, '');
const context = { WIDTHS: widthKeys.map((key) => ({ key })), encodeURIComponent, decodeURIComponent, location: { hash: '' } };

vm.createContext(context);
vm.runInContext(`${hashFor}\n${hashState}`, context);

const wireframes = (await readdir(new URL('../../wireframes/', import.meta.url)))
  .filter((file) => file.endsWith('.html'));
assert.ok(wireframes.length > 0, 'wireframe fixtures exist');

for (const file of wireframes) {
  for (const width of widthKeys) {
    const hash = context.hashFor(`wireframes/${file}`, width);
    context.location.hash = hash;
    assert.deepEqual({ ...context.hashState() }, { file: `wireframes/${file}`, width }, `${file}: ${width} round-trips`);
  }
}

context.location.hash = '#wireframes/listings.html';
assert.deepEqual({ ...context.hashState() }, { file: 'wireframes/listings.html', width: null }, 'legacy hashes remain valid');
assert.match(source, /html\[data-shell-stage="full"\] \.wf-stage>\.app,html\[data-shell-stage="full"\] body>\.app\{width:100%!important;max-width:none!important/);
assert.match(source, /a\.href = hashFor\(f\)/);
assert.match(source, /window\.addEventListener\('popstate', showFromHash\)/);

console.log(`viewer width URL state passes for ${wireframes.length} wireframes`);

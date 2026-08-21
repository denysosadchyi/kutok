import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const tokenSource = await readFile(new URL('design-system/tokens.css', root), 'utf8')
const uncomment = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '')
const tokens = uncomment(tokenSource)
const radiusMap = Object.fromEntries(
  [...tokens.matchAll(/^\s*--radius-(\d+)\s*:\s*([\d.]+)px\s*;/gm)]
    .map(([, key, value]) => [key, `${value}px`]),
)
assert.deepEqual(radiusMap, {
  4: '4px',
  6: '6px',
  8: '8px',
  10: '10px',
  12: '12px',
  14: '14px',
  16: '16px',
  18: '18px',
  20: '20px',
  30: '30px', // intentional soft-square avatar shape
  999: '999px',
}, 'radius tokens must stay on the tighter canonical scale')

const files = (await readdir(new URL('design-system/components/', root)))
  .filter((file) => file.endsWith('.css') && file !== 'index.css')
const componentSources = await Promise.all(
  files.map(async (file) => [file, uncomment(await readFile(new URL(`design-system/components/${file}`, root), 'utf8'))]),
)
const componentCss = Object.fromEntries(componentSources)
const componentText = Object.values(componentCss).join('\n')

const radiusNames = [...componentText.matchAll(/--radius-(\d+)/g)].map(([, key]) => key)
assert.ok(radiusNames.length > 0, 'component CSS uses radius tokens')
assert.ok(radiusNames.every((key) => Object.hasOwn(radiusMap, key)), 'component CSS must not use legacy radius token names')
for (const [file, source] of Object.entries(componentCss)) {
  if (file !== 'avatar.css') assert.doesNotMatch(source, /--radius-30\b/, `${file} must not use the avatar-only radius token`)
}
assert.ok((componentText.match(/--radius-999\b/g) || []).length >= 5, 'pill radius token must remain intentionally used')

for (const [file, source] of Object.entries(componentCss)) {
  for (const match of source.matchAll(/\bborder(?:-[a-z]+)*-radius\s*:\s*([^;{}]+)/g)) {
    for (const [, px] of match[1].matchAll(/\b(\d+(?:\.\d+)?)px\b/g)) {
      assert.equal(Number(px), 0, `${file} has a raw non-zero border-radius literal`)
    }
  }
}

console.log(`radius token contract passes (${files.length} component stylesheets)`)

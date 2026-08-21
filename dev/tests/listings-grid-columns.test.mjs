import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const css = await readFile(new URL('design-system/components/feed.css', root), 'utf8')

const desktopStart = css.indexOf('@media (min-width: 67.5rem)')
const wideStart = css.indexOf('@media (min-width: 90rem)')
assert.ok(desktopStart >= 0, 'catalog desktop breakpoint remains present')
assert.ok(wideStart > desktopStart, 'wide catalog breakpoint follows desktop rules')

const desktop = css.slice(desktopStart, wideStart)
const wide = css.slice(wideStart)
assert.match(
  desktop,
  /\.app--catalog \.catalog-results \.feed\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
  'catalog card mode uses two columns on ordinary desktop',
)
assert.match(
  wide,
  /\.app--catalog \.catalog-results \.feed:not\(\.feed--table\)\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(12rem,\s*1fr\)\)/,
  'catalog card mode uses three columns with a minimum card track on wide desktop',
)
assert.match(wide, /\.app--catalog\s*\{[\s\S]*?max-width:\s*90rem;/, 'wide catalog gets enough content width for three cards')
assert.doesNotMatch(wide, /\.feed\.feed--table\s*\{[\s\S]*?grid-template-columns/, 'wide card rule does not target table mode')

console.log('listings card grid column contract passes')

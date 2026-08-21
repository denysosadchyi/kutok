import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const css = await readFile(new URL('design-system/components/feed.css', root), 'utf8')
const desktop = css.slice(css.indexOf('@media (min-width: 67.5rem)'))

assert.ok(desktop, 'desktop catalog rules remain scoped to the desktop breakpoint')
assert.match(desktop, /\.filters-inline \{[\s\S]*?position:\s*sticky;/, 'filter rail is sticky on desktop')
assert.match(desktop, /\.filters-inline \{[\s\S]*?top:\s*var\(--space-88\);/, 'filter rail clears the product navigation')
assert.match(desktop, /\.filters-inline \{[\s\S]*?max-height:\s*calc\(100vh - var\(--space-88\) - var\(--space-24\)\);/, 'filter rail stays within the viewport')
assert.match(desktop, /\.filters-inline \{[\s\S]*?overflow-y:\s*auto;/, 'long filter controls remain reachable in the rail')

assert.doesNotMatch(css.slice(0, css.indexOf('@media (min-width: 67.5rem)')), /\.filters-inline[\s\S]*?position:\s*sticky/, 'mobile filter rail is not sticky')
console.log('listings desktop filter sticky contract passes')

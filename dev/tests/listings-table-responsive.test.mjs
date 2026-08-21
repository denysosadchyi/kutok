import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const html = await readFile(new URL('wireframes/listings.html', root), 'utf8')
const css = await readFile(new URL('design-system/components/feed.css', root), 'utf8')

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  assert.ok(match, `CSS rule exists for ${selector}`)
  return match[1]
}

const phoneCard = rule('.feed.feed--table .card')
assert.match(phoneCard, /grid-template-columns:\s*var\(--size-84\) minmax\(0, 1fr\) max-content/, 'phone rows reserve a compact photo, flexible details, and a price')
assert.match(phoneCard, /grid-template-areas:\s*"photo listing price"\s*"photo district price"\s*"photo verification price"/, 'phone rows keep every core fact in a three-tier tap row')
assert.match(phoneCard, /min-height:\s*var\(--size-88\)/, 'phone rows remain comfortably tappable')
assert.match(rule('.feed.feed--table .card-photo img'), /width:\s*var\(--size-84\)/, 'phone photos stay within the 72-88px comparison range')
assert.match(rule('.feed.feed--table .badge--on-photo'), /display:\s*inline-flex/, 'phone rows keep verification visible')
assert.match(rule('.feed.feed--table .badge--on-photo'), /grid-area:\s*verification/, 'verification has a dedicated readable line')
assert.match(rule('.feed.feed--table .card-title'), /-webkit-line-clamp:\s*2/, 'long Ukrainian titles are bounded on narrow screens')
assert.match(rule('.feed.feed--table .place .t'), /-webkit-line-clamp:\s*2/, 'long district names are bounded on narrow screens')
assert.match(rule('.listing-table-head'), /display:\s*none/, 'phone table mode has no header row')

const tabletStart = css.indexOf('@media (min-width: 47.5rem) and (max-width: 67.4375rem)')
const desktopStart = css.indexOf('@media (min-width: 67.5rem)', tabletStart)
assert.ok(tabletStart >= 0 && desktopStart > tabletStart, 'tablet rules are explicitly bounded before desktop')
const tablet = css.slice(tabletStart, desktopStart)
assert.match(tablet, /\.listing-table-head\s*\{[\s\S]*?display:\s*grid/, 'tablet table mode restores a compact header')
assert.match(tablet, /grid-template-columns:\s*var\(--size-84\) minmax\(0, 1fr\) max-content/, 'tablet uses three fitting columns instead of a squeezed five-column desktop row')
assert.match(tablet, /span:nth-child\(3\),[\s\S]*?span:nth-child\(4\)\s*\{\s*display:\s*none/, 'tablet omits only redundant header labels, not row data')
assert.match(tablet, /span:nth-child\(5\)\s*\{\s*grid-column:\s*3/, 'tablet keeps the price header over the visible price column')

assert.match(html, /row\.hidden = !visible/, 'type filtering still hides filtered listing rows')
assert.match(html, /data-listing-view="table"/, 'the grid/table toggle remains wired')
assert.match(css, /@media \(min-width: 67\.5rem\)[\s\S]*?grid-template-areas:\s*"photo listing district verification price"/, 'desktop retains its explicit five-column table')

console.log('listings table uses a three-tier phone row, compact tablet headers, and preserves the desktop five-column contract')

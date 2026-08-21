import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const html = await readFile(new URL('wireframes/listings.html', root), 'utf8')
const css = await readFile(new URL('design-system/components/feed.css', root), 'utf8')

const cards = [...html.matchAll(/<a class="card(?: [^"]+)?" href="(?:room|profile)\.html">([\s\S]*?)<\/a>/g)]
assert.equal(cards.length, 12, 'listings fixture keeps all 12 table rows')
assert.match(html, /<ul class="feed" aria-label="Оголошення">/, 'the feed is the single table-view wrapper')
assert.match(html, /<li class="listing-table-head">\s*<span>Фото<\/span><span>Оголошення<\/span><span>Район<\/span><span>Перевірка<\/span><span>Ціна<\/span>/, 'table header keeps the five visible column roles')
assert.match(html, /data-listing-view="table"/, 'table view toggle remains wired')

for (const [, body] of cards) {
  assert.match(body, /class="card-photo"/, 'every result supplies the photo grid item')
  assert.match(body, /class="place"/, 'every result supplies the district grid item')
  assert.match(body, /class="badge badge--on-photo"/, 'every result supplies the verification grid item')
  assert.match(body, /class="card-main"/, 'every result supplies the listing grid item')
  assert.match(body, /class="card-price"/, 'every result supplies the price grid item')
}

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  assert.ok(match, `CSS rule exists for ${selector}`)
  return match[1]
}

const tableCard = rule('.app--catalog .catalog-results .feed.feed--table .card')
assert.match(tableCard, /grid-template-areas:\s*"photo listing district verification price"/, 'the row has named columns instead of implicit placement')
assert.match(tableCard, /grid-template-rows:\s*minmax\(var\(--size-106\), auto\)/, 'the row has one explicit content track')
assert.match(tableCard, /min-height:\s*calc\(var\(--size-106\) \+ var\(--space-20\)\)/, 'row density is capped at a compact 126px minimum')

const desktopWorkspace = rule('.app--catalog .catalog-workspace')
const desktopResults = rule('.app--catalog .catalog-results')
const tableFeed = rule('.app--catalog .catalog-results .feed.feed--table')
const tableRow = rule('.app--catalog .catalog-results .feed.feed--table > li')
const tableHead = rule('.app--catalog .catalog-results .feed.feed--table .listing-table-head')
for (const [name, declaration] of [
  ['workspace', desktopWorkspace],
  ['results bridge', desktopResults],
  ['table feed', tableFeed],
  ['table row', tableRow],
  ['table header', tableHead],
  ['table card', tableCard],
]) {
  assert.match(declaration, /width:\s*100%/, `${name} fills its available catalog track`)
  assert.match(declaration, /min-width:\s*0/, `${name} can shrink inside the full-width grid`)
  assert.ok(
    [...declaration.matchAll(/max-width:\s*([^;]+)/g)].every(([, value]) => value.trim() === 'none'),
    `${name} has no content-width cap in table mode`,
  )
}
assert.match(tableRow, /align-self:\s*stretch/, 'every table row stretches across the same grid width')

const gridCells = [
  ['.app--catalog .catalog-results .feed.feed--table .card-photo img', 'photo', '1'],
  ['.app--catalog .catalog-results .feed.feed--table .card-main', 'listing', '2'],
  ['.app--catalog .catalog-results .feed.feed--table .place', 'district', '3'],
  ['.app--catalog .catalog-results .feed.feed--table .badge--on-photo', 'verification', '4'],
  ['.app--catalog .catalog-results .feed.feed--table .card-price', 'price', '5'],
]
for (const [selector, area, column] of gridCells) {
  const cell = rule(selector)
  assert.match(cell, new RegExp(`grid-area:\\s*${area}`), `${area} has a named grid area`)
  assert.match(cell, new RegExp(`grid-column:\\s*${column}`), `${area} keeps its explicit column`)
  assert.match(cell, /grid-row:\s*1/, `${area} is pinned to the only desktop row`)
}
assert.match(rule('.app--catalog .catalog-results .feed.feed--table .badge--on-photo'), /position:\s*static/, 'the verification badge stops escaping its display:contents photo wrapper')
assert.match(rule('.app--catalog .catalog-results .feed.feed--table .card-title'), /-webkit-line-clamp:\s*2/, 'long listing titles stay bounded')
assert.match(rule('.app--catalog .catalog-results .feed.feed--table .place .t'), /-webkit-line-clamp:\s*2/, 'long district names stay bounded')

console.log('listings table contract pins 12 results into one explicit five-column row')

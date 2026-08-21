import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const html = await readFile(new URL('wireframes/listings.html', root), 'utf8')
const feed = html.slice(html.indexOf('<ul class="feed"'), html.indexOf('</ul>', html.indexOf('<ul class="feed"')))
const rows = [...feed.matchAll(/<li>\s*<a class="card(?: [^"]+)?"/g)]
const people = rows.filter((match) => match[0].includes('card--person'))

assert.equal(rows.length, 12, 'the fixture contains 12 filterable listing rows')
assert.equal(people.length, 4, 'the fixture contains 4 people rows')
assert.equal(rows.length - people.length, 8, 'the fixture contains 8 room rows')
assert.match(html, /value="rooms"> Кімнати <span class="seg-count">8<\/span>/)
assert.match(html, /value="people"> Люди <span class="seg-count">4<\/span>/)
assert.match(html, /value="all" checked> Усі <span class="seg-count">12<\/span>/)
assert.match(html, /input\[name="type"\]:checked/, 'the selected type initializes the filter')
assert.match(html, /row\.hidden = !visible/, 'type filtering hides rows without removing them')
assert.match(html, /type === 'people' \? isPerson : !isPerson/, 'rooms and people use the existing card kind class')
assert.match(html, /heading\.textContent = visibleCount \+ ' оголошень'/, 'the heading count follows the filtered rows')
assert.match(html, /data-listing-view/, 'the layout toggle remains present alongside the type filter')

console.log('listings type filter contract passes for 8 rooms, 4 people, and 12 total rows')

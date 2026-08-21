import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const html = await readFile(new URL('wireframes/listings.html', root), 'utf8')
const cardCss = await readFile(new URL('design-system/components/card.css', root), 'utf8')
const feedCss = await readFile(new URL('design-system/components/feed.css', root), 'utf8')

const peopleCards = html.match(/class="card card--person"/g) ?? []
const backdrops = html.match(/class="person-card__backdrop"/g) ?? []
const avatars = html.match(/class="person-card__avatar"/g) ?? []

assert.equal(peopleCards.length, 4, 'the listings fixture keeps four person cards')
assert.equal(backdrops.length, peopleCards.length, 'every person card supplies its backdrop image')
assert.equal(avatars.length, peopleCards.length, 'every person card supplies its readable foreground avatar')
assert.match(cardCss, /\.card--person \.card-photo\s*\{[\s\S]*?padding-block:\s*var\(--space-16\)/, 'card mode keeps the large padded person treatment')
assert.match(cardCss, /\.card-photo \.person-card__backdrop\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0/, 'card mode layers the backdrop across the photo area')
assert.match(cardCss, /\.card-photo \.person-card__avatar\s*\{[\s\S]*?width:\s*calc\(75%\s*-\s*var\(--space-16\)\s*-\s*var\(--space-16\)\)[\s\S]*?aspect-ratio:\s*1[\s\S]*?border-radius:\s*var\(--radius-999\)/, 'card mode keeps an inset circular avatar at roughly 75% after its two padding tokens')
assert.doesNotMatch(cardCss, /@media \(max-width: 67\.499rem\)[\s\S]*?\.card--person \.person-card__backdrop\s*\{\s*display:\s*none/, 'mobile card mode never hides the person backdrop')
assert.doesNotMatch(cardCss, /@media \(max-width: 67\.499rem\)[\s\S]*?\.card--person \.card-photo\s*\{[\s\S]*?aspect-ratio:\s*1/, 'mobile card mode does not collapse people into avatar-only circles')

assert.match(feedCss, /\.feed\.feed--table \.person-card__backdrop\s*\{\s*display:\s*none/, 'compact table mode intentionally omits the backdrop')
assert.match(feedCss, /\.feed\.feed--table \.person-card__avatar\s*\{\s*border-radius:\s*var\(--radius-999\)/, 'compact table mode retains the circular avatar')
assert.match(cardCss, /\.card-photo\s*\{[\s\S]*?aspect-ratio:\s*4\s*\/\s*3/, 'the shared large card photo aspect remains unchanged for room cards')
assert.match(cardCss, /@media \(min-width: 67\.5rem\)[\s\S]*?\.card\s*\{[\s\S]*?padding:\s*var\(--space-12\)/, 'desktop card treatment remains unchanged')

console.log('mobile people cards retain their large backdrop treatment while table rows stay compact')

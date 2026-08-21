import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../../', import.meta.url)
const css = await readFile(new URL('design-system/components/header.css', root), 'utf8')
const desktop = css.match(/@media \(min-width: 67\.5rem\) \{([\s\S]*)\n\}\s*$/)?.[1] ?? ''

assert.match(desktop, /\.app:has\(> \.tabbar\) > \.app-head\s*\{[\s\S]*position:\s*sticky;/)
assert.match(desktop, /\.app:has\(> \.tabbar\) > \.app-head\s*\{[\s\S]*top:\s*var\(--size-56\);/)
assert.match(desktop, /\.app:has\(> \.tabbar\) > \.app-head\s*\{[\s\S]*z-index:\s*4;/)
assert.doesNotMatch(css, /@media \(max-width:/, 'header component keeps mobile rules in the canonical responsive layer')

console.log('desktop navigation/header sticky contract passes')

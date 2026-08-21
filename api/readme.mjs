import { readFileSync } from 'node:fs';

// Vercel's current deployment omits only the root README.md from static output.
// Keep this endpoint tied to the tracked source so it cannot drift from README.
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

export default function readmeHandler(_request, response) {
  response.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  response.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  response.status(200).send(readme);
}

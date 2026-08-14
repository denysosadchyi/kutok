/* LOCAL ONLY — this file is not in git and must not be committed.

   It is picked up by the `import.meta.glob('./dev/*.local.tsx')` hook in
   src/App.tsx, which matches zero files on any other machine, so nothing here
   is required for the app to build or run.

   What it does: mounts the Agentation annotation toolbar. Click an element in
   the running app, write a note, and it posts a structured blob (CSS
   selector, source file, React tree, computed styles) to the local server on
   :4747, where an MCP-connected agent can read it.

   Setup this file depends on, none of which is in the repo either:
     npm install --no-save agentation agentation-mcp
     claude mcp add agentation -- npx agentation-mcp server
   `npm install` prunes extraneous packages, so re-run the install line if the
   toolbar disappears after someone touches dependencies.

   Two things that are easy to get wrong, both already paid for:

   1. It skips "/". That route is ProtoNav — a left-hand index beside an
      IFRAME that stages the real screens, and the app renders inside that
      iframe too. Mounting at the root produced TWO live instances, one per
      document, and the outer one is the useless half: cross-document event
      listeners, DOM traversal and element geometry all stop at the iframe
      boundary, so it could annotate the navigator's own chrome and nothing of
      the design under review, while still fighting the inner toolbar for the
      same screen corner. Skipping "/" leaves exactly one instance wherever it
      can actually do its job.

   2. The endpoint is derived from location.hostname, not hardcoded to
      localhost. The dev server binds 0.0.0.0 (vite.config.ts sets
      `host: true`) and the review is normally opened from another machine on
      the LAN, where "localhost" means THAT machine's loopback and the POST
      fails with "Failed to fetch". Port 4747 is open to 192.168.31.0/24 in
      ufw for the same reason. */
import { useLocation } from 'react-router-dom'
import { Agentation } from 'agentation'

export default function DevAnnotator() {
  const { pathname } = useLocation()
  if (pathname === '/') return null
  return <Agentation endpoint={`http://${location.hostname}:4747`} />
}

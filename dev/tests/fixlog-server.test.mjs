import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

const ROOT = new URL('../..', import.meta.url)
const SERVER = new URL('../fixlog-server.mjs', import.meta.url)
const UI = new URL('../fixlog.html', import.meta.url)

async function freePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}

async function waitForHealth(base, child) {
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(`server exited with ${child.exitCode}`)
    try {
      const response = await fetch(`${base}/health`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error('isolated fixlog server did not become healthy')
}

async function post(base, path, body) {
  const response = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { response, data: await response.json() }
}

test('rework executor survives API, queue, amendment, and validation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'kutok-fixlog-test-'))
  const file = join(dir, 'ratings.json')
  const settingsFile = join(dir, 'settings.json')
  const port = await freePort()
  const base = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, [SERVER.pathname], {
    cwd: ROOT.pathname,
    env: {
      ...process.env,
      FIXLOG_HOST: '127.0.0.1',
      FIXLOG_PORT: String(port),
      FIXLOG_FILE: file,
      FIXLOG_SETTINGS_FILE: settingsFile,
    },
    stdio: ['ignore', 'ignore', 'pipe'],
  })

  try {
    await waitForHealth(base, child)

    const initialSettings = await fetch(`${base}/settings`).then((r) => r.json())
    assert.equal(initialSettings.executor, 'codex')

    const missingSetting = await fetch(`${base}/settings/executor`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    assert.equal(missingSetting.status, 400)

    const selected = await fetch(`${base}/settings/executor`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ executor: 'claude' }),
    })
    assert.equal(selected.status, 200)
    assert.equal((await selected.json()).settings.executor, 'claude')

    const first = await post(base, '/rework', {
      id: '12:00|/wireframes/listings.html',
      note: 'Виправ відступ',
      executor: 'codex',
    })
    assert.equal(first.response.status, 200)
    assert.equal(first.data.rating.rework.executor, 'codex')

    const queued = await fetch(`${base}/rework`).then((r) => r.json())
    assert.equal(queued.count, 1)
    assert.equal(queued.items[0].rework.executor, 'codex')

    const amended = await post(base, '/rework', {
      id: '12:00|/wireframes/listings.html',
      note: 'Виправ відступ і фокус',
      executor: 'claude',
    })
    assert.equal(amended.response.status, 200)
    assert.equal(amended.data.rating.reworks.length, 1)
    assert.equal(amended.data.rating.rework.executor, 'claude')

    const rejected = await post(base, '/rework', {
      id: '12:00|/wireframes/listings.html',
      note: 'Не запускати довільне',
      executor: 'sh -c anything',
    })
    assert.equal(rejected.response.status, 400)
    assert.match(rejected.data.error, /executor must be one of/)

    const legacy = await post(base, '/rework', {
      id: '12:01|/wireframes/room.html',
      note: 'Legacy-клієнт без поля',
    })
    assert.equal(legacy.response.status, 200)
    assert.equal(legacy.data.rating.rework.executor, 'claude')

    const invalidSetting = await fetch(`${base}/settings/executor`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ executor: 'shell' }),
    })
    assert.equal(invalidSetting.status, 400)

    const persisted = JSON.parse(await readFile(file, 'utf8'))
    assert.equal(persisted['12:00|/wireframes/listings.html'].rework.executor, 'claude')
    assert.equal(persisted['12:01|/wireframes/room.html'].rework.executor, 'claude')
    const persistedSettings = JSON.parse(await readFile(settingsFile, 'utf8'))
    assert.equal(persistedSettings.executor, 'claude')
  } finally {
    child.kill('SIGTERM')
    await new Promise((resolve) => child.once('exit', resolve))
    await rm(dir, { recursive: true, force: true })
  }
})

test('UI exposes both executors, persists selection, and sends it', async () => {
  const html = await readFile(UI, 'utf8')
  assert.match(html, /id="executorCodex"/)
  assert.match(html, /id="executorClaude"/)
  assert.match(html, /fixlog-executor/)
  assert.match(html, /fetch\(`\$\{RATE\}\/settings\/executor`/)
  assert.match(html, /method: 'PUT'/)
  assert.match(html, /JSON\.stringify\(\{ id: popKey, note, executor \}\)/)
})

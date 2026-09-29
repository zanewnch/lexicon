import { app, BrowserWindow, shell } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { chmod, copyFile, cp, mkdir, readdir, rename, rmdir, rm } from 'node:fs/promises'
import { createWriteStream, existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'
import { backup, DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

export type InvestmentStatus = { state: 'starting' | 'ready' | 'error'; url?: string; message?: string }
let status: InvestmentStatus = { state: 'starting' }
let startPromise: Promise<InvestmentStatus> | undefined
let child: ChildProcess | undefined
let investmentWindow: BrowserWindow | undefined

function projectRoot(): string {
  return resolve(__dirname, '../../investment')
}

function defaultStrategiesPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'investment-default-strategies.json')
    : join(projectRoot(), 'backend', 'strategy', 'data', 'strategies.json')
}

function dataDirectory(): string {
  return join(app.getPath('userData'), 'investment')
}

async function availablePort(): Promise<number> {
  return new Promise((accept, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') { server.close(); reject(new Error('No local port')); return }
      server.close(() => accept(address.port))
    })
  })
}

function databaseCounts(path: string): Record<string, number> {
  const database = new DatabaseSync(path, { readOnly: true })
  try {
    const integrity = database.prepare('PRAGMA integrity_check').get() as { integrity_check: string }
    if (integrity.integrity_check !== 'ok') throw new Error('Investment database integrity check failed')
    const counts: Record<string, number> = {}
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>
    for (const { name } of tables) {
      const quoted = `"${name.replaceAll('"', '""')}"`
      counts[name] = Number((database.prepare(`SELECT COUNT(*) AS total FROM ${quoted}`).get() as { total: number }).total)
    }
    return counts
  } finally { database.close() }
}

export async function importLegacyInvestment(legacyRoot: string, destination: string): Promise<void> {
  const source = resolve(legacyRoot)
  const oldDatabase = join(source, 'backend', 'db.sqlite3')
  if (!existsSync(oldDatabase)) throw new Error('所選目錄沒有 investment/backend/db.sqlite3')
  if (existsSync(join(destination, 'investment.sqlite3'))) throw new Error('投資資料已存在，不能重複匯入')
  await mkdir(resolve(destination, '..'), { recursive: true })
  const staging = `${destination}.importing-${randomUUID()}`
  await mkdir(staging, { mode: 0o700 })
  try {
  const oldCounts = databaseCounts(oldDatabase)
  const legacyDatabase = new DatabaseSync(oldDatabase, { readOnly: true })
  try { await backup(legacyDatabase, join(staging, 'investment.sqlite3')) }
  finally { legacyDatabase.close() }
  const newCounts = databaseCounts(join(staging, 'investment.sqlite3'))
  if (JSON.stringify(oldCounts) !== JSON.stringify(newCounts)) throw new Error('投資資料庫匯入後筆數不一致')

  const files: Array<[string, string]> = [
    ['backend/strategy/data/strategies.json', 'strategies.json'],
    ['frontend/src/data/seedNotes.json', 'seedNotes.json'],
    ['credentials.json', 'credentials.json'],
    ['backend/.env', '.env'],
    ['Sinopac.pfx', 'Sinopac.pfx']
  ]
  for (const [from, to] of files) {
    const sourcePath = join(source, from)
    if (existsSync(sourcePath)) {
      await copyFile(sourcePath, join(staging, to))
      if (to === 'credentials.json' || to === '.env' || to === 'Sinopac.pfx') await chmod(join(staging, to), 0o600)
    }
  }
  const oldMedia = join(source, 'backend', 'media')
  if (existsSync(oldMedia)) await cp(oldMedia, join(staging, 'media'), { recursive: true })
  if (!existsSync(join(staging, 'strategies.json'))) await copyFile(defaultStrategiesPath(), join(staging, 'strategies.json'))
  if (existsSync(destination)) {
    const entries = await readdir(destination)
    if (entries.length) throw new Error('投資資料目錄已存在，請先核對資料')
    await rmdir(destination)
  }
  await rename(staging, destination)
  } catch (error) {
    if (resolve(staging).startsWith(`${resolve(destination)}.importing-`)) {
      await rm(staging, { recursive: true, force: true })
    }
    throw error
  }
}

export async function backupInvestmentData(directory: string): Promise<string | undefined> {
  const source = dataDirectory()
  const databasePath = join(source, 'investment.sqlite3')
  if (!existsSync(databasePath)) return undefined
  await mkdir(directory, { recursive: true })
  const destination = join(directory, `investment-backup-${new Date().toISOString().replaceAll(':', '-')}`)
  const staging = `${destination}.creating-${randomUUID()}`
  await mkdir(staging, { mode: 0o700 })
  try {
    const database = new DatabaseSync(databasePath, { readOnly: true })
    try { await backup(database, join(staging, 'investment.sqlite3')) }
    finally { database.close() }
    databaseCounts(join(staging, 'investment.sqlite3'))
    for (const name of ['strategies.json', 'seedNotes.json', 'credentials.json', '.env', 'Sinopac.pfx', 'django-secret']) {
      const path = join(source, name)
      if (existsSync(path)) await copyFile(path, join(staging, name))
    }
    if (existsSync(join(source, 'media'))) await cp(join(source, 'media'), join(staging, 'media'), { recursive: true })
    await rename(staging, destination)
    return destination
  } catch (error) {
    if (resolve(staging).startsWith(`${resolve(destination)}.creating-`)) await rm(staging, { recursive: true, force: true })
    throw error
  }
}

async function prepareData(): Promise<void> {
  const destination = dataDirectory()
  if (existsSync(join(destination, 'investment.sqlite3'))) return
  const candidates = [
    process.env.LEXICON_INVESTMENT_LEGACY_ROOT,
    join(app.getPath('documents'), 'GitHub', 'investment'),
    resolve(projectRoot(), '..', '..', 'investment')
  ].filter((candidate): candidate is string => Boolean(candidate))
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'backend', 'db.sqlite3'))) {
      await importLegacyInvestment(candidate, destination)
      return
    }
  }
  await mkdir(destination, { recursive: true, mode: 0o700 })
  await copyFile(defaultStrategiesPath(), join(destination, 'strategies.json'))
}

async function waitForReady(url: string, process: ChildProcess, nonce: string): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (process.exitCode !== null || process.signalCode !== null) throw new Error('Investment service exited during startup')
    try {
      const response = await fetch(`${url}/api/lexicon/health/`, { signal: AbortSignal.timeout(500) })
      if (response.ok && (await response.json() as { nonce?: string }).nonce === nonce) return
    } catch { /* The service has not opened its listener yet. */ }
    await new Promise((done) => setTimeout(done, 250))
  }
  throw new Error('Investment service did not become ready within 30 seconds')
}

export function getInvestmentStatus(): InvestmentStatus { return status }

export function startInvestmentService(): Promise<InvestmentStatus> {
  if (startPromise) return startPromise
  startPromise = (async () => {
    status = { state: 'starting' }
    try {
      await prepareData()
      const port = await availablePort()
      const nonce = randomUUID()
      const url = `http://127.0.0.1:${port}`
      const root = projectRoot()
      const frontendDist = app.isPackaged ? join(process.resourcesPath, 'investment-web') : join(root, 'frontend', 'dist')
      if (!existsSync(join(frontendDist, 'index.html'))) throw new Error('Investment frontend is not built')
      const executable = app.isPackaged
        ? join(process.resourcesPath, 'investment-service', process.platform === 'win32' ? 'investment-service.exe' : 'investment-service')
        : process.env.LEXICON_INVESTMENT_PYTHON || 'python'
      const args = app.isPackaged ? [String(port)] : [join(root, 'backend', 'lexicon_service.py'), String(port)]
      const environment = {
        ...process.env,
        LEXICON_INVESTMENT_DATA_DIR: dataDirectory(),
        LEXICON_INVESTMENT_HEALTH_NONCE: nonce,
        LEXICON_INVESTMENT_FRONTEND_DIST: frontendDist,
        LEXICON_INVESTMENT_SEED_NOTES: existsSync(join(dataDirectory(), 'seedNotes.json'))
          ? join(dataDirectory(), 'seedNotes.json')
          : app.isPackaged
            ? join(process.resourcesPath, 'investment-seed-notes.json')
            : join(root, 'frontend', 'src', 'data', 'seedNotes.json')
      }
      const logPath = join(dataDirectory(), 'service.log')
      const log = createWriteStream(logPath, { flags: 'w' })
      child = spawn(executable, args, { cwd: app.isPackaged ? dataDirectory() : join(root, 'backend'), env: environment, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
      const spawnFailure = new Promise<never>((_resolve, reject) => child?.once('error', reject))
      child.stdout?.pipe(log, { end: false })
      child.stderr?.pipe(log, { end: false })
      child.once('exit', () => { if (status.state === 'ready') status = { state: 'error', message: '投資服務已停止' }; startPromise = undefined; log.end() })
      await Promise.race([waitForReady(url, child, nonce), spawnFailure])
      status = { state: 'ready', url }
    } catch (error) {
      status = { state: 'error', message: error instanceof Error ? error.message : String(error) }
      child?.kill()
      child = undefined
    }
    return status
  })()
  return startPromise
}

export async function openInvestmentWindow(): Promise<InvestmentStatus> {
  const current = await startInvestmentService()
  if (current.state !== 'ready' || !current.url) return current
  if (!investmentWindow || investmentWindow.isDestroyed()) {
    investmentWindow = new BrowserWindow({
      width: 1280, height: 850, minWidth: 900, minHeight: 600, title: 'Lexicon · 投資',
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
    })
    investmentWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://')) void shell.openExternal(url)
      return { action: 'deny' }
    })
    investmentWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(`${current.url}/`)) event.preventDefault()
    })
    await investmentWindow.loadURL(current.url)
  }
  investmentWindow.show()
  investmentWindow.focus()
  return current
}

export async function openInvestmentBrowser(): Promise<InvestmentStatus> {
  const current = await startInvestmentService()
  if (current.state === 'ready' && current.url) await shell.openExternal(current.url)
  return current
}

export function stopInvestmentService(): void {
  if (child) {
    const process = child
    process.stdin?.end('shutdown\n')
    const timeout = setTimeout(() => { if (process.exitCode === null) process.kill() }, 3000)
    timeout.unref()
  }
  child = undefined
}

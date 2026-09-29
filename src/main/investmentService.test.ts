import { afterAll, expect, test, vi } from 'vitest'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => process.env.LEXICON_TEST_USER_DATA }, BrowserWindow: class {}, shell: {} }))

const temporaryDirectories: string[] = []
afterAll(async () => {
  for (const directory of temporaryDirectories) {
    if (directory.startsWith(tmpdir())) await rm(directory, { recursive: true, force: true })
  }
})

test('imports a consistent SQLite snapshot and writable investment files without altering the source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lexicon-investment-import-'))
  temporaryDirectories.push(root)
  const source = join(root, 'legacy')
  const backend = join(source, 'backend')
  await mkdir(join(backend, 'strategy', 'data'), { recursive: true })
  await mkdir(join(backend, 'media', 'avatars'), { recursive: true })
  await mkdir(join(source, 'frontend', 'src', 'data'), { recursive: true })
  const databasePath = join(backend, 'db.sqlite3')
  const database = new DatabaseSync(databasePath)
  database.exec("CREATE TABLE notes (id TEXT PRIMARY KEY, title TEXT); INSERT INTO notes VALUES ('note-123', 'Saved lesson')")
  database.close()
  await writeFile(join(backend, 'strategy', 'data', 'strategies.json'), '[{"id":"strategy-1"}]')
  await writeFile(join(source, 'frontend', 'src', 'data', 'seedNotes.json'), '[{"id":"note-123"}]')
  await writeFile(join(backend, 'media', 'avatars', 'avatar.txt'), 'avatar')
  const destination = join(root, 'new-data')
  const { importLegacyInvestment } = await import('./investmentService')
  await importLegacyInvestment(source, destination)

  const imported = new DatabaseSync(join(destination, 'investment.sqlite3'), { readOnly: true })
  expect(imported.prepare('SELECT id, title FROM notes').get()).toEqual({ id: 'note-123', title: 'Saved lesson' })
  imported.close()
  expect(await readFile(join(destination, 'strategies.json'), 'utf8')).toContain('strategy-1')
  expect(await readFile(join(destination, 'seedNotes.json'), 'utf8')).toContain('note-123')
  expect(await readFile(join(destination, 'media', 'avatars', 'avatar.txt'), 'utf8')).toBe('avatar')
  expect(await readFile(join(source, 'backend', 'strategy', 'data', 'strategies.json'), 'utf8')).toContain('strategy-1')
  await expect(importLegacyInvestment(source, destination)).rejects.toThrow('已存在')

  await rename(destination, join(root, 'rollback-copy'))
  await importLegacyInvestment(source, destination)
  const restored = new DatabaseSync(join(destination, 'investment.sqlite3'), { readOnly: true })
  expect(restored.prepare('SELECT id FROM notes').get()).toEqual({ id: 'note-123' })
  restored.close()
})

test('backs up the investment database and user files for restore', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lexicon-investment-backup-'))
  temporaryDirectories.push(root)
  process.env.LEXICON_TEST_USER_DATA = root
  const data = join(root, 'investment')
  await mkdir(join(data, 'media'), { recursive: true })
  const database = new DatabaseSync(join(data, 'investment.sqlite3'))
  database.exec("CREATE TABLE orders (id TEXT PRIMARY KEY); INSERT INTO orders VALUES ('order-123')")
  database.close()
  await writeFile(join(data, 'strategies.json'), '[{"id":"strategy-1"}]')
  await writeFile(join(data, 'media', 'image.txt'), 'image')
  await writeFile(join(data, 'credentials.json'), 'local secret')
  const { backupInvestmentData } = await import('./investmentService')
  const path = await backupInvestmentData(join(root, 'backups'))
  expect(path).toBeTruthy()
  const saved = new DatabaseSync(join(path!, 'investment.sqlite3'), { readOnly: true })
  expect(saved.prepare('SELECT id FROM orders').get()).toEqual({ id: 'order-123' })
  saved.close()
  expect(await readFile(join(path!, 'strategies.json'), 'utf8')).toContain('strategy-1')
  expect(await readFile(join(path!, 'media', 'image.txt'), 'utf8')).toBe('image')
  expect(await readFile(join(path!, 'credentials.json'), 'utf8')).toBe('local secret')
})

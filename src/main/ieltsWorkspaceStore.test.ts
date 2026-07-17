import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { IeltsWorkspaceStore } from './ieltsWorkspaceStore'

describe('IeltsWorkspaceStore', () => {
  it('creates a complete SQLite backup file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'lexicon-backup-test-'))
    const store = new IeltsWorkspaceStore(directory)

    try {
      store.save({ notes: 'backup me', directions: [] })
      const backupPath = await store.backupTo(join(directory, 'backups'))

      expect((await readFile(backupPath)).subarray(0, 16).toString()).toBe('SQLite format 3\u0000')
    } finally {
      store.close()
      await rm(directory, { recursive: true, force: true })
    }
  })
})

import { backup, DatabaseSync } from 'node:sqlite'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export type StudyDirection = {
  id: number
  title: string
  focus: string
  status: 'planning' | 'active' | 'done'
}

export type IeltsWorkspace = {
  notes: string
  directions: StudyDirection[]
}

export class IeltsWorkspaceStore {
  private readonly database: DatabaseSync

  constructor(userDataPath: string) {
    this.database = new DatabaseSync(join(userDataPath, 'lexicon.sqlite'))
    this.migrate()
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
      INSERT INTO schema_version (version) SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM schema_version);
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS ielts_workspace (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        notes TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS study_directions (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        focus TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'done')),
        sort_order INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
    this.database.prepare('UPDATE schema_version SET version = 1 WHERE version < 1').run()
  }

  load(initialWorkspace: IeltsWorkspace): IeltsWorkspace {
    const hasWorkspace = this.database.prepare('SELECT 1 FROM ielts_workspace WHERE id = 1').get()
    if (!hasWorkspace) {
      this.save(initialWorkspace)
    }

    const notes = this.database.prepare('SELECT notes FROM ielts_workspace WHERE id = 1').get() as { notes: string }
    const directions = this.database.prepare(
      'SELECT id, title, focus, status FROM study_directions ORDER BY sort_order ASC'
    ).all() as StudyDirection[]
    return { notes: notes.notes, directions }
  }

  saveNotes(notes: string): void {
    this.database.prepare(`
      INSERT INTO ielts_workspace (id, notes) VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET notes = excluded.notes
    `).run(notes)
  }

  saveDirections(directions: StudyDirection[]): void {
    this.inTransaction(() => this.replaceDirections(directions))
  }

  save(workspace: IeltsWorkspace): void {
    this.inTransaction(() => {
      this.saveNotes(workspace.notes)
      this.replaceDirections(workspace.directions)
    })
  }

  getSetting(key: string): string | undefined {
    const row = this.database.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value
  }

  setSetting(key: string, value: string): void {
    this.database.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value)
  }

  async backupTo(directory: string): Promise<string> {
    await mkdir(directory, { recursive: true })
    const backupPath = join(directory, `lexicon-backup-${formatBackupTimestamp(new Date())}.sqlite`)
    await backup(this.database, backupPath)
    return backupPath
  }

  close(): void {
    this.database.close()
  }

  private replaceDirections(directions: StudyDirection[]): void {
    this.database.prepare('DELETE FROM study_directions').run()
    const insert = this.database.prepare(`
      INSERT INTO study_directions (id, title, focus, status, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `)
    directions.forEach((direction, index) => {
      insert.run(direction.id, direction.title, direction.focus, direction.status, index)
    })
  }

  private inTransaction(action: () => void): void {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      action()
      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }
}

function formatBackupTimestamp(date: Date): string {
  const part = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}-${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`
}

/**
 * Vite plugin: virtual module `virtual:project-tree`
 *
 * Scans the repository root at dev-server start / build time and exposes the
 * file tree as a JSON structure.  In dev mode the tree is regenerated whenever
 * files are added / removed (via HMR invalidation).
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  children?: TreeNode[]
}

const VIRTUAL_ID = 'virtual:project-tree'
const RESOLVED_ID = '\0' + VIRTUAL_ID

// Directories and patterns to skip
const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  '__pycache__',
  '.vscode',
  '.idea',
  'venv',
  '.env',
  '.DS_Store',
  'Thumbs.db',
])

function shouldIgnore(name: string): boolean {
  if (IGNORE.has(name)) return true
  if (name.endsWith('.pfx')) return true
  if (name.endsWith('.pyc')) return true
  if (name.startsWith('.') && name !== '.gitignore') return true
  return false
}

function scanDir(dirPath: string, depth = 0, maxDepth = 6): TreeNode[] {
  if (depth > maxDepth) return []

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return []
  }

  const nodes: TreeNode[] = []

  // Sort: directories first, then files, both alphabetically
  const sorted = entries
    .filter((e) => !shouldIgnore(e.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1
      if (!a.isDirectory() && b.isDirectory()) return 1
      return a.name.localeCompare(b.name)
    })

  for (const entry of sorted) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: 'directory',
        children: scanDir(fullPath, depth + 1, maxDepth),
      })
    } else {
      nodes.push({ name: entry.name, type: 'file' })
    }
  }

  return nodes
}

export default function projectTreePlugin(): Plugin {
  // Go two levels up from frontend/ to repo root
  let repoRoot = ''

  return {
    name: 'project-tree',

    configResolved(config) {
      repoRoot = path.resolve(config.root, '..')
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      const tree = scanDir(repoRoot)
      return `export default ${JSON.stringify(tree)}`
    },

    // In dev mode, invalidate the virtual module when files change
    handleHotUpdate({ file, server }) {
      // Only trigger for file additions/removals in the project
      if (file.startsWith(repoRoot)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }
    },
  }
}

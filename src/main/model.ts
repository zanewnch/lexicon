import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { access, mkdir, rename, rm, stat, statfs } from 'node:fs/promises'
import { join } from 'node:path'
import type { WebContents } from 'electron'

export const MODEL_REPOSITORY = 'unsloth/gemma-4-E2B-it-GGUF'
export const MODEL_FILENAME = 'gemma-4-E2B-it-UD-IQ2_M.gguf'
export const MODEL_DOWNLOAD_URL = `https://huggingface.co/${MODEL_REPOSITORY}/resolve/main/${MODEL_FILENAME}?download=true`
const MODEL_TREE_URL = `https://huggingface.co/api/models/${MODEL_REPOSITORY}/tree/main`

export type ModelStatus = {
  exists: boolean
  filename: string
  path: string
  size: number
  expectedSize: number | null
  state: 'missing' | 'ready' | 'downloading' | 'verifying' | 'error'
  message?: string
}

export type DownloadProgress = {
  received: number
  total: number
  percent: number
}

type HuggingFaceFile = {
  path?: string
  size?: number
  lfs?: { sha256?: string; oid?: string; size?: number }
}

let activeDownload: Promise<ModelStatus> | undefined

export function getModelDirectory(appDataPath: string): string {
  return join(appDataPath, 'Lexicon', 'models')
}

export function getModelPath(appDataPath: string): string {
  return join(getModelDirectory(appDataPath), MODEL_FILENAME)
}

export async function getModelStatus(appDataPath: string): Promise<ModelStatus> {
  const modelPath = getModelPath(appDataPath)

  try {
    const file = await stat(modelPath)
    return {
      exists: true,
      filename: MODEL_FILENAME,
      path: modelPath,
      size: file.size,
      expectedSize: file.size,
      state: 'ready'
    }
  } catch {
    return {
      exists: false,
      filename: MODEL_FILENAME,
      path: modelPath,
      size: 0,
      expectedSize: null,
      state: 'missing'
    }
  }
}

async function getRemoteFileInfo(): Promise<{ size: number; sha256: string }> {
  const response = await fetch(MODEL_TREE_URL)
  if (!response.ok) {
    throw new Error(`Hugging Face metadata request failed (${response.status})`)
  }

  const files = (await response.json()) as HuggingFaceFile[]
  const file = files.find((candidate) => candidate.path === MODEL_FILENAME)
  const sha256 = file?.lfs?.sha256 ?? file?.lfs?.oid
  const size = file?.size ?? file?.lfs?.size

  if (!sha256 || !size) {
    throw new Error('Hugging Face metadata did not include the model size and SHA256')
  }

  return { size, sha256 }
}

async function ensureEnoughDiskSpace(directory: string, expectedSize: number): Promise<void> {
  try {
    const filesystem = await statfs(directory)
    const available = Number(filesystem.bavail) * Number(filesystem.bsize)
    const required = Math.ceil(expectedSize * 1.1)

    if (available < required) {
      throw new Error(`Not enough disk space (need about ${formatBytes(required)})`)
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Not enough disk space')) {
      throw error
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  return `${bytes} bytes`
}

function notifyProgress(contents: WebContents | undefined, progress: DownloadProgress): void {
  if (contents && !contents.isDestroyed()) {
    contents.send('model:download-progress', progress)
  }
}

async function downloadModelInternal(appDataPath: string, contents?: WebContents): Promise<ModelStatus> {
  const modelDirectory = getModelDirectory(appDataPath)
  const modelPath = getModelPath(appDataPath)
  const temporaryPath = `${modelPath}.download`
  await mkdir(modelDirectory, { recursive: true })

  const existing = await getModelStatus(appDataPath)
  if (existing.exists) return existing

  const remote = await getRemoteFileInfo()
  await ensureEnoughDiskSpace(modelDirectory, remote.size)

  const response = await fetch(MODEL_DOWNLOAD_URL)
  if (!response.ok || !response.body) {
    throw new Error(`Model download failed (${response.status})`)
  }

  let received = 0
  const hash = createHash('sha256')
  const reader = response.body.getReader()
  const output = createWriteStream(temporaryPath)

  try {
    notifyProgress(contents, { received: 0, total: remote.size, percent: 0 })

    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break

      received += chunk.value.byteLength
      hash.update(chunk.value)
      if (!output.write(chunk.value)) {
        await new Promise<void>((resolve) => output.once('drain', resolve))
      }

      notifyProgress(contents, {
        received,
        total: remote.size,
        percent: Math.min(100, Math.round((received / remote.size) * 100))
      })
    }

    await new Promise<void>((resolve, reject) => {
      output.once('error', reject)
      output.end(() => resolve())
    })
  } catch (error) {
    output.destroy()
    await rm(temporaryPath, { force: true })
    throw error
  }

  if (received !== remote.size) {
    await rm(temporaryPath, { force: true })
    throw new Error(`Model download was incomplete (${formatBytes(received)} of ${formatBytes(remote.size)})`)
  }

  if (contents && !contents.isDestroyed()) contents.send('model:download-state', 'verifying')
  const actualSha256 = hash.digest('hex')
  if (actualSha256.toLowerCase() !== remote.sha256.toLowerCase()) {
    await rm(temporaryPath, { force: true })
    throw new Error('Model SHA256 verification failed')
  }

  await rename(temporaryPath, modelPath)
  return {
    exists: true,
    filename: MODEL_FILENAME,
    path: modelPath,
    size: remote.size,
    expectedSize: remote.size,
    state: 'ready'
  }
}

export function downloadModel(appDataPath: string, contents?: WebContents): Promise<ModelStatus> {
  if (!activeDownload) {
    activeDownload = downloadModelInternal(appDataPath, contents).finally(() => {
      activeDownload = undefined
    })
  }

  return activeDownload
}

export async function modelExists(appDataPath: string): Promise<boolean> {
  try {
    await access(getModelPath(appDataPath))
    return true
  } catch {
    return false
  }
}

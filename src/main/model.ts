import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { access, mkdir, readdir, rename, rm, stat, statfs } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { WebContents } from 'electron'

export type CuratedModel = {
  id: string
  label: string
  description: string
  repository: string
  filename: string
}

export const CURATED_MODELS: readonly CuratedModel[] = [
  { id: 'gemma-4-e2b', label: 'Gemma 4 E2B', description: '建議使用 · 較快 · 約 2.29 GB', repository: 'unsloth/gemma-4-E2B-it-GGUF', filename: 'gemma-4-E2B-it-UD-IQ2_M.gguf' },
  { id: 'llama-3.2-3b', label: 'Llama 3.2 3B', description: '替代選擇 · 約 2 GB', repository: 'bartowski/Llama-3.2-3B-Instruct-GGUF', filename: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf' },
  { id: 'llama-3.1-8b', label: 'Llama 3.1 8B', description: '較佳品質 · 建議 8 GB 以上記憶體 · 約 5 GB', repository: 'bartowski/Meta-Llama-3.1-8B-Instruct-GGUF', filename: 'Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf' }
]

export const DEFAULT_MODEL = CURATED_MODELS[0]
export const MODEL_REPOSITORY = DEFAULT_MODEL.repository
export const MODEL_FILENAME = DEFAULT_MODEL.filename
export const MODEL_DOWNLOAD_URL = getModelDownloadUrl(DEFAULT_MODEL)

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

export type InstalledModel = { filename: string; path: string; size: number; modifiedAt: number }
export type HuggingFaceModel = { id: string; downloads: number; likes: number; updatedAt?: string }
export type HuggingFaceGgufFile = { filename: string; size: number; sha256?: string }
export type ModelDownloadRequest =
  | { kind: 'curated'; id: string }
  | { kind: 'huggingface'; repository: string; filename: string }
  | { kind: 'custom'; url: string }

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
  return getModelPathForFilename(appDataPath, MODEL_FILENAME)
}

type HuggingFaceModelResponse = {
  id?: string
  modelId?: string
  downloads?: number
  likes?: number
  lastModified?: string
}

export async function searchHuggingFaceModels(query: string): Promise<HuggingFaceModel[]> {
  const search = query.trim()
  if (!search) return []
  const url = new URL('https://huggingface.co/api/models')
  url.searchParams.set('search', search)
  url.searchParams.set('filter', 'gguf')
  url.searchParams.set('sort', 'downloads')
  url.searchParams.set('direction', '-1')
  url.searchParams.set('limit', '20')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Hugging Face 搜尋失敗 (${response.status})`)
  const values = await response.json() as HuggingFaceModelResponse[]
  return values
    .map((model) => ({ id: model.id ?? model.modelId ?? '', downloads: model.downloads ?? 0, likes: model.likes ?? 0, updatedAt: model.lastModified }))
    .filter((model) => isRepositoryName(model.id))
}

export async function listHuggingFaceGgufFiles(repository: string): Promise<HuggingFaceGgufFile[]> {
  if (!isRepositoryName(repository)) throw new Error('Hugging Face 模型名稱格式不正確')
  const response = await fetch(getModelTreeUrl({ repository }))
  if (!response.ok) throw new Error(`無法讀取模型檔案清單 (${response.status})`)
  const files = await response.json() as HuggingFaceFile[]
  return files
    .filter((file) => typeof file.path === 'string' && file.path.toLowerCase().endsWith('.gguf') && typeof (file.size ?? file.lfs?.size) === 'number')
    .map((file) => ({ filename: file.path as string, size: file.size ?? file.lfs?.size ?? 0, sha256: file.lfs?.sha256 ?? file.lfs?.oid }))
    .sort((left, right) => left.size - right.size || left.filename.localeCompare(right.filename))
}

export function getModelPathForFilename(appDataPath: string, filename: string): string {
  return join(getModelDirectory(appDataPath), filename)
}

export async function listInstalledModels(appDataPath: string): Promise<InstalledModel[]> {
  const directory = getModelDirectory(appDataPath)
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const models = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.gguf'))
      .map(async (entry) => {
        const file = await stat(join(directory, entry.name))
        return { filename: entry.name, path: join(directory, entry.name), size: file.size, modifiedAt: Math.round(file.mtimeMs) }
      }))
    return models.sort((left, right) => left.filename.localeCompare(right.filename))
  } catch {
    return []
  }
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

function getModelDownloadUrl(model: Pick<CuratedModel, 'repository' | 'filename'>): string {
  return `https://huggingface.co/${model.repository}/resolve/main/${model.filename}?download=true`
}

function getModelTreeUrl(model: Pick<CuratedModel, 'repository'>): string {
  return `https://huggingface.co/api/models/${model.repository}/tree/main?recursive=true`
}

async function getRemoteFileInfo(model: Pick<CuratedModel, 'repository' | 'filename'>): Promise<{ size: number; sha256: string }> {
  const response = await fetch(getModelTreeUrl(model))
  if (!response.ok) {
    throw new Error(`Hugging Face metadata request failed (${response.status})`)
  }

  const files = (await response.json()) as HuggingFaceFile[]
  const file = files.find((candidate) => candidate.path === model.filename)
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

function resolveDownload(request: ModelDownloadRequest | undefined): { filename: string; url: string; verified?: Pick<CuratedModel, 'repository' | 'filename'> } {
  if (!request || request.kind === 'curated') {
    const requestedId = request?.kind === 'curated' ? request.id : undefined
    const model = CURATED_MODELS.find((candidate) => candidate.id === requestedId) ?? DEFAULT_MODEL
    return { filename: model.filename, url: getModelDownloadUrl(model), verified: model }
  }

  if (request.kind === 'huggingface') {
    if (!isRepositoryName(request.repository) || !isRepositoryFilename(request.filename)) throw new Error('Hugging Face 模型檔案格式不正確')
    return { filename: basename(request.filename), url: getModelDownloadUrl({ repository: request.repository, filename: request.filename }), verified: request }
  }

  let parsed: URL
  try { parsed = new URL(request.url) } catch { throw new Error('自訂模型網址格式不正確') }
  if (parsed.protocol !== 'https:' || !parsed.pathname.toLowerCase().endsWith('.gguf')) {
    throw new Error('請輸入 HTTPS 的 .gguf 直連網址')
  }
  const filename = basename(decodeURIComponent(parsed.pathname))
  if (!filename || filename === '.' || filename === '..') throw new Error('無法判斷模型檔名')
  return { filename, url: parsed.toString() }
}

async function downloadModelInternal(appDataPath: string, request?: ModelDownloadRequest, contents?: WebContents): Promise<ModelStatus> {
  const source = resolveDownload(request)
  const modelDirectory = getModelDirectory(appDataPath)
  const modelPath = getModelPathForFilename(appDataPath, source.filename)
  const temporaryPath = `${modelPath}.download`
  await mkdir(modelDirectory, { recursive: true })

  try {
    const existing = await stat(modelPath)
    return { exists: true, filename: source.filename, path: modelPath, size: existing.size, expectedSize: existing.size, state: 'ready' }
  } catch { /* download below */ }

  const remote = source.verified ? await getRemoteFileInfo(source.verified) : undefined
  if (remote) await ensureEnoughDiskSpace(modelDirectory, remote.size)

  const response = await fetch(source.url)
  if (!response.ok || !response.body) {
    throw new Error(`Model download failed (${response.status})`)
  }

  let received = 0
  const hash = createHash('sha256')
  const reader = response.body.getReader()
  const output = createWriteStream(temporaryPath)

  try {
    const total = remote?.size ?? Number(response.headers.get('content-length'))
    notifyProgress(contents, { received: 0, total: Number.isFinite(total) ? total : 0, percent: 0 })

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
        total: Number.isFinite(total) ? total : 0,
        percent: Number.isFinite(total) && total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0
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

  if (remote && received !== remote.size) {
    await rm(temporaryPath, { force: true })
    throw new Error(`Model download was incomplete (${formatBytes(received)} of ${formatBytes(remote.size)})`)
  }

  const actualSha256 = hash.digest('hex')
  if (remote) {
    if (contents && !contents.isDestroyed()) contents.send('model:download-state', 'verifying')
    if (actualSha256.toLowerCase() !== remote.sha256.toLowerCase()) {
      await rm(temporaryPath, { force: true })
      throw new Error('Model SHA256 verification failed')
    }
  }

  await rename(temporaryPath, modelPath)
  return {
    exists: true,
    filename: source.filename,
    path: modelPath,
    size: received,
    expectedSize: remote?.size ?? null,
    state: 'ready'
  }
}

export function downloadModel(appDataPath: string, request?: ModelDownloadRequest, contents?: WebContents): Promise<ModelStatus> {
  if (!activeDownload) {
    activeDownload = downloadModelInternal(appDataPath, request, contents).finally(() => {
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

function isRepositoryName(value: string): boolean {
  return /^[\w.-]+\/[\w.-]+$/.test(value)
}

function isRepositoryFilename(value: string): boolean {
  return value.length > 0 && value.length <= 500 && value.toLowerCase().endsWith('.gguf') && !value.split('/').some((part) => part === '..' || !part)
}

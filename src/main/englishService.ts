import { createServer, type Server, type ServerResponse } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'

export type EnglishSender = { send(channel: string, data?: unknown): void; isDestroyed(): boolean }
export type EnglishContext = { sender: EnglishSender }
type Operation = (context: EnglishContext, ...args: any[]) => unknown
const operations = new Map<string, Operation>()
const clients = new Set<ServerResponse>()
const snapshot = new Map<string, unknown>()
let server: Server | undefined
let connection: { url: string; token: string } | undefined

export function registerEnglishOperation(name: string, handler: Operation): void {
  if (operations.has(name)) throw new Error(`Duplicate English operation: ${name}`)
  operations.set(name, handler)
}

export function invokeEnglishOperation(name: string, context: EnglishContext, args: unknown[]): unknown {
  const handler = operations.get(name)
  if (!handler) throw new Error('不支援的英文操作')
  return handler(context, ...args)
}

export function publishEnglishEvent(channel: string, data?: unknown): void {
  if (channel === 'youtube:transcript-open') {
    snapshot.delete('youtube:transcript-error')
    snapshot.delete('youtube:transcript-progress')
    snapshot.delete('youtube:player-position')
    snapshot.set(channel, structuredClone(data))
  } else if (channel === 'youtube:transcript-segment') {
    const update = data as { videoId: string; segmentId: string; translation: string }
    const transcript = snapshot.get('youtube:transcript-open') as { videoId: string; segments: Array<{ id: string; translation?: string }> } | undefined
    if (transcript?.videoId === update.videoId) {
      const segment = transcript.segments.find((item) => item.id === update.segmentId)
      if (segment) segment.translation = update.translation
    }
  } else snapshot.set(channel, data ?? null)
  const message = `data: ${JSON.stringify({ channel, data: data ?? null })}\n\n`
  for (const client of clients) {
    if (!client.write(message)) { client.destroy(); clients.delete(client) }
  }
}

export function getEnglishConnection(): { url: string; token: string } | undefined { return connection }

export async function startEnglishService(): Promise<void> {
  if (server) return
  const token = randomBytes(32).toString('hex')
  server = createServer(async (request, response) => {
    const supplied = request.headers.authorization?.replace(/^Bearer /, '') ?? ''
    if (Buffer.byteLength(supplied) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) {
      response.writeHead(401).end(); return
    }
    if (request.method === 'GET' && request.url === '/events') {
      response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' })
      response.write(': connected\n\n')
      for (const [channel, data] of snapshot) response.write(`data: ${JSON.stringify({ channel, data })}\n\n`)
      clients.add(response)
      const heartbeat = setInterval(() => response.write(': heartbeat\n\n'), 15000)
      request.on('close', () => { clearInterval(heartbeat); clients.delete(response) })
      return
    }
    if (request.method !== 'POST' || request.url !== '/rpc') { response.writeHead(404).end(); return }
    try {
      const chunks: Buffer[] = []; let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > 256 * 1024) { response.writeHead(413).end(); return }
        chunks.push(chunk)
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { operation?: unknown; args?: unknown }
      if (typeof body.operation !== 'string' || !Array.isArray(body.args) || body.args.length > 6 || !operations.has(body.operation)) {
        response.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: '不支援的英文操作' })); return
      }
      const result = await invokeEnglishOperation(body.operation, { sender: { send: publishEnglishEvent, isDestroyed: () => false } }, body.args)
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ result: result ?? null }))
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: error instanceof Error ? error.message : '英文服務操作失敗' }))
    }
  })
  await new Promise<void>((resolve, reject) => {
    server!.once('error', reject)
    server!.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('English service has no local port')
  connection = { url: `http://127.0.0.1:${address.port}`, token }
}

export function stopEnglishService(): void {
  for (const client of clients) client.end()
  clients.clear()
  server?.closeAllConnections()
  server?.close()
  server = undefined; connection = undefined; snapshot.clear()
}

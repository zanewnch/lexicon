export type NewsArticle = {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  description: string
}

const GOOGLE_NEWS_RSS = 'https://news.google.com/rss'

export async function searchNews(query: string): Promise<NewsArticle[]> {
  const normalizedQuery = query.trim()
  const url = new URL(normalizedQuery ? `${GOOGLE_NEWS_RSS}/search` : GOOGLE_NEWS_RSS)
  if (normalizedQuery) url.searchParams.set('q', normalizedQuery)
  url.searchParams.set('hl', 'zh-TW')
  url.searchParams.set('gl', 'TW')
  url.searchParams.set('ceid', 'TW:zh-Hant')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Lexicon/0.1 news reader' }
    })
    if (!response.ok) throw new Error(`新聞來源暫時無法使用（${response.status}）`)
    return parseNewsRss(await response.text()).slice(0, 20)
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw new Error('搜尋新聞逾時，請確認網路後再試')
    throw error instanceof Error ? error : new Error('無法取得新聞')
  } finally {
    clearTimeout(timeout)
  }
}

export function parseNewsRss(xml: string): NewsArticle[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? []
  return items.map((item, index) => {
    const title = readTag(item, 'title')
    const url = readTag(item, 'link')
    if (!title || !isSafeArticleUrl(url)) return undefined
    return {
      id: `${url}-${index}`,
      title,
      url,
      source: readTag(item, 'source') || '未知來源',
      publishedAt: readTag(item, 'pubDate'),
      description: readTag(item, 'description')
    }
  }).filter((article): article is NewsArticle => article !== undefined)
}

export function isSafeArticleUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function readTag(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return ''
  return decodeXml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

import { describe, expect, it } from 'vitest'
import { isSafeArticleUrl, parseNewsRss } from './news'

describe('parseNewsRss', () => {
  it('extracts an article and decodes RSS text', () => {
    const articles = parseNewsRss(`<?xml version="1.0"?><rss><channel><item>
      <title><![CDATA[AI &amp; news]]></title>
      <link>https://news.example.com/story</link>
      <pubDate>Thu, 17 Jul 2026 08:00:00 GMT</pubDate>
      <source>Example News</source>
      <description><![CDATA[An &lt;b&gt;important&lt;/b&gt; update.]]></description>
    </item></channel></rss>`)

    expect(articles).toEqual([{
      id: 'https://news.example.com/story-0',
      title: 'AI & news',
      url: 'https://news.example.com/story',
      source: 'Example News',
      publishedAt: 'Thu, 17 Jul 2026 08:00:00 GMT',
      description: 'An important update.'
    }])
  })

  it('does not return unsafe links', () => {
    expect(isSafeArticleUrl('https://example.com')).toBe(true)
    expect(isSafeArticleUrl('http://example.com')).toBe(false)
    expect(isSafeArticleUrl('javascript:alert(1)')).toBe(false)
    expect(parseNewsRss('<item><title>bad</title><link>javascript:alert(1)</link></item>')).toEqual([])
  })
})

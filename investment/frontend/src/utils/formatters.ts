/**
 * 交易平台共用格式化工具函式。
 *
 * 取代原本分散在 7+ 個 view 的重複格式化函式，
 * 包含貨幣、符號、百分比、大數字四種顯示用途。
 */

/**
 * 將數字格式化為台灣千位分隔的貨幣字串。
 * @param val - 要格式化的數字
 * @returns 例如 `1,234,567`
 * @example formatCurrency(1234567) // → "1,234,567"
 */
export function formatCurrency(val: number): string {
  return val.toLocaleString('zh-TW')
}

/**
 * 格式化數字並加上正號前綴（正數才加 `+`）。
 * @param val - 要格式化的數字（可為正或負）
 * @returns 例如 `+100` 或 `-200`
 * @example formatSign(100)  // → "+100"
 * @example formatSign(-200) // → "-200"
 */
export function formatSign(val: number): string {
  return val > 0 ? `+${val.toLocaleString('zh-TW')}` : val.toLocaleString('zh-TW')
}

/**
 * 格式化百分比，正數自動加 `+`，固定兩位小數。
 * @param val - 百分比數字（例如 2.5 代表 2.50%）
 * @returns 例如 `+2.50%` 或 `-1.23%`
 * @example formatPercent(2.5)  // → "+2.50%"
 * @example formatPercent(-1.2) // → "-1.20%"
 */
export function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}%`
}

/**
 * 將大數字縮寫為「兆 / 億 / 萬」單位，方便閱讀。
 *
 * 轉換規則：
 * - ≥ 1,000,000,000,000（兆）→ `X.X兆`
 * - ≥ 100,000,000（億）→ `X.X億`
 * - ≥ 10,000（萬）→ `X萬`
 * - 其餘 → 台灣千位格式
 *
 * @param val - 原始數字
 * @returns 縮寫後的字串
 * @example formatBigNumber(2500000000000) // → "2.5兆"
 * @example formatBigNumber(350000000)     // → "3.5億"
 * @example formatBigNumber(50000)         // → "5萬"
 */
export function formatBigNumber(val: number): string {
  if (val >= 1_000_000_000_000) return `${(val / 1_000_000_000_000).toFixed(1)}兆`
  if (val >= 100_000_000) return `${(val / 100_000_000).toFixed(1)}億`
  if (val >= 10_000) return `${(val / 10_000).toFixed(0)}萬`
  return val.toLocaleString('zh-TW')
}

/**
 * 根據目前排序欄位和方向，回傳對應的排序方向圖示。
 * 用於表格表頭顯示排序狀態。
 *
 * @param sortField - 目前排序中的欄位名稱
 * @param sortOrder - 目前排序方向（`'asc'` 或 `'desc'`）
 * @param field     - 此表頭對應的欄位名稱
 * @returns `'↓'`（降序）、`'↑'`（升序）、或 `'↕'`（未排序）
 * @example sortIcon('price', 'desc', 'price')  // → "↓"
 * @example sortIcon('price', 'asc',  'price')  // → "↑"
 * @example sortIcon('price', 'desc', 'volume') // → "↕"
 */
import type { SortOrder } from '@/types/common'

export function sortIcon(sortField: string, sortOrder: SortOrder, field: string): string {
  if (sortField !== field) return '↕'
  return sortOrder === 'desc' ? '↓' : '↑'
}

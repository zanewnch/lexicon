import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 台灣股市的交易階段（市場狀態）。
 * - `'pre-market'` — 盤前撮合（08:30 ~ 09:00）
 * - `'trading'` — 正式交易（09:00 ~ 13:30）
 * - `'after-hours'` — 盤後定價（14:00 ~ 14:30）
 * - `'closed'` — 休市（週末、假日、或盤後結束後）
 */
export type MarketPhase = 'pre-market' | 'trading' | 'after-hours' | 'closed'

/**
 * 市場狀態資訊的型別。
 */
interface MarketStatus {
  /** 目前交易階段 */
  phase: MarketPhase
  /** 人類可讀的狀態標籤（中文），如 `'開盤中'`、`'休市'` */
  label: string
  /** 下一個事件的描述，如 `'13:30 收盤'` */
  nextEvent: string
  /** 距離下一個事件的倒數計時，格式如 `'1天 18:23:05'` 或 `'4:14:30'` */
  countdown: string // always present, e.g. "1天 18:23:05" or "4:14:30"
}

/**
 * 2026 年台灣國定假日和特定休市日（格式 `'MM-DD'`）。
 * 用於判斷某天是否為休市日。
 */
const HOLIDAYS_2026 = [
  '01-01', '01-02',
  '01-26', '01-27', '01-28', '01-29', '01-30',
  '02-02',
  '02-28',
  '04-03', '04-04', '04-05', '04-06',
  '05-01',
  '05-31',
  '10-06',
  '10-10',
]

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

/**
 * 取得目前台灣時間（UTC+8）的 Date 物件。
 * 不依賴系統時區設定，適合在任何時區的設備上使用。
 * @returns 台灣時間的 Date 物件
 */
function getTaiwanNow(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 8 * 3600000)
}

/**
 * 判斷指定日期是否為台灣國定假日。
 * @param date - 台灣時間的 Date 物件
 * @returns 是假日回傳 `true`
 */
function isHoliday(date: Date): boolean {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return HOLIDAYS_2026.includes(`${mm}-${dd}`)
}

/**
 * 判斷指定日期是否為台股交易日（非週末且非假日）。
 * @param date - 台灣時間的 Date 物件
 * @returns 是交易日回傳 `true`
 */
function isTradingDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  return !isHoliday(date)
}

/**
 * 找出下一個交易日的 09:00 開盤時間。
 * - 若今天是交易日且尚未到 09:00，回傳今天 09:00
 * - 否則往後找最近一個交易日（最多找 10 天，可處理長假）
 *
 * @param now - 台灣時間的目前時間
 * @returns 下一個交易日 09:00 的 Date 物件
 */
function getNextTradingOpen(now: Date): Date {
  const candidate = new Date(now)
  // If today is a trading day and we haven't passed 09:00, target is today
  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const OPEN = 9 * 3600
  if (isTradingDay(now) && sec < OPEN) {
    candidate.setHours(9, 0, 0, 0)
    return candidate
  }
  // Otherwise look forward
  candidate.setDate(candidate.getDate() + 1)
  candidate.setHours(9, 0, 0, 0)
  // Skip weekends and holidays (up to 10 days to handle long holidays)
  for (let i = 0; i < 10; i++) {
    if (isTradingDay(candidate)) return candidate
    candidate.setDate(candidate.getDate() + 1)
  }
  return candidate
}

/**
 * 將秒數格式化為倒數計時字串。
 * @param totalSec - 總秒數
 * @returns 格式化字串，如 `'2天 08:30:00'`、`'1:23:45'` 或 `'45:30'`
 */
function formatCountdown(totalSec: number): string {
  if (totalSec <= 0) return '00:00'
  const days = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (days > 0) return `${days}天 ${hh}:${mm}:${ss}`
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

/**
 * 格式化台灣日期字串（含星期）。
 * @param now - 台灣時間的 Date 物件
 * @returns 格式如 `'2026/04/06 週一'`
 */
function formatTaiwanDate(now: Date): string {
  const y = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const wd = WEEKDAYS[now.getDay()]
  return `${y}/${mm}/${dd} ${wd}`
}

/**
 * 根據台灣目前時間計算市場狀態。
 *
 * 各時段的判斷規則：
 * - 週末 / 假日：`closed`（休市）
 * - < 08:30：`closed`（休市）
 * - 08:30 ~ 09:00：`pre-market`（盤前撮合）
 * - 09:00 ~ 13:30：`trading`（開盤中）
 * - 13:30 ~ 14:00：`closed`（已收盤，等候盤後定價）
 * - 14:00 ~ 14:30：`after-hours`（盤後定價）
 * - > 14:30：`closed`（已收盤）
 *
 * @param now - 台灣時間的目前時間
 * @returns 市場狀態物件
 */
function getMarketStatus(now: Date): MarketStatus {
  const day = now.getDay()
  const isWeekend = day === 0 || day === 6
  const holiday = isHoliday(now)
  const closed = isWeekend || holiday

  const sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  const PRE_OPEN  = 8 * 3600 + 30 * 60  // 08:30
  const OPEN      = 9 * 3600             // 09:00
  const CLOSE     = 13 * 3600 + 30 * 60 // 13:30
  const AFT_OPEN  = 14 * 3600            // 14:00
  const AFT_CLOSE = 14 * 3600 + 30 * 60 // 14:30

  // Helper: countdown to next trading open
  function countdownToNextOpen(): string {
    const nextOpen = getNextTradingOpen(now)
    const diffSec = Math.floor((nextOpen.getTime() - now.getTime()) / 1000)
    return formatCountdown(diffSec)
  }

  function nextOpenLabel(): string {
    const nextOpen = getNextTradingOpen(now)
    const wd = WEEKDAYS[nextOpen.getDay()]
    // If it's tomorrow
    const diffDays = Math.floor((nextOpen.getTime() - now.getTime()) / 86400000)
    if (diffDays === 0) return '09:00 開盤'
    return `${wd} 09:00 開盤`
  }

  if (closed) {
    return {
      phase: 'closed',
      label: '休市',
      nextEvent: nextOpenLabel(),
      countdown: countdownToNextOpen(),
    }
  }

  if (sec < PRE_OPEN) {
    return {
      phase: 'closed',
      label: '休市',
      nextEvent: '08:30 盤前',
      countdown: formatCountdown(PRE_OPEN - sec),
    }
  }

  if (sec < OPEN) {
    return {
      phase: 'pre-market',
      label: '盤前撮合',
      nextEvent: '09:00 開盤',
      countdown: formatCountdown(OPEN - sec),
    }
  }

  if (sec < CLOSE) {
    return {
      phase: 'trading',
      label: '開盤中',
      nextEvent: '13:30 收盤',
      countdown: formatCountdown(CLOSE - sec),
    }
  }

  if (sec < AFT_OPEN) {
    return {
      phase: 'closed',
      label: '已收盤',
      nextEvent: '14:00 盤後定價',
      countdown: formatCountdown(AFT_OPEN - sec),
    }
  }

  if (sec < AFT_CLOSE) {
    return {
      phase: 'after-hours',
      label: '盤後定價',
      nextEvent: '14:30 結束',
      countdown: formatCountdown(AFT_CLOSE - sec),
    }
  }

  // After 14:30 — countdown to next trading day open
  return {
    phase: 'closed',
    label: '已收盤',
    nextEvent: nextOpenLabel(),
    countdown: countdownToNextOpen(),
  }
}

/**
 * 台股市場狀態追蹤 composable。
 *
 * 每秒更新一次，提供：
 * - 目前交易階段（盤前 / 開盤 / 盤後 / 休市）
 * - 倒數計時（距離下一個市場事件）
 * - 台灣日期字串（含星期）
 * - `isOpen` 計算屬性（是否在可互動時段）
 *
 * 元件卸載時自動清除計時器，不會有記憶體洩漏。
 *
 * @returns `{ status, isOpen, taiwanDate }`
 *
 * @example
 * ```vue
 * <script setup>
 * const { status, isOpen, taiwanDate } = useMarketStatus()
 * </script>
 * <template>
 *   <span>{{ status.label }}</span>           <!-- "開盤中" -->
 *   <span>{{ status.countdown }}</span>       <!-- "1:23:45" -->
 *   <span>{{ taiwanDate }}</span>             <!-- "2026/04/06 週一" -->
 * </template>
 * ```
 */
export function useMarketStatus() {
  /** 目前市場狀態（每秒更新） */
  const status = ref<MarketStatus>(getMarketStatus(getTaiwanNow()))
  /** 台灣日期字串，格式 `'YYYY/MM/DD 週X'` */
  const taiwanDate = ref(formatTaiwanDate(getTaiwanNow()))
  let timer: ReturnType<typeof setInterval> | null = null

  function update() {
    const now = getTaiwanNow()
    status.value = getMarketStatus(now)
    taiwanDate.value = formatTaiwanDate(now)
  }

  onMounted(() => {
    update()
    timer = setInterval(update, 1000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  /**
   * 是否處於可互動的市場時段（盤前 / 開盤中 / 盤後定價）。
   * 可用於控制下單按鈕的啟用狀態。
   */
  const isOpen = computed(() =>
    status.value.phase === 'trading' || status.value.phase === 'pre-market' || status.value.phase === 'after-hours'
  )

  return {
    status,
    isOpen,
    taiwanDate,
  }
}

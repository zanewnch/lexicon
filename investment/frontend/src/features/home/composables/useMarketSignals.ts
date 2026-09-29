import { computed, type Ref } from 'vue'
import type { MarketIndex, MarketSignal } from '@/types/market'

/**
 * 解析百分比字串（如 `'+1.23%'` 或 `'-0.56%'`）為數字。
 * @param str - 含 `+`、`%` 等符號的百分比字串
 * @returns 對應的數字，無法解析時回傳 `0`
 */
function parsePercent(str: string): number {
  const n = parseFloat(str.replace(/[+%]/g, ''))
  return isNaN(n) ? 0 : n
}

/**
 * 解析含千位分隔符的數值字串（如 `'21,234'`）為數字。
 * @param str - 含逗號的數值字串
 * @returns 對應的數字，無法解析時回傳 `0`
 */
function parseValue(str: string): number {
  const n = parseFloat(str.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

/**
 * 從指數清單中依名稱找出指定指數。
 * @param indices - 指數清單
 * @param name    - 指數名稱（如 `'加權指數'`）
 * @returns 找到的指數物件，找不到回傳 `undefined`
 */
function findIndex(indices: MarketIndex[], name: string): MarketIndex | undefined {
  return indices.find(i => i.name === name)
}

/**
 * 計算兩個百分比的差距，回傳絕對值字串（固定兩位小數）。
 * 用於描述類股「領先大盤 X 個百分點」的文案。
 * @param a - 第一個百分比數字
 * @param b - 第二個百分比數字
 * @returns 差距的絕對值，格式 `'X.XX'`
 */
function pctGap(a: number, b: number): string {
  return Math.abs(a - b).toFixed(2)
}

/**
 * 大盤市場信號分析 composable。
 *
 * 根據各大指數的即時漲跌幅，自動生成「市場訊號」（MarketSignal）清單，
 * 幫助使用者快速理解市場狀況，不需要自己解讀各指數數字。
 *
 * ### 分析維度（共 6 大類）
 *
 * **A. 大盤趨勢**
 * - 漲幅 ≥ 1.5%：大盤強勢上漲
 * - 跌幅 ≥ 1.5%：大盤大幅下跌
 * - 漲跌 0.5%~1.5%：溫和多 / 空
 * - 漲跌 < 0.1%：盤整
 *
 * **B. 類股領漲**
 * - 電子股、半導體、金融股各自領漲大盤 >0.5%
 *
 * **C. 類股拖累**
 * - 電子股、金融股跌幅超過大盤 >1%
 *
 * **D. 板塊分化**
 * - 電子和金融走勢相反（科技 vs 傳產資金輪動）
 *
 * **E. 櫃買背離**
 * - 加權和櫃買指數方向相反（大型股 vs 中小型股）
 *
 * **F. 期現貨價差**
 * - 台指期和現貨相差 >50 點（正 / 逆價差）
 *
 * @param indices - 大盤指數資料的 Ref（通常來自 `useHomeData().indices`）
 * @returns `{ signals }` — 計算出的市場信號清單（computed）
 */
export function useMarketSignals(indices: Ref<MarketIndex[]>) {
  const signals = computed<MarketSignal[]>(() => {
    const list = indices.value
    if (!list.length) return []

    const result: MarketSignal[] = []

    const taiex = findIndex(list, '加權指數')
    const otc = findIndex(list, '櫃買指數')
    const finance = findIndex(list, '金融類指數')
    const electronics = findIndex(list, '電子類指數')
    const semi = findIndex(list, '半導體類指數')
    const futures = findIndex(list, '台指近')

    const taiexPct = taiex ? parsePercent(taiex.percent) : 0
    const elecPct = electronics ? parsePercent(electronics.percent) : 0
    const finPct = finance ? parsePercent(finance.percent) : 0
    const semiPct = semi ? parsePercent(semi.percent) : 0
    const otcPct = otc ? parsePercent(otc.percent) : 0

    // ── A. 大盤趨勢 ──
    if (taiex) {
      if (taiexPct >= 1.5) {
        result.push({
          id: 'big-rally',
          label: '大盤強勢上漲',
          description: `加權指數今日上漲 ${taiex.change}（${taiex.percent}），漲幅超過 1.5%，代表市場買氣強勁，多方明顯佔優勢`,
          severity: 'up',
        })
      } else if (taiexPct <= -1.5) {
        result.push({
          id: 'big-drop',
          label: '大盤大幅下跌',
          description: `加權指數今日下跌 ${taiex.change}（${taiex.percent}），跌幅超過 1.5%，代表市場恐慌賣壓湧現，空方主導盤勢`,
          severity: 'down',
        })
      } else if (taiexPct >= 0.5) {
        result.push({
          id: 'mild-rally',
          label: '大盤溫和上漲',
          description: `加權指數上漲 ${taiex.change}（${taiex.percent}），屬於正常的偏多走勢，市場氣氛穩定樂觀`,
          severity: 'up',
        })
      } else if (taiexPct <= -0.5) {
        result.push({
          id: 'mild-drop',
          label: '大盤走弱',
          description: `加權指數下跌 ${taiex.change}（${taiex.percent}），賣壓略大於買盤，市場氣氛偏保守`,
          severity: 'down',
        })
      } else if (Math.abs(taiexPct) <= 0.1) {
        result.push({
          id: 'consolidation',
          label: '大盤盤整',
          description: `加權指數變動僅 ${taiex.change}（${taiex.percent}），漲跌幅不到 0.1%，多空力道拉鋸，市場在等待方向`,
          severity: 'info',
        })
      }
    }

    // ── B. 類股領漲 ──
    if (electronics && taiex && electronics.up && elecPct > taiexPct + 0.5) {
      const gap = pctGap(elecPct, taiexPct)
      result.push({
        id: 'electronics-lead',
        label: '電子股領漲',
        description: `電子類指數 ${electronics.percent}，大盤 ${taiex.percent}，領先大盤 ${gap} 個百分點。電子佔台股超過 60% 權重，電子強勢代表主流資金正流入科技股`,
        severity: 'up',
      })
    }

    if (semi && taiex && semi.up && semiPct > taiexPct + 0.5) {
      const gap = pctGap(semiPct, taiexPct)
      result.push({
        id: 'semi-lead',
        label: '半導體領漲',
        description: `半導體類指數 ${semi.percent}，大盤 ${taiex.percent}，領先 ${gap} 個百分點。半導體是台股最具國際影響力的產業，通常由台積電等權值股帶動`,
        severity: 'up',
      })
    }

    if (finance && taiex && finance.up && finPct > taiexPct + 0.5) {
      const gap = pctGap(finPct, taiexPct)
      result.push({
        id: 'finance-lead',
        label: '金融股領漲',
        description: `金融類指數 ${finance.percent}，大盤 ${taiex.percent}，領先 ${gap} 個百分點。金融股走強通常與升息預期或壽險獲利改善有關`,
        severity: 'up',
      })
    }

    // ── C. 類股拖累 ──
    if (finance && taiex && !finance.up && finPct < taiexPct - 1.0) {
      const gap = pctGap(finPct, taiexPct)
      result.push({
        id: 'finance-drag',
        label: '金融股拖累',
        description: `金融類指數 ${finance.percent}，大盤 ${taiex.percent}，落後大盤 ${gap} 個百分點。金融股跌幅遠超大盤，可能受到利率政策、匯損或投資部位虧損影響`,
        severity: 'down',
      })
    }

    if (electronics && taiex && !electronics.up && elecPct < taiexPct - 1.0) {
      const gap = pctGap(elecPct, taiexPct)
      result.push({
        id: 'electronics-drag',
        label: '電子股拖累',
        description: `電子類指數 ${electronics.percent}，大盤 ${taiex.percent}，落後大盤 ${gap} 個百分點。電子佔大盤超過 60%，電子走弱會直接拖累加權指數`,
        severity: 'down',
      })
    }

    // ── D. 板塊分化 ──
    if (electronics && finance && electronics.up !== finance.up) {
      if (electronics.up) {
        result.push({
          id: 'tech-trad-split',
          label: '科技傳產分化',
          description: `電子類 ${electronics.percent} 上漲，金融類 ${finance.percent} 下跌，兩大板塊走勢相反。這代表資金正從傳產金融轉向科技股，通常出現在市場風格輪動的時候`,
          severity: 'warn',
        })
      } else {
        result.push({
          id: 'trad-tech-split',
          label: '傳產科技分化',
          description: `金融類 ${finance.percent} 上漲，電子類 ${electronics.percent} 下跌，兩大板塊走勢相反。資金從科技轉向傳產金融，可能反映市場偏好防禦性或高股息標的`,
          severity: 'warn',
        })
      }
    }

    // ── E. 櫃買背離 ──
    if (otc && taiex && otc.up !== taiex.up) {
      result.push({
        id: 'otc-diverge',
        label: '櫃買與大盤背離',
        description: `加權指數${taiex.up ? '上漲' : '下跌'} ${taiex.percent}，但櫃買指數${otc.up ? '上漲' : '下跌'} ${otc.percent}，兩者方向相反。加權反映大型股，櫃買反映中小型股，背離代表大型股和中小型股的資金流向不同`,
        severity: 'warn',
      })
    }

    // ── F. 期現貨價差 ──
    if (futures && taiex) {
      const futVal = parseValue(futures.value)
      const taiexVal = parseValue(taiex.value)
      const spread = futVal - taiexVal

      if (spread > 50) {
        result.push({
          id: 'futures-premium',
          label: '期貨正價差',
          description: `台指期 ${futures.value}，加權現貨 ${taiex.value}，期貨高於現貨 ${Math.round(spread)} 點。正價差代表期貨市場看多，法人預期後市上漲，願意付出溢價買進期貨`,
          severity: 'up',
        })
      } else if (spread < -50) {
        result.push({
          id: 'futures-discount',
          label: '期貨逆價差',
          description: `台指期 ${futures.value}，加權現貨 ${taiex.value}，期貨低於現貨 ${Math.round(Math.abs(spread))} 點。逆價差代表期貨市場看空，法人預期後市下跌，或有避險需求壓低期貨價格`,
          severity: 'down',
        })
      }
    }

    return result
  })

  return { signals }
}

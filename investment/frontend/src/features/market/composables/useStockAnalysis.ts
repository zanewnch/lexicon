import { computed, type Ref } from 'vue'
import type { StockDetail, Technicals, StockSignal, StockAnalysis, AnalysisCategory } from '@/types/market'

/**
 * 輔助函式：建立 StockSignal 物件並推入陣列。
 * 避免重複撰寫 `signals.push({ id, label, ... })` 的樣板。
 */
function push(
  signals: StockSignal[],
  category: AnalysisCategory,
  id: string,
  label: string,
  description: string,
  severity: StockSignal['severity'],
) {
  signals.push({ id, label, description, severity, category })
}

/**
 * 評估基本面指標，產生對應的訊號。
 *
 * 分析維度：
 * - **本益比（P/E）**：< 12 低估、> 30 過高、< 0 虧損
 * - **殖利率**：≥ 5% 高股息標的
 * - **股淨比（P/B）**：< 1 資產低估、> 5 成長溢價
 *
 * @param detail  - 個股詳細資訊
 * @param signals - 訊號陣列（in-place 修改）
 */
function evaluateFundamental(detail: StockDetail, signals: StockSignal[]) {
  const { pe, pb, dividendYield } = detail

  // 本益比
  if (pe > 0 && pe < 12) {
    push(signals, 'fundamental', 'pe-undervalued', '本益比偏低',
      `目前本益比 ${pe.toFixed(1)}，低於 12 倍，相對市場具有價值潛力，可能被低估`,
      'up')
  } else if (pe > 30) {
    push(signals, 'fundamental', 'pe-overvalued', '本益比偏高',
      `目前本益比 ${pe.toFixed(1)}，超過 30 倍，評價偏貴，需留意是否有高成長支撐`,
      'warn')
  } else if (pe < 0) {
    push(signals, 'fundamental', 'pe-negative', '本益比為負',
      `本益比為負值，代表公司近期處於虧損狀態，投資風險較高`,
      'down')
  }

  // 殖利率
  if (dividendYield >= 5) {
    push(signals, 'fundamental', 'high-yield', '高殖利率',
      `殖利率 ${dividendYield.toFixed(2)}%，高於 5%，屬於高股息標的，適合存股族關注`,
      'up')
  }

  // 股淨比
  if (pb > 0 && pb < 1) {
    push(signals, 'fundamental', 'low-pb', '股淨比低於 1',
      `股淨比 ${pb.toFixed(2)}，股價低於每股淨值，可能存在資產價值低估的機會`,
      'up')
  } else if (pb > 5) {
    push(signals, 'fundamental', 'high-pb', '股淨比偏高',
      `股淨比 ${pb.toFixed(2)}，超過 5 倍，市場對該公司未來成長預期較高`,
      'warn')
  }
}

/**
 * 評估技術指標，產生對應的訊號。
 *
 * 分析維度：
 * - **RSI(14)**：> 70 超買（留意回檔）、< 30 超賣（反彈機會）
 * - **KD**：K > D 且 < 30 黃金交叉（偏多）、K < D 且 > 70 死亡交叉（偏空）
 * - **MACD**：histogram > 0 多頭排列、< 0 空頭排列
 *
 * @param tech    - 技術指標資料
 * @param signals - 訊號陣列（in-place 修改）
 */
function evaluateTechnical(tech: Technicals, signals: StockSignal[]) {
  const { rsi14, kd_k, kd_d, macd, signal, histogram } = tech

  // RSI
  if (rsi14 > 0) {
    if (rsi14 > 70) {
      push(signals, 'technical', 'rsi-overbought', 'RSI 超買',
        `RSI(14) 為 ${rsi14.toFixed(1)}，超過 70 進入超買區，短線可能過熱，留意回檔風險`,
        'warn')
    } else if (rsi14 < 30) {
      push(signals, 'technical', 'rsi-oversold', 'RSI 超賣',
        `RSI(14) 為 ${rsi14.toFixed(1)}，低於 30 進入超賣區，短線可能出現反彈契機`,
        'up')
    }
  }

  // KD
  if (kd_k > 0 || kd_d > 0) {
    if (kd_k > kd_d && kd_k < 30) {
      push(signals, 'technical', 'kd-golden-cross', 'KD 低檔黃金交叉',
        `K 值 ${kd_k.toFixed(1)} 向上穿越 D 值 ${kd_d.toFixed(1)}，且位於低檔區（<30），為偏多的買進訊號`,
        'up')
    } else if (kd_k < kd_d && kd_k > 70) {
      push(signals, 'technical', 'kd-death-cross', 'KD 高檔死亡交叉',
        `K 值 ${kd_k.toFixed(1)} 向下跌破 D 值 ${kd_d.toFixed(1)}，且位於高檔區（>70），為偏空的賣出訊號`,
        'down')
    }
  }

  // MACD
  if (macd !== 0 || signal !== 0) {
    if (histogram > 0 && macd > signal) {
      push(signals, 'technical', 'macd-bullish', 'MACD 多頭排列',
        `DIF ${macd.toFixed(2)} 高於 MACD ${signal.toFixed(2)}，柱狀體為正（${histogram.toFixed(2)}），動能偏多`,
        'up')
    } else if (histogram < 0 && macd < signal) {
      push(signals, 'technical', 'macd-bearish', 'MACD 空頭排列',
        `DIF ${macd.toFixed(2)} 低於 MACD ${signal.toFixed(2)}，柱狀體為負（${histogram.toFixed(2)}），動能偏空`,
        'down')
    }
  }
}

/**
 * 評估趨勢（均線位置），產生對應的訊號。
 *
 * 分析維度：
 * - **多頭排列**：股價站上 MA5/10/20/60 全部均線
 * - **空頭排列**：股價跌破 MA5/10/20/60 全部均線
 * - **黃金交叉跡象**：MA5 剛穿越 MA20（差距 < 1%）
 *
 * @param detail  - 個股詳細資訊（用於取得股價）
 * @param tech    - 技術指標資料（用於取得均線值）
 * @param signals - 訊號陣列（in-place 修改）
 */
function evaluateTrend(detail: StockDetail, tech: Technicals, signals: StockSignal[]) {
  const price = detail.price
  const { ma5, ma10, ma20, ma60 } = tech

  if (!ma5 || !ma10 || !ma20 || !ma60) return

  // 多頭 / 空頭排列
  if (price > ma5 && price > ma10 && price > ma20 && price > ma60) {
    push(signals, 'trend', 'above-all-ma', '站上所有均線',
      `股價 ${price.toFixed(2)} 高於 MA5/10/20/60 全部均線，呈現多頭排列，趨勢偏多`,
      'up')
  } else if (price < ma5 && price < ma10 && price < ma20 && price < ma60) {
    push(signals, 'trend', 'below-all-ma', '跌破所有均線',
      `股價 ${price.toFixed(2)} 低於 MA5/10/20/60 全部均線，呈現空頭排列，趨勢偏空`,
      'down')
  }

  // 短均穿越中均
  if (ma5 > ma20 && ma20 > 0) {
    const gap = Math.abs(ma5 - ma20) / ma20
    if (gap < 0.01) {
      push(signals, 'trend', 'ma-golden-cross', '短期均線向上穿越',
        `MA5（${ma5.toFixed(2)}）剛穿越 MA20（${ma20.toFixed(2)}），差距僅 ${(gap * 100).toFixed(2)}%，可能形成黃金交叉`,
        'info')
    }
  }
}

/**
 * 評估波動性（振幅和收盤位置），產生對應的訊號。
 *
 * 分析維度：
 * - **振幅 > 5%**：波動劇烈，短線風險較高
 * - **收盤接近高點**（差 < 1%）：買方強勢，尾盤偏多
 * - **收盤接近低點**（差 < 1%）：賣壓沉重，尾盤偏空
 *
 * @param detail  - 個股詳細資訊
 * @param signals - 訊號陣列（in-place 修改）
 */
function evaluateVolume(detail: StockDetail, signals: StockSignal[]) {
  const { amplitude, high, low, close } = detail

  if (!high || !low || !close) return

  // 振幅
  if (amplitude > 5) {
    push(signals, 'volume', 'high-amplitude', '振幅過大',
      `今日振幅 ${amplitude.toFixed(2)}%，超過 5%，波動劇烈，短線交易風險較高`,
      'warn')
  }

  // 收盤位置
  if (high > 0 && (high - close) / high < 0.01) {
    push(signals, 'volume', 'close-near-high', '收盤接近高點',
      `收盤價 ${close.toFixed(2)} 接近當日最高價 ${high.toFixed(2)}，買方力道強勁，尾盤偏多`,
      'info')
  } else if (low > 0 && (close - low) / low < 0.01) {
    push(signals, 'volume', 'close-near-low', '收盤接近低點',
      `收盤價 ${close.toFixed(2)} 接近當日最低價 ${low.toFixed(2)}，賣壓沉重，尾盤偏空`,
      'info')
  }
}

/**
 * 個股技術與基本面綜合分析 composable。
 *
 * 依據股票詳情和技術指標，自動分析並產生：
 * - 各類「訊號」（`StockSignal[]`），分為：
 *   - `fundamental` — 基本面（本益比、殖利率、股淨比）
 *   - `technical` — 技術指標（RSI、KD、MACD）
 *   - `trend` — 趨勢（均線多空排列、黃金交叉）
 *   - `volume` — 振幅與收盤位置
 * - 綜合評分摘要（多頭 / 空頭 / 中性訊號數量 + 最終判定）
 *
 * 評分邏輯：
 * - 多頭訊號 > 空頭訊號 → `verdict: 'bullish'`
 * - 空頭訊號 > 多頭訊號 → `verdict: 'bearish'`
 * - 相等 → `verdict: 'neutral'`
 *
 * @param stockDetail - 個股詳細資訊的 Ref
 * @param technicals  - 技術指標的 Ref
 * @returns `{ analysis }` — 綜合分析結果（computed）
 *
 * @example
 * ```ts
 * const { analysis } = useStockAnalysis(stockDetail, technicals)
 * console.log(analysis.value.summary.verdict) // 'bullish' | 'bearish' | 'neutral'
 * console.log(analysis.value.signals)          // StockSignal[]
 * ```
 */
export function useStockAnalysis(
  stockDetail: Ref<StockDetail>,
  technicals: Ref<Technicals>,
) {
  const analysis = computed<StockAnalysis>(() => {
    const signals: StockSignal[] = []
    const detail = stockDetail.value
    const tech = technicals.value

    if (detail.price > 0) {
      evaluateFundamental(detail, signals)
      evaluateVolume(detail, signals)
    }

    if (tech) {
      evaluateTechnical(tech, signals)
      evaluateTrend(detail, tech, signals)
    }

    const bullish = signals.filter(s => s.severity === 'up').length
    const bearish = signals.filter(s => s.severity === 'down').length
    const neutral = signals.length - bullish - bearish

    return {
      summary: {
        total: signals.length,
        bullish,
        bearish,
        neutral,
        verdict: bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral',
      },
      signals,
    }
  })

  return { analysis }
}

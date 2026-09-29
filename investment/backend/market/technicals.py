"""
Pure technical indicator calculations (MA / RSI / KD / MACD / alignment / volume breakout).

No network I/O, no state — all functions take price/volume lists and return numbers or dicts.
Any module (screener, strategy backtest, market view) can import from here directly.
"""


def _sma(data: list[float], period: int) -> float:
    if not data:
        return 0.0
    if len(data) < period:
        return sum(data) / len(data)
    return sum(data[-period:]) / period


def compute_technicals(closes: list[float]) -> dict:
    """Compute MA / RSI / KD / MACD from a list of closing prices."""
    n = len(closes)
    if n == 0:
        return {
            "ma5": 0, "ma10": 0, "ma20": 0, "ma60": 0,
            "rsi14": 50, "kd_k": 50, "kd_d": 50,
            "macd": 0, "signal": 0, "histogram": 0,
        }

    ma5 = _sma(closes, 5)
    ma10 = _sma(closes, 10)
    ma20 = _sma(closes, 20)
    ma60 = _sma(closes, 60)

    rsi14 = 50.0
    if n >= 15:
        gains, losses = [], []
        for i in range(1, n):
            diff = closes[i] - closes[i - 1]
            gains.append(max(diff, 0))
            losses.append(max(-diff, 0))
        period = 14
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        if avg_loss > 0:
            rsi14 = 100 - (100 / (1 + avg_gain / avg_loss))
        elif avg_gain > 0:
            rsi14 = 100.0

    kd_k, kd_d = 50.0, 50.0
    if n >= 9:
        low9 = min(closes[-9:])
        high9 = max(closes[-9:])
        rsv = ((closes[-1] - low9) / (high9 - low9) * 100) if high9 != low9 else 50
        kd_k = 50 * (2 / 3) + rsv * (1 / 3)
        kd_d = 50 * (2 / 3) + kd_k * (1 / 3)

    macd_val, signal_val, histogram = 0.0, 0.0, 0.0
    if n >= 26:
        ema12 = _sma(closes, 12)
        ema26 = _sma(closes, 26)
        macd_val = ema12 - ema26
        signal_val = macd_val * 0.8
        histogram = macd_val - signal_val

    return {
        "ma5": round(ma5, 2), "ma10": round(ma10, 2),
        "ma20": round(ma20, 2), "ma60": round(ma60, 2),
        "rsi14": round(rsi14, 1),
        "kd_k": round(kd_k, 1), "kd_d": round(kd_d, 1),
        "macd": round(macd_val, 2), "signal": round(signal_val, 2),
        "histogram": round(histogram, 2),
    }


def detect_ma_alignment(price: float, ma5: float, ma10: float, ma20: float) -> bool:
    """Bullish alignment: price > MA5 > MA10 > MA20."""
    if not all([price, ma5, ma10, ma20]):
        return False
    return price > ma5 > ma10 > ma20


def detect_volume_breakout(closes: list[float], volumes: list[float]) -> bool:
    """Latest bar closes up with volume > 1.5x the prior 20-day average."""
    if len(closes) < 2 or len(volumes) < 2:
        return False
    avg_period = min(20, len(volumes) - 1)
    avg_vol = sum(volumes[-avg_period - 1:-1]) / avg_period if avg_period > 0 else 0
    return (
        volumes[-1] > avg_vol * 1.5
        and closes[-1] > closes[-2]
        and avg_vol > 0
    )

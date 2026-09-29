"""
即時行情測試腳本。
連線模擬模式 → 訂閱 2330 tick+五檔 → 印出即時資料 60 秒 → 斷線。
"""

import time

from core.shioaji import ShioajiConnection
from market.stream import MarketDataManager


def main():
    print("連線中...")
    api = ShioajiConnection.get_instance().get_api()
    print("連線成功")

    try:
        contract = api.Contracts.Stocks["2330"]
    except (KeyError, AttributeError):
        print("找不到 2330 合約")
        return

    print(f"取得合約: {contract.code} {contract.name}")

    mdm = MarketDataManager(api)

    # 用 observer 方式印出即時資料
    def print_tick(code, data):
        print(
            f"[Tick] {code} | "
            f"價: {data.close:.2f} | "
            f"量: {data.volume} | "
            f"總量: {data.total_volume} | "
            f"{data.tick_type_label} | "
            f"{data.timestamp}"
        )

    def print_bidask(code, data):
        print(
            f"[BidAsk] {code} | "
            f"買: {data.bid_prices[0]:.2f}x{data.bid_volumes[0]} | "
            f"賣: {data.ask_prices[0]:.2f}x{data.ask_volumes[0]} | "
            f"{data.timestamp}"
        )

    mdm.add_tick_listener(print_tick)
    mdm.add_bidask_listener(print_bidask)

    mdm.subscribe_tick(contract)
    mdm.subscribe_bidask(contract)
    print("已訂閱 tick + 五檔，等待即時資料 60 秒...\n")

    try:
        time.sleep(60)
    except KeyboardInterrupt:
        print("\n收到中斷訊號")

    print("\n取消訂閱並斷線...")
    mdm.unsubscribe_all()
    print("完成")


if __name__ == "__main__":
    main()

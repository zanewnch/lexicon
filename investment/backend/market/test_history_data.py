"""Regression checks for quote history and institutional data sources."""

from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from core.cache import CacheManager, ServiceUnavailable
from market.quote import QuoteService
from market.twse import TWSEService, TWSE_INSTITUTIONAL_URL, TWSE_STOCK_DAY_URL
from market.views import StockInstitutionalView, StockKlineView


def bar(day: date, hour: int, close: float, volume: int = 1) -> dict:
    return {
        "ts": f"{day.isoformat()}T{hour:02d}:00:00+08:00",
        "open": close - 1,
        "high": close + 1,
        "low": close - 2,
        "close": close,
        "volume": volume,
    }


class QuoteHistoryTests(SimpleTestCase):
    def setUp(self):
        self.connection_patch = patch("market.quote.ShioajiConnection.get_instance")
        connection = self.connection_patch.start().return_value
        self.addCleanup(self.connection_patch.stop)
        connection.cache = CacheManager(ttl=60)
        self.api = connection.get_api.return_value
        self.service = QuoteService()
        self.service._twse = MagicMock()

    def test_listed_daily_history_uses_twse_and_aggregates_periods(self):
        self.api.Contracts.Stocks.__getitem__.return_value = SimpleNamespace(exchange="TSE")
        current = date.today().replace(day=1)
        previous = (current - timedelta(days=1)).replace(day=1)
        days = [previous + timedelta(days=25), previous + timedelta(days=26), current + timedelta(days=1)]
        rows = {previous: [bar(days[0], 13, 10), bar(days[1], 13, 11)], current: [bar(days[2], 13, 12)]}
        self.service._twse.get_stock_daily_month.side_effect = lambda _code, month: rows.get(month, [])

        daily = self.service.get_kbars("2330", "Day", 3)
        monthly = self.service.get_kbars("2330", "Month", 2)

        self.assertEqual([item["close"] for item in daily], [10, 11, 12])
        self.assertEqual([item["close"] for item in monthly], [11, 12])
        self.api.kbars.assert_not_called()

    def test_minute_bars_are_aggregated_to_real_daily_ohlcv(self):
        day = date(2026, 9, 24)
        rows = [bar(day, 9, 10, 2), bar(day, 10, 12, 3)]

        result = QuoteService._aggregate_kbars(rows, "Day")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["open"], 9)
        self.assertEqual(result[0]["high"], 13)
        self.assertEqual(result[0]["low"], 8)
        self.assertEqual(result[0]["close"], 12)
        self.assertEqual(result[0]["volume"], 5)

    def test_shioaji_history_is_split_into_at_most_30_day_calls(self):
        self.api.Contracts.Stocks.__getitem__.return_value = SimpleNamespace(exchange="OTC")

        def fake_kbars(*, start, end, timeout, **_kwargs):
            first = date.fromisoformat(start)
            last = date.fromisoformat(end)
            days = [first + timedelta(days=i) for i in range((last - first).days + 1)]
            timestamps = [
                int(datetime(day.year, day.month, day.day, 9, tzinfo=timezone.utc).timestamp() * 1e9)
                for day in days
            ]
            return SimpleNamespace(
                ts=timestamps,
                Open=[10] * len(days),
                High=[11] * len(days),
                Low=[9] * len(days),
                Close=[10] * len(days),
                Volume=[100] * len(days),
            )

        self.api.kbars.side_effect = fake_kbars
        result = self.service.get_kbars("6488", "Day", 35)

        self.assertEqual(len(result), 35)
        self.assertGreaterEqual(self.api.kbars.call_count, 2)
        for call in self.api.kbars.call_args_list:
            params = call.kwargs
            self.assertLessEqual((date.fromisoformat(params["end"]) - date.fromisoformat(params["start"])).days, 29)
            self.assertEqual(params["timeout"], 5000)

    def test_shioaji_source_failure_is_not_silently_returned_as_empty_history(self):
        self.api.Contracts.Stocks.__getitem__.return_value = SimpleNamespace(exchange="OTC")
        self.api.kbars.side_effect = TimeoutError("source timed out")

        with self.assertRaises(ServiceUnavailable):
            self.service.get_kbars("6488", "Day", 30)


class TwseHistoryTests(SimpleTestCase):
    def setUp(self):
        self.service = TWSEService()
        self.response = self.service._http.get = MagicMock(return_value=MagicMock())

    def test_stock_day_uses_real_endpoint_and_parses_roc_date_and_volume(self):
        self.response.return_value.json.return_value = {
            "stat": "OK",
            "fields": ["日期", "成交股數", "開盤價", "最高價", "最低價", "收盤價"],
            "data": [["115/09/24", "31,855,287", "2,395.00", "2,440.00", "2,390.00", "2,440.00"]],
        }

        result = self.service.get_stock_daily_month("2330", date(2026, 9, 1))

        self.response.assert_called_once_with(
            TWSE_STOCK_DAY_URL,
            params={"response": "json", "date": "20260901", "stockNo": "2330"},
            timeout=8,
        )
        self.assertEqual(result[0]["ts"], "2026-09-24T13:30:00+08:00")
        self.assertEqual(result[0]["volume"], 31855)
        self.assertEqual(result[0]["close"], 2440)

    def test_institutional_report_uses_t86_and_parses_net_lots(self):
        self.response.return_value.json.return_value = {
            "stat": "OK",
            "date": "20260924",
            "fields": ["證券代號", "外陸資買賣超股數(不含外資自營商)", "投信買賣超股數", "自營商買賣超股數"],
            "data": [["2330", "-4,667,832", "-1,287,718", "242,701"]],
        }

        result = self.service.get_institutional_trading("2330", days=1)

        self.response.assert_called_once_with(
            TWSE_INSTITUTIONAL_URL,
            params={"response": "json", "selectType": "ALLBUT0999"},
            timeout=8,
        )
        self.assertEqual(result, [{"date": "2026-09-24", "foreign": -4667, "trust": -1287, "dealer": 242}])

    def test_institutional_days_skips_weekends_and_returns_five_trading_days(self):
        trading_days = ["20260924", "20260923", "20260922", "20260921", "20260918"]
        fields = ["證券代號", "外陸資買賣超股數(不含外資自營商)", "投信買賣超股數", "自營商買賣超股數"]

        def report(report_date=None):
            key = report_date or trading_days[0]
            return {
                "stat": "OK" if key in trading_days else "沒有資料",
                "date": key,
                "fields": fields,
                "data": [["2330", "1,000", "2,000", "3,000"]],
            }

        with patch.object(self.service, "_fetch_institutional_report", side_effect=report) as fetch:
            result = self.service.get_institutional_trading("2330", days=5)

        self.assertEqual([item["date"] for item in result], [
            "2026-09-24", "2026-09-23", "2026-09-22", "2026-09-21", "2026-09-18",
        ])
        self.assertEqual(fetch.call_count, 5)

    def test_stock_day_malformed_response_is_not_cached(self):
        self.response.return_value.json.return_value = {"stat": "OK", "fields": []}

        with self.assertRaises(ValueError):
            self.service.get_stock_daily_month("2330", date(2026, 9, 1))
        self.assertIsNone(self.service._cache.get("stock_daily_month_2330_202609"))
        self.assertIsNone(self.service._long_cache.get("stock_daily_month_2330_202609"))

    def test_non_json_institutional_response_raises_service_error(self):
        self.response.return_value.json.side_effect = ValueError("HTML instead of JSON")

        with self.assertRaises(ServiceUnavailable):
            self.service.get_institutional_trading("2330", days=1)
        self.assertIsNone(self.service._cache.get("institutional_2330_1"))


class MarketApiErrorTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_provider_failure_returns_traceable_503(self):
        request = self.factory.get("/api/stocks/2330/institutional/?days=5")
        request.request_id = "regression-503"
        with patch("market.views._twse.get_institutional_trading", side_effect=ServiceUnavailable("來源回應異常")):
            response = StockInstitutionalView.as_view()(request, code="2330")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "SERVICE_UNAVAILABLE")
        self.assertEqual(response.data["requestId"], "regression-503")

    def test_invalid_query_parameters_return_400_without_calling_source(self):
        with patch("market.views._quote.get_kbars") as get_kbars:
            response = StockKlineView.as_view()(
                self.factory.get("/api/stocks/2330/kline/?limit=oops"), code="2330"
            )
            self.assertEqual(response.status_code, 400)
            get_kbars.assert_not_called()

        with patch("market.views._twse.get_institutional_trading") as get_institutional:
            response = StockInstitutionalView.as_view()(
                self.factory.get("/api/stocks/2330/institutional/?days=oops"), code="2330"
            )
            self.assertEqual(response.status_code, 400)
            get_institutional.assert_not_called()

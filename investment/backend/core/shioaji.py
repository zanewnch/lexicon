"""
Shioaji API service — singleton connection, cache, and credentials loading.
"""

import json
import logging
import os
import time
from pathlib import Path
from threading import Lock

import shioaji as sj

from core.cache import CacheManager, ServiceUnavailable

logger = logging.getLogger(__name__)

# Project root (core/ → backend/ → investment/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_CREDENTIALS_PATH = (Path(os.environ['LEXICON_INVESTMENT_DATA_DIR']) / 'credentials.json'
                     if os.environ.get('LEXICON_INVESTMENT_DATA_DIR') else _PROJECT_ROOT / 'credentials.json')


class ShioajiConnection:
    """Singleton Shioaji 連線管理。"""

    _instance: "ShioajiConnection | None" = None
    _lock = Lock()

    def __init__(self):
        self.api: sj.Shioaji | None = None
        self.contracts_ready = False
        self.simulation_mode = self._load_credentials()["simulation"]
        self.cache = CacheManager(ttl=60)

    @classmethod
    def get_instance(cls) -> "ShioajiConnection":
        if cls._instance is not None:
            return cls._instance
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def _load_credentials(self) -> dict:
        """Load credentials from credentials.json, with env var overrides.

        根據模式自動選用對應 Token：
        - 模擬模式：使用 shioaji_simulation 區塊
        - 正式模式：使用 shioaji_formal 區塊
        """
        config = {}
        if _CREDENTIALS_PATH.exists():
            try:
                with open(_CREDENTIALS_PATH, encoding="utf-8") as f:
                    config = json.load(f)
            except (json.JSONDecodeError, OSError):
                logger.warning("Failed to read credentials.json, falling back to env vars")

        default_mode = config.get("default_mode", "simulation")
        if default_mode not in ("simulation", "production"):
            raise ServiceUnavailable("default_mode 須為 simulation 或 production")
        mode_flag = os.environ.get(
            "SHIOAJI_SIMULATION",
            "true" if default_mode == "simulation" else "false",
        ).lower()
        if mode_flag not in ("true", "false"):
            raise ServiceUnavailable("SHIOAJI_SIMULATION 須為 true 或 false")
        simulation = mode_flag == "true"

        # 根據模式選用對應 Token
        if simulation:
            token_block = config.get("shioaji_simulation", {})
            logger.info("Using simulation API token")
        else:
            token_block = config.get("shioaji_formal", {})
            logger.info("Using formal (production) API token")

        return {
            "api_key": os.environ.get("SHIOAJI_API_KEY", token_block.get("api_key", "")),
            "api_secret": os.environ.get("SHIOAJI_API_SECRET", token_block.get("api_secret", "")),
            "ca_path": os.environ.get(
                "SHIOAJI_CA_PATH",
                str(_CREDENTIALS_PATH.parent / config.get("ca_path", "Sinopac.pfx")),
            ),
            "ca_passwd": os.environ.get("SHIOAJI_CA_PASSWD", config.get("ca_passwd", "")),
            "person_id": os.environ.get("SHIOAJI_PERSON_ID", config.get("person_id", "")),
            "simulation": simulation,
        }

    def get_api(self) -> sj.Shioaji:
        """Return a logged-in Shioaji API instance (lazy-initialised, thread-safe)."""
        if self.api is not None and self.contracts_ready:
            return self.api

        with self._lock:
            if self.api is not None and self.contracts_ready:
                return self.api

            creds = self._load_credentials()
            self.simulation_mode = creds["simulation"]

            if not creds["api_key"] or not creds["api_secret"]:
                raise ServiceUnavailable(
                    "Shioaji API Key/Secret 未設定；請設定目前模式對應的 API Token。"
                )

            ca_path = Path(creds["ca_path"])
            if not self.simulation_mode:
                if os.environ.get("SHIOAJI_ENABLE_PRODUCTION_CONNECTION") != "true":
                    raise ServiceUnavailable("正式連線未啟用；須明確設定 SHIOAJI_ENABLE_PRODUCTION_CONNECTION=true")
                missing = []
                if not ca_path.is_file():
                    missing.append("Sinopac.pfx 憑證檔")
                if not creds["ca_passwd"]:
                    missing.append("CA 憑證密碼")
                if not creds["person_id"]:
                    missing.append("person_id 身分證字號")
                if missing:
                    raise ServiceUnavailable(
                        "正式模式缺少必要設定：" + "、".join(missing)
                        + "。請完成永豐交易憑證申請/設定。"
                    )

            # 根據 simulation 模式自動選用 shioaji_formal / shioaji_simulation Token
            # 管理頁面：https://www.sinotrade.com.tw/newweb/PythonAPIKey/
            logger.info("Initialising Shioaji connection (simulation=%s)…", self.simulation_mode)
            api = sj.Shioaji(simulation=self.simulation_mode)
            try:
                api.login(creds["api_key"], creds["api_secret"])
                if not self.simulation_mode:
                    ca_result = api.activate_ca(
                        ca_path=str(ca_path),
                        ca_passwd=creds["ca_passwd"],
                        person_id=creds["person_id"],
                    )
                    if ca_result is not True:
                        raise ServiceUnavailable("正式模式 CA 憑證啟用未成功")
                    logger.info("CA activated.")
                # Reconnects must resume fill callbacks for already-submitted orders.
                from trading_core.enums import ExecutionVenue
                from trading_core.fill_handler import FillHandler
                venue = (ExecutionVenue.BROKER_SIMULATION if self.simulation_mode
                         else ExecutionVenue.BROKER_PRODUCTION)
                FillHandler.register(api, venue)
            except Exception:
                try:
                    api.logout()
                except Exception:
                    pass
                self.api = None
                self.contracts_ready = False
                raise

            self.api = api

            time.sleep(5)
            self.contracts_ready = True
            logger.info("Shioaji connection ready.")
            return self.api

    def get_current_mode(self) -> dict:
        if self.api is None:
            self.simulation_mode = self._load_credentials()["simulation"]
        return {
            "simulation": self.simulation_mode,
            "connected": self.api is not None and self.contracts_ready,
        }

    def switch_mode(self, simulation: bool) -> dict:
        """Disconnect and reconnect with the requested mode."""
        from trading_core.enums import ExecutionVenue, OrderStatus
        from trading_core.models import Order

        current_venue = (
            ExecutionVenue.BROKER_SIMULATION if self.simulation_mode
            else ExecutionVenue.BROKER_PRODUCTION
        )
        if simulation != self.simulation_mode and Order.objects.filter(
            venue=current_venue,
            status__in=[OrderStatus.PENDING, OrderStatus.SUBMITTED, OrderStatus.PARTIALLY_FILLED],
        ).exists():
            raise ServiceUnavailable("目前環境仍有未完成委託，請先查詢券商狀態並對帳")
        previous_simulation = self.simulation_mode
        previous_override = os.environ.get("SHIOAJI_SIMULATION")
        with self._lock:
            if self.api is not None:
                try:
                    self.api.logout()
                    logger.info("Logged out of Shioaji.")
                except Exception:
                    logger.warning("Error during logout, continuing…")
                self.api = None
                self.contracts_ready = False

            self.cache.clear()
            self.simulation_mode = simulation
            os.environ["SHIOAJI_SIMULATION"] = "true" if simulation else "false"

        try:
            api = self.get_api()
            from market.consumers import SubscriptionManager
            SubscriptionManager.get_instance().refresh_api(api)
        except Exception as e:
            if previous_override is None:
                os.environ.pop("SHIOAJI_SIMULATION", None)
            else:
                os.environ["SHIOAJI_SIMULATION"] = previous_override
            self.simulation_mode = previous_simulation
            try:
                restored_api = self.get_api()
                from market.consumers import SubscriptionManager
                SubscriptionManager.get_instance().refresh_api(restored_api)
            except Exception:
                logger.exception("Could not restore the previous Shioaji mode")
            raise ServiceUnavailable("模式切換後重新連線失敗") from e

        return {"simulation": self.simulation_mode, "connected": True}

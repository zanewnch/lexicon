"""Build the host-platform investment sidecar for electron-builder."""

import subprocess
import sys
import importlib.util
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / 'investment' / 'backend'
DIST = ROOT / 'build' / 'investment'
APPS = [
    'backend', 'core', 'account', 'market', 'screener', 'strategy', 'learning',
    'news', 'notes', 'analysis', 'scanner', 'trader', 'watchdog', 'exiter',
    'bookkeeper', 'risk_guard', 'pipeline', 'user_profile', 'trading_core',
]


def main():
    args = [
        sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean',
        '--onedir', '--name', 'investment-service',
        '--distpath', str(DIST), '--workpath', str(DIST / 'work'),
        '--specpath', str(DIST / 'spec'), '--paths', str(BACKEND),
        '--hidden-import', 'backend.asgi',
        '--add-data', f"{BACKEND / 'learning' / 'data' / 'curriculum.json'}{';' if sys.platform == 'win32' else ':'}learning/data",
    ]
    autobahn = importlib.util.find_spec('autobahn')
    if autobahn and autobahn.submodule_search_locations:
        validator = Path(list(autobahn.submodule_search_locations)[0]) / 'nvx' / '_utf8validator.c'
        if validator.is_file():
            args.extend(['--add-data', f"{validator}{';' if sys.platform == 'win32' else ':'}autobahn/nvx"])
    for package in APPS:
        args.extend(['--collect-submodules', package])
    for package in ('django', 'daphne', 'channels', 'shioaji', 'rest_framework', 'corsheaders', 'autobahn', 'twisted'):
        args.extend(['--collect-all', package])
    args.append(str(BACKEND / 'lexicon_service.py'))
    environment = os.environ.copy()
    environment['PYTHONPATH'] = str(BACKEND) + os.pathsep + environment.get('PYTHONPATH', '')
    subprocess.run(args, cwd=ROOT, env=environment, check=True)


if __name__ == '__main__':
    main()

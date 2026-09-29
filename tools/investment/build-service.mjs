import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const local = join('build', 'investment-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
const python = process.env.LEXICON_BUILD_PYTHON || (existsSync(local) ? local : (process.platform === 'win32' ? 'python' : 'python3'))
const result = spawnSync(python, ['tools/investment/build-service.py'], { stdio: 'inherit', windowsHide: true })
if (result.error) throw result.error
process.exit(result.status ?? 1)

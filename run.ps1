# Start Unus and all managed local services.
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Node.js/npm was not found.' }
    if (-not (Test-Path -LiteralPath 'node_modules\electron\dist\electron.exe')) { throw 'Run npm install in the Unus repository first.' }
    if (-not (Test-Path -LiteralPath 'investment\frontend\node_modules\vite\bin\vite.js')) { throw 'Run npm ci in investment/frontend first.' }
    $env:PYTHONIOENCODING = 'utf-8'
    & npm.cmd run dev
    if ($LASTEXITCODE -ne 0) { throw "Unus exited with code $LASTEXITCODE" }
}
finally { Pop-Location }

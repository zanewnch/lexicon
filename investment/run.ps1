# Start the frontend and backend development servers from the repository root.
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$manage = Join-Path $backend 'manage.py'
$vite = Join-Path $frontend 'node_modules\vite\bin\vite.js'

function Assert-PortAvailable([int]$port) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $port is already in use. Stop the existing server before running this script."
    }
}

Assert-PortAvailable 8000
Assert-PortAvailable 5173

$pythonCandidates = @(
    (Join-Path $backend '.venv\Scripts\python.exe'),
    (Join-Path $root '.venv\Scripts\python.exe'),
    (Join-Path $root 'venv\Scripts\python.exe')
)
$python = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $python) {
    $pythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($pythonCommand) { $python = $pythonCommand.Source }
}
if (-not $python) { throw 'Python was not found. Install backend dependencies first.' }

& $python -c 'import django'
if ($LASTEXITCODE -ne 0) { throw 'Django is not installed in the selected Python environment.' }
& $python $manage check
if ($LASTEXITCODE -ne 0) { throw 'Django system check failed. Fix the backend before starting.' }
& $python $manage migrate --check
if ($LASTEXITCODE -ne 0) { throw 'Database migrations are pending. Run python backend\manage.py migrate first.' }

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Node.js was not found.' }
if (-not (Test-Path -LiteralPath $vite)) {
    throw 'Frontend dependencies were not found. Run npm install in frontend first.'
}

$logDirectory = Join-Path $env:TEMP 'investment-run'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
$runId = [guid]::NewGuid().ToString('N').Substring(0, 8)
$stdout = Join-Path $logDirectory "vite-$runId.log"
$stderr = Join-Path $logDirectory "vite-$runId-error.log"

$viteProcess = $null
try {
    $viteProcess = Start-Process -FilePath $nodeCommand.Source -ArgumentList @("`"$vite`"", '--host', '127.0.0.1', '--port', '5173', '--strictPort') -WorkingDirectory $frontend -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($viteProcess.HasExited) {
            throw "Vite exited early. Check $stderr and $stdout"
        }
        if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) {
        throw "Vite did not start within 10 seconds. Check $stderr and $stdout"
    }

    Write-Host 'Frontend: http://127.0.0.1:5173'
    Write-Host 'Backend:  http://127.0.0.1:8000'
    Write-Host 'Press Ctrl+C to stop both servers.'
    & $python $manage runserver 127.0.0.1:8000
}
finally {
    if ($viteProcess -and -not $viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -ErrorAction SilentlyContinue
        $viteProcess.WaitForExit()
    }
}

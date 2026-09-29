# Activate backend virtualenv and start Django development server.
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$backend = Join-Path $root 'backend'
$defaultVenv = Join-Path $backend '.venv'
$requirements = Join-Path $backend 'requirements.txt'

$activatePaths = @(
    Join-Path $defaultVenv 'Scripts\Activate.ps1'
    Join-Path $root '.venv\Scripts\Activate.ps1'
    Join-Path $root 'venv\Scripts\Activate.ps1'
)

$activate = $activatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $activate) {
    Write-Host "No virtualenv found. Creating backend\.venv with Python 3.12..."
    py -3.12 -m venv $defaultVenv
    $activate = Join-Path $defaultVenv 'Scripts\Activate.ps1'
}

& $activate

python -m pip install --upgrade pip
python -m pip install -r $requirements
python (Join-Path $backend 'manage.py') runserver

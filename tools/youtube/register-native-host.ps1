param(
  [Parameter(Mandatory = $true)] [string] $NativeHostPath,
  [string[]] $ExtensionIds = @('beihelddlfklfpemplilnfhcffcjgdkp')
)

$resolvedExe = (Resolve-Path -LiteralPath $NativeHostPath).Path
$hostDirectory = Join-Path $env:LOCALAPPDATA 'Lexicon\youtube-native-host'
$manifestPath = Join-Path $hostDirectory 'com.lexicon.youtube.json'
New-Item -ItemType Directory -Force -Path $hostDirectory | Out-Null

$manifest = @{
  name = 'com.lexicon.youtube'
  description = 'Lexicon YouTube translation bridge'
  path = $resolvedExe
  type = 'stdio'
  allowed_origins = @($ExtensionIds | ForEach-Object { "chrome-extension://$_/" })
} | ConvertTo-Json -Depth 3
Set-Content -LiteralPath $manifestPath -Value $manifest -Encoding utf8
New-Item -Path 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.lexicon.youtube' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.lexicon.youtube' -Name '(default)' -Value $manifestPath
Write-Host "Lexicon YouTube native host registered for: $($ExtensionIds -join ', ')"

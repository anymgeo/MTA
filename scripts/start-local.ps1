. "$PSScriptRoot/local-env.ps1"
if (-not (Test-Path -LiteralPath $credentialsPath)) { throw 'Run scripts/initialize-local.ps1 first.' }
& "$pgBin/pg_ctl.exe" -D (Join-Path $localDir 'postgres-data') status *> $null
if ($LASTEXITCODE -ne 0) {
    & "$pgBin/pg_ctl.exe" -D (Join-Path $localDir 'postgres-data') -l (Join-Path $localDir 'postgres.log') -o '-h 127.0.0.1 -p 55432' start
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL start failed.' }
}
$processFile = Join-Path $localDir 'processes.json'
$processes = if (Test-Path -LiteralPath $processFile) { @(Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json) } else { @() }
function Start-MtaProcess($name, $file, $arguments, $directory, $port) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
        Write-Output "$name already has a listener on port $port; not starting a duplicate."
        return
    }
    $p = Start-Process -FilePath $file -ArgumentList $arguments -WorkingDirectory $directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localDir "$name.log") -RedirectStandardError (Join-Path $localDir "$name.error.log")
    $script:processes = @($script:processes | Where-Object { $_.Name -ne $name }) + @{ Name = $name; ProcessId = $p.Id }
}
Start-MtaProcess 'api' "$env:DOTNET_ROOT/dotnet.exe" 'run --no-build --no-launch-profile' (Join-Path $projectRoot 'mta.api') 5100
$node = (Get-Command node).Source
Start-MtaProcess 'site' $node 'node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100' (Join-Path $projectRoot 'mtaprime') 3100
Start-MtaProcess 'admin' $node 'node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3101' (Join-Path $projectRoot 'mta.admin') 3101
if ($processes.Count -gt 0) { $processes | ConvertTo-Json | Set-Content (Join-Path $localDir 'processes.json') }
Write-Output 'Admin: http://localhost:3101 | Site: http://localhost:3100/ka/news'

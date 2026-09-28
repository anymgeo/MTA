. "$PSScriptRoot/local-env.ps1"
New-Item -ItemType Directory -Force $localDir | Out-Null
if (-not (Test-Path -LiteralPath $credentialsPath)) {
    function New-Password { 'Mta!' + [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(18)).ToLower() }
    $credentials = @{ AdminEmail = 'd.gabelaia@mta.ski'; AdminPassword = New-Password; DatabasePassword = New-Password; PostgresPassword = New-Password }
    $credentials | ConvertTo-Json | Set-Content -LiteralPath $credentialsPath -Encoding utf8
}
. "$PSScriptRoot/local-env.ps1"
$dataPath = Join-Path $localDir 'postgres-data'
if (-not (Test-Path -LiteralPath (Join-Path $dataPath 'PG_VERSION'))) {
    $passwordFile = Join-Path $localDir 'pg-init-password.txt'
    [IO.File]::WriteAllText($passwordFile, $credentials.PostgresPassword)
    try {
        & "$pgBin/initdb.exe" -D $dataPath -U postgres --encoding=UTF8 --locale=C --auth=scram-sha-256 "--pwfile=$passwordFile"
        if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL initialization failed.' }
    } finally { Remove-Item -LiteralPath $passwordFile -ErrorAction SilentlyContinue }
}
& "$pgBin/pg_ctl.exe" -D $dataPath status *> $null
if ($LASTEXITCODE -ne 0) {
    & "$pgBin/pg_ctl.exe" -D $dataPath -l (Join-Path $localDir 'postgres.log') -o '-h 127.0.0.1 -p 55432' start
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL start failed.' }
}
$env:PGPASSWORD = $credentials.PostgresPassword
try {
    $exists = & "$pgBin/psql.exe" -h 127.0.0.1 -p 55432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='mta_app'"
    if ($exists -ne '1') {
        "CREATE ROLE mta_app WITH LOGIN PASSWORD '$($credentials.DatabasePassword)';" | & "$pgBin/psql.exe" -h 127.0.0.1 -p 55432 -U postgres -d postgres -v ON_ERROR_STOP=1
        if ($LASTEXITCODE -ne 0) { throw 'Database role creation failed.' }
    }
    $exists = & "$pgBin/psql.exe" -h 127.0.0.1 -p 55432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='mta'"
    if ($exists -ne '1') {
        & "$pgBin/createdb.exe" -h 127.0.0.1 -p 55432 -U postgres -O mta_app mta
        if ($LASTEXITCODE -ne 0) { throw 'Database creation failed.' }
    }
} finally { Remove-Item Env:PGPASSWORD }
Push-Location (Join-Path $projectRoot 'mta.api')
try {
    & "$env:DOTNET_ROOT/dotnet.exe" run --no-launch-profile -- --initialize
    if ($LASTEXITCODE -ne 0) { throw 'API initialization failed.' }
} finally { Pop-Location }
Write-Output "Initialized. Credentials are in $credentialsPath (keep this file private)."

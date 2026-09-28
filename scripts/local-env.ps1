$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$env:DOTNET_ROOT = Join-Path $projectRoot '.tools/dotnet'
$env:DOTNET_CLI_HOME = Join-Path $projectRoot '.tools/dotnet-home'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:NUGET_PACKAGES = Join-Path $projectRoot '.tools/nuget'
$env:PATH = "$env:DOTNET_ROOT;$env:PATH"
$localDir = Join-Path $projectRoot '.local'
$pgBin = Join-Path $projectRoot '.tools/postgresql/pgsql/bin'
$credentialsPath = Join-Path $localDir 'credentials.json'
if (Test-Path -LiteralPath $credentialsPath) {
    $credentials = Get-Content -LiteralPath $credentialsPath -Raw | ConvertFrom-Json
    $env:ConnectionStrings__Database = "Host=127.0.0.1;Port=55432;Database=mta;Username=mta_app;Password=$($credentials.DatabasePassword)"
    $env:Bootstrap__Email = $credentials.AdminEmail
    $env:Bootstrap__Password = $credentials.AdminPassword
}
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://127.0.0.1:5100'
$env:StoragePath = Join-Path $localDir 'storage'

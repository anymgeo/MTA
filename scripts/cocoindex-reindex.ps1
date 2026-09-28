param([switch]$Full)
$root = Split-Path -Parent $PSScriptRoot
$coco = Join-Path $root '.tools\cocoindex-venv\Scripts\cocoindex.exe'
if (!(Test-Path $coco)) { throw 'CocoIndex environment is not installed.' }
$args = @('update', (Join-Path $root 'tools\cocoindex_code\flow.py'))
if ($Full) { $args += '--full-reprocess' }
& $coco @args
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$runtime = 'C:\Users\d.gabelaia\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$venv = Join-Path $root '.tools\cocoindex-venv'
if (!(Test-Path $runtime)) { throw "Bundled Python runtime was not found at $runtime" }
if (!(Test-Path (Join-Path $venv 'Scripts\python.exe'))) {
  & $runtime -m venv $venv
}
$python = Join-Path $venv 'Scripts\python.exe'
& $python -m pip install --upgrade pip
& $python -m pip install --upgrade --force-reinstall -r (Join-Path $root 'tools\cocoindex_code\requirements.txt')
& $python -m pip install --upgrade --force-reinstall torch --index-url https://download.pytorch.org/whl/cu128
& $python -c "import torch; assert torch.cuda.is_available(); print(torch.__version__, torch.cuda.get_device_name(0))"
& (Join-Path $root 'scripts\cocoindex-reindex.ps1')

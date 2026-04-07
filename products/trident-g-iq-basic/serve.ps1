param(
  [int]$Port = 4173
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$productsRoot = Split-Path -Parent $root
Set-Location $productsRoot

Write-Host "Serving products root at http://127.0.0.1:$Port/" -ForegroundColor Cyan
Write-Host "Open Trident G IQ Basic at http://127.0.0.1:$Port/trident-g-iq-basic/#hub" -ForegroundColor Green
python -m http.server $Port

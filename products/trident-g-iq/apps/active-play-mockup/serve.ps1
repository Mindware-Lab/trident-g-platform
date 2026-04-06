$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Serving Trident G active-play mock-up at http://127.0.0.1:4173/" -ForegroundColor Cyan
python -m http.server 4173

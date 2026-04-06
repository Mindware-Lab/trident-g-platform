$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Serving Trident G IQ Max at http://127.0.0.1:4174/" -ForegroundColor Cyan
python -m http.server 4174

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $baseDir "faces"
if (!(Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$quadrants = @(
  @{ idx = 1; x = 0; y = 0; pack = "A" },
  @{ idx = 2; x = 1024; y = 0; pack = "A" },
  @{ idx = 3; x = 0; y = 1024; pack = "B" },
  @{ idx = 4; x = 1024; y = 1024; pack = "B" }
)

$emotions = @("afraid", "angry", "happy", "neutral", "sad")

$manifest = @{
  version = 1
  size = 256
  source = "2x2 quadrant extraction from 2048 source sheets"
  faces = @()
}

foreach ($emotion in $emotions) {
  $sourcePath = Join-Path $baseDir "$emotion.png"
  $source = [System.Drawing.Bitmap]::new($sourcePath)
  foreach ($q in $quadrants) {
    $cropRect = [System.Drawing.Rectangle]::new([int]$q.x, [int]$q.y, 1024, 1024)
    $target = [System.Drawing.Bitmap]::new(256, 256)
    $graphics = [System.Drawing.Graphics]::FromImage($target)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage(
      $source,
      [System.Drawing.Rectangle]::new(0, 0, 256, 256),
      $cropRect,
      [System.Drawing.GraphicsUnit]::Pixel
    )

    $name = "$emotion" + "_" + "$($q.idx).png"
    $targetPath = Join-Path $outDir $name
    $target.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $target.Dispose()

    $manifest.faces += [ordered]@{
      id = "$emotion" + "_" + "$($q.idx)"
      emotion = $emotion
      pack = $q.pack
      src = "./face-word-stim/faces/$name"
      source = "./$emotion.png"
      sourceRect = [ordered]@{
        x = [int]$q.x
        y = [int]$q.y
        width = 1024
        height = 1024
      }
      width = 256
      height = 256
    }
  }
  $source.Dispose()
}

$manifestPath = Join-Path $baseDir "faces.manifest.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8
Write-Output "Wrote: $manifestPath"

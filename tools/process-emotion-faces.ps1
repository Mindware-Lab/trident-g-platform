param(
  [string[]]$Emotions = @("angry", "happy", "sad", "afraid")
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$facesRoot = Join-Path $repoRoot "products/trident-g-iq-basic/assets/capacity/emotion/faces"
$targetSize = [System.Drawing.Size]::new(256, 256)
$contentBounds = [System.Drawing.Size]::new(224, 232)
$bottomPadding = 8

function New-ArgbBitmap {
  param(
    [int]$Width,
    [int]$Height
  )

  return [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Get-CroppedBitmap {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [System.Drawing.Rectangle]$Rect
  )

  return $Bitmap.Clone($Rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Get-BackgroundMode {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $samples = @(
    $Bitmap.GetPixel(0, 0),
    $Bitmap.GetPixel($Bitmap.Width - 1, 0),
    $Bitmap.GetPixel(0, $Bitmap.Height - 1),
    $Bitmap.GetPixel($Bitmap.Width - 1, $Bitmap.Height - 1),
    $Bitmap.GetPixel([Math]::Floor($Bitmap.Width / 2), 0),
    $Bitmap.GetPixel([Math]::Floor($Bitmap.Width / 2), $Bitmap.Height - 1),
    $Bitmap.GetPixel(0, [Math]::Floor($Bitmap.Height / 2)),
    $Bitmap.GetPixel($Bitmap.Width - 1, [Math]::Floor($Bitmap.Height / 2))
  )

  $luminance = (($samples | ForEach-Object { ($_.R + $_.G + $_.B) / 3.0 } | Measure-Object -Average).Average)
  if ($luminance -ge 160) {
    return "light"
  }

  return "dark"
}

function Test-IsBackground {
  param(
    [System.Drawing.Color]$Color,
    [string]$Mode
  )

  if ($Mode -eq "light") {
    return ($Color.R -ge 232 -and $Color.G -ge 232 -and $Color.B -ge 232)
  }

  return ($Color.R -le 26 -and $Color.G -le 26 -and $Color.B -le 26)
}

function Remove-Background {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $mode = Get-BackgroundMode -Bitmap $Bitmap
  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $visited = New-Object 'bool[,]' $width, $height
  $queue = [System.Collections.Generic.Queue[System.Drawing.Point]]::new()

  for ($x = 0; $x -lt $width; $x++) {
    foreach ($y in @(0, ($height - 1))) {
      if (-not $visited[$x, $y]) {
        $color = $Bitmap.GetPixel($x, $y)
        if (Test-IsBackground -Color $color -Mode $mode) {
          $queue.Enqueue([System.Drawing.Point]::new($x, $y))
          $visited[$x, $y] = $true
        }
      }
    }
  }

  for ($y = 0; $y -lt $height; $y++) {
    foreach ($x in @(0, ($width - 1))) {
      if (-not $visited[$x, $y]) {
        $color = $Bitmap.GetPixel($x, $y)
        if (Test-IsBackground -Color $color -Mode $mode) {
          $queue.Enqueue([System.Drawing.Point]::new($x, $y))
          $visited[$x, $y] = $true
        }
      }
    }
  }

  $offsets = @(
    [System.Drawing.Point]::new(-1, 0),
    [System.Drawing.Point]::new(1, 0),
    [System.Drawing.Point]::new(0, -1),
    [System.Drawing.Point]::new(0, 1)
  )

  while ($queue.Count -gt 0) {
    $point = $queue.Dequeue()
    $current = $Bitmap.GetPixel($point.X, $point.Y)
    $Bitmap.SetPixel($point.X, $point.Y, [System.Drawing.Color]::FromArgb(0, $current.R, $current.G, $current.B))

    foreach ($offset in $offsets) {
      $nx = $point.X + $offset.X
      $ny = $point.Y + $offset.Y

      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $width -or $ny -ge $height) {
        continue
      }

      if ($visited[$nx, $ny]) {
        continue
      }

      $neighbor = $Bitmap.GetPixel($nx, $ny)
      if (Test-IsBackground -Color $neighbor -Mode $mode) {
        $visited[$nx, $ny] = $true
        $queue.Enqueue([System.Drawing.Point]::new($nx, $ny))
      }
    }
  }

  if ($mode -eq "light") {
    foreach ($value in 248..255) {
      $Bitmap.MakeTransparent([System.Drawing.Color]::FromArgb($value, $value, $value))
    }
  }
}

function Get-AlphaBounds {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      if ($Bitmap.GetPixel($x, $y).A -gt 0) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt 0 -or $maxY -lt 0) {
    return [System.Drawing.Rectangle]::new(0, 0, $Bitmap.Width, $Bitmap.Height)
  }

  $margin = 4
  $x = [Math]::Max(0, $minX - $margin)
  $y = [Math]::Max(0, $minY - $margin)
  $right = [Math]::Min($Bitmap.Width - 1, $maxX + $margin)
  $bottom = [Math]::Min($Bitmap.Height - 1, $maxY + $margin)

  return [System.Drawing.Rectangle]::new($x, $y, $right - $x + 1, $bottom - $y + 1)
}

function Save-NormalizedFace {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$OutputPath
  )

  Remove-Background -Bitmap $Bitmap
  $bounds = Get-AlphaBounds -Bitmap $Bitmap
  $subject = Get-CroppedBitmap -Bitmap $Bitmap -Rect $bounds

  try {
    $scale = [Math]::Min($contentBounds.Width / $subject.Width, $contentBounds.Height / $subject.Height)
    $drawWidth = [Math]::Max(1, [int][Math]::Round($subject.Width * $scale))
    $drawHeight = [Math]::Max(1, [int][Math]::Round($subject.Height * $scale))
    $destX = [int][Math]::Floor(($targetSize.Width - $drawWidth) / 2)
    $destY = [int][Math]::Max(0, $targetSize.Height - $bottomPadding - $drawHeight)

    $canvas = New-ArgbBitmap -Width $targetSize.Width -Height $targetSize.Height
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($subject, [System.Drawing.Rectangle]::new($destX, $destY, $drawWidth, $drawHeight))
      }
      finally {
        $graphics.Dispose()
      }

      $null = New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath)
      $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $canvas.Dispose()
    }
  }
  finally {
    $subject.Dispose()
  }
}

function Process-Sheet {
  param(
    [string]$SheetPath,
    [string]$Emotion,
    [int]$Columns = 4,
    [int]$Rows = 2
  )

  $bitmap = [System.Drawing.Bitmap]::new($SheetPath)
  try {
    $cellWidth = [int]($bitmap.Width / $Columns)
    $cellHeight = [int]($bitmap.Height / $Rows)
    $inset = 6
    $index = 1

    for ($row = 0; $row -lt $Rows; $row++) {
      for ($col = 0; $col -lt $Columns; $col++) {
        $rect = [System.Drawing.Rectangle]::new(
          ($col * $cellWidth) + $inset,
          ($row * $cellHeight) + $inset,
          $cellWidth - ($inset * 2),
          $cellHeight - ($inset * 2)
        )
        $cell = Get-CroppedBitmap -Bitmap $bitmap -Rect $rect
        try {
          $outputPath = Join-Path $facesRoot "$Emotion/$Emotion`_$index.png"
          Save-NormalizedFace -Bitmap $cell -OutputPath $outputPath
        }
        finally {
          $cell.Dispose()
        }

        $index++
      }
    }
  }
  finally {
    $bitmap.Dispose()
  }
}

function Process-IndividualSet {
  param(
    [string]$SourcePattern,
    [string]$Emotion
  )

  $index = 1
  foreach ($file in (Get-ChildItem $SourcePattern | Sort-Object Name)) {
    $bitmap = [System.Drawing.Bitmap]::new($file.FullName)
    try {
      $outputPath = Join-Path $facesRoot "$Emotion/$Emotion`_$index.png"
      Save-NormalizedFace -Bitmap $bitmap -OutputPath $outputPath
    }
    finally {
      $bitmap.Dispose()
    }

    $index++
  }
}

if ($Emotions -contains "angry") {
  Process-Sheet -SheetPath (Join-Path $facesRoot "anger 1-8.png") -Emotion "angry"
}

if ($Emotions -contains "happy") {
  Process-Sheet -SheetPath (Join-Path $facesRoot "happy 1-8.png") -Emotion "happy"
}

if ($Emotions -contains "sad") {
  Process-Sheet -SheetPath (Join-Path $facesRoot "sad 1-8.png") -Emotion "sad"
}

if ($Emotions -contains "afraid") {
  Process-IndividualSet -SourcePattern (Join-Path $facesRoot "fear *.png") -Emotion "afraid"
}

param(
  [string[]]$Emotions = @("angry", "happy", "sad", "afraid")
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$facesRoot = Join-Path $repoRoot "products/trident-g-iq-basic/assets/capacity/emotion/faces"
$diskInset = 0
$diskDiameter = 256
$diskMargin = 0

function New-ArgbBitmap {
  param(
    [int]$Width,
    [int]$Height
  )

  return [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Get-PrimaryComponentPixels {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $visited = New-Object 'bool[,]' $width, $height
  $offsets = @(
    [System.Drawing.Point]::new(-1, 0),
    [System.Drawing.Point]::new(1, 0),
    [System.Drawing.Point]::new(0, -1),
    [System.Drawing.Point]::new(0, 1)
  )

  $bestComponent = [System.Collections.Generic.List[System.Drawing.Point]]::new()

  for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
      if ($visited[$x, $y]) {
        continue
      }

      $visited[$x, $y] = $true
      if ($Bitmap.GetPixel($x, $y).A -eq 0) {
        continue
      }

      $queue = [System.Collections.Generic.Queue[System.Drawing.Point]]::new()
      $component = [System.Collections.Generic.List[System.Drawing.Point]]::new()
      $queue.Enqueue([System.Drawing.Point]::new($x, $y))

      while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        $component.Add($point)

        foreach ($offset in $offsets) {
          $nx = $point.X + $offset.X
          $ny = $point.Y + $offset.Y

          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $width -or $ny -ge $height) {
            continue
          }

          if ($visited[$nx, $ny]) {
            continue
          }

          $visited[$nx, $ny] = $true
          if ($Bitmap.GetPixel($nx, $ny).A -gt 0) {
            $queue.Enqueue([System.Drawing.Point]::new($nx, $ny))
          }
        }
      }

      if ($component.Count -gt $bestComponent.Count) {
        $bestComponent = $component
      }
    }
  }

  return $bestComponent
}

function Save-PrimaryFaceOnDisk {
  param(
    [string]$Path
  )

  $tmpPath = "$Path.tmp.png"
  $source = [System.Drawing.Bitmap]::new($Path)
  try {
    $primary = Get-PrimaryComponentPixels -Bitmap $source
    $subject = New-ArgbBitmap -Width $source.Width -Height $source.Height

    try {
      foreach ($point in $primary) {
        $subject.SetPixel($point.X, $point.Y, $source.GetPixel($point.X, $point.Y))
      }

      $minX = $subject.Width
      $minY = $subject.Height
      $maxX = -1
      $maxY = -1
      for ($y = 0; $y -lt $subject.Height; $y++) {
        for ($x = 0; $x -lt $subject.Width; $x++) {
          if ($subject.GetPixel($x, $y).A -gt 0) {
            if ($x -lt $minX) { $minX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -gt $maxY) { $maxY = $y }
          }
        }
      }

      if ($maxX -ge 0) {
        $subjectWidth = $maxX - $minX + 1
      } else {
        $subjectWidth = 1
      }
      if ($maxY -ge 0) {
        $subjectHeight = $maxY - $minY + 1
      } else {
        $subjectHeight = 1
      }
      $targetSize = [Math]::Max(1, $diskDiameter - ($diskMargin * 2))
      $scale = [Math]::Min($targetSize / $subjectWidth, $targetSize / $subjectHeight)
      $drawWidth = [int][Math]::Round($subjectWidth * $scale)
      $drawHeight = [int][Math]::Round($subjectHeight * $scale)
      $destX = [int][Math]::Round((($source.Width - $drawWidth) / 2))
      $destY = [int][Math]::Round((($source.Height - $drawHeight) / 2))

      $output = New-ArgbBitmap -Width $source.Width -Height $source.Height

      try {
        $graphics = [System.Drawing.Graphics]::FromImage($output)
        try {
          $graphics.Clear([System.Drawing.Color]::Transparent)
          $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
          $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
          $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

          $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
          try {
            $graphics.FillEllipse($brush, $diskInset, $diskInset, $diskDiameter, $diskDiameter)
          }
          finally {
            $brush.Dispose()
          }

          $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
          try {
            $clipPath.AddEllipse($diskInset, $diskInset, $diskDiameter, $diskDiameter)
            $graphics.SetClip($clipPath)
            $graphics.DrawImage(
              $subject,
              [System.Drawing.Rectangle]::new($destX, $destY, $drawWidth, $drawHeight),
              [System.Drawing.Rectangle]::new($minX, $minY, $subjectWidth, $subjectHeight),
              [System.Drawing.GraphicsUnit]::Pixel
            )
            $graphics.ResetClip()
          }
          finally {
            $clipPath.Dispose()
          }
        }
        finally {
          $graphics.Dispose()
        }

        $output.Save($tmpPath, [System.Drawing.Imaging.ImageFormat]::Png)
      }
      finally {
        $output.Dispose()
      }
    }
    finally {
      $subject.Dispose()
    }
  }
  finally {
    $source.Dispose()
  }

  Remove-Item -LiteralPath $Path -Force
  Move-Item -LiteralPath $tmpPath -Destination $Path -Force
}

foreach ($emotion in $Emotions) {
  $emotionDir = Join-Path $facesRoot $emotion
  if (-not (Test-Path -LiteralPath $emotionDir)) {
    continue
  }

  Get-ChildItem -LiteralPath $emotionDir -Filter "$emotion`_*.png" -File |
    Where-Object { $_.Name -notlike "*black-disk*" } |
    Sort-Object Name |
    ForEach-Object {
      Save-PrimaryFaceOnDisk -Path $_.FullName
    }
}

$previewPath = Join-Path $facesRoot "angry/angry_1_black-disk.png"
if (Test-Path -LiteralPath $previewPath) {
  Remove-Item -LiteralPath $previewPath -Force
}

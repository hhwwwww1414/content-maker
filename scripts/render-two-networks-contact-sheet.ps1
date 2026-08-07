$ErrorActionPreference = 'Stop'

$timeline = Get-Content -Raw 'src/generated/timeline-two-networks.json' | ConvertFrom-Json
$lastFrame = [Math]::Max(0, [int]$timeline.durationInFrames - 1)
$frames = @(0, 0.08, 0.16, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.0) | ForEach-Object {
  [Math]::Min($lastFrame, [Math]::Round($lastFrame * $_))
}
$outDir = Resolve-Path 'out'
$remotion = Join-Path (Resolve-Path '.').Path 'node_modules/@remotion/cli/remotion-cli.js'
$files = @()

for ($i = 0; $i -lt $frames.Count; $i++) {
  $file = Join-Path $outDir ("qa-contact-two-networks-{0:D2}.jpg" -f $i)
  & node $remotion still GhostPepeTwoNetworksReel $file "--frame=$($frames[$i])" "--jpeg-quality=82"
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  $files += $file
}

Add-Type -AssemblyName System.Drawing
$thumbW = 270
$thumbH = 480
$sheet = New-Object System.Drawing.Bitmap ($thumbW * 3), ($thumbH * 4)
$graphics = [System.Drawing.Graphics]::FromImage($sheet)
$graphics.Clear([System.Drawing.Color]::FromArgb(5, 10, 11))

for ($i = 0; $i -lt $files.Count; $i++) {
  $image = [System.Drawing.Image]::FromFile($files[$i])
  $x = ($i % 3) * $thumbW
  $y = [Math]::Floor($i / 3) * $thumbH
  $graphics.DrawImage($image, $x, $y, $thumbW, $thumbH)
  $image.Dispose()
}

$sheet.Save((Join-Path $outDir 'qa-contact-sheet.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$graphics.Dispose()
$sheet.Dispose()

foreach ($file in $files) {
  Remove-Item -LiteralPath $file -Force
}

Write-Host "Wrote out/qa-contact-sheet.jpg"

param(
  [string]$SourceDir = "data/gifs",
  [string]$TargetDir = "public/placeholders"
)

if (-not (Test-Path $SourceDir)) {
  Write-Error "Source directory '$SourceDir' not found"
  exit 1
}

if (-not (Test-Path $TargetDir)) {
  New-Item -ItemType Directory -Path $TargetDir | Out-Null
}

Get-ChildItem -Path $SourceDir -Filter *.gif | ForEach-Object {
  $src = $_.FullName
  $dest = Join-Path (Get-Item $TargetDir).FullName $_.Name
  Copy-Item -Path $src -Destination $dest -Force
  Write-Output "Copied $($_.Name) -> $TargetDir"
}

Write-Output "Done. Remember to commit changes locally when satisfied."

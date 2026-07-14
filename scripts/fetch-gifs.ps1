<#
Fetch GIFs/WebP from a list and save to public/placeholders/, then update data/workouts.json to reference downloaded filenames.

Usage:
1. Copy `gif-urls.txt.example` -> `gif-urls.txt` and fill in URLs:
   Format per line: <filename> <url>
   Example: DB_RDL.gif https://upload.wikimedia.org/wikimedia/commons/....gif
2. Run from repo root in PowerShell:
   .\scripts\fetch-gifs.ps1 -InputFile gif-urls.txt

This script will NOT push to git. It will create a local commit you can review.
#>

param(
  [string]$InputFile = "gif-urls.txt"
)

if (-not (Test-Path $InputFile)) {
  Write-Error "Input file '$InputFile' not found. Copy gif-urls.txt.example to $InputFile and fill with URLs."
  exit 2
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repoRoot

$placeholdersDir = Join-Path $repoRoot "public\placeholders"
if (-not (Test-Path $placeholdersDir)) { New-Item -ItemType Directory -Path $placeholdersDir | Out-Null }

$lines = Get-Content $InputFile | Where-Object { $_ -and -not ($_ -match '^[#;]') }
$downloaded = @()

foreach ($ln in $lines) {
  $parts = $ln -split '\s+',2
  if ($parts.Count -lt 2) { Write-Warning "Skipping invalid line: $ln"; continue }
  $name = $parts[0].Trim()
  $url  = $parts[1].Trim()
  $outPath = Join-Path $placeholdersDir $name
  try {
    Write-Host "Downloading $url -> $outPath"
    Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $outPath -ErrorAction Stop
    $downloaded += $name
  } catch {
    Write-Warning "Failed to download $url : $_"
  }
}

if ($downloaded.Count -eq 0) {
  Write-Warning "No files downloaded. Exiting."
  Pop-Location
  exit 0
}

# Update data/workouts.json: if any gif field references the same base name, replace with downloaded filename
$dataFile = Join-Path $repoRoot "data\workouts.json"
if (-not (Test-Path $dataFile)) { Write-Warning "data/workouts.json not found; skipping JSON update."; Pop-Location; exit 0 }

$json = Get-Content $dataFile -Raw | ConvertFrom-Json

foreach ($dayKey in $json.psobject.Properties.Name) {
  $day = $json.$dayKey
  if ($day -is [System.Management.Automation.PSCustomObject]) {
    if ($day.session) {
      foreach ($s in $day.session) {
        if ($s.gif) {
          foreach ($fn in $downloaded) {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($fn)
            if ($s.gif -like "$base*") { $s.gif = $fn }
          }
        }
      }
    }
    if ($day.am -and $day.am.session) {
      foreach ($s in $day.am.session) { if ($s.gif) { foreach ($fn in $downloaded) { $base = [System.IO.Path]::GetFileNameWithoutExtension($fn); if ($s.gif -like "$base*") { $s.gif = $fn } } } }
    }
    if ($day.pm -and $day.pm.session) {
      foreach ($s in $day.pm.session) { if ($s.gif) { foreach ($fn in $downloaded) { $base = [System.IO.Path]::GetFileNameWithoutExtension($fn); if ($s.gif -like "$base*") { $s.gif = $fn } } } }
    }
  }
}

$json | ConvertTo-Json -Depth 10 | Set-Content $dataFile -Encoding UTF8
Write-Host "Updated $dataFile with downloaded filenames where applicable."

# Commit locally
git add $placeholdersDir\* | Out-Null
git add data\workouts.json | Out-Null
& git commit -m "chore: add downloaded exercise media (local commit)"
if ($LASTEXITCODE -ne 0) { Write-Host "No changes to commit." }

Pop-Location
Write-Host "Done. GIFs downloaded: $($downloaded -join ', '). Files staged and committed locally (no push)."

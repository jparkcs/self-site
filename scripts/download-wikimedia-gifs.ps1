<#
Search Wikimedia Commons for exercise GIFs, download matches into public/placeholders/,
and update data/workouts.json to reference the downloaded filenames. Makes a local git commit only.

Run from repo root:
  .\scripts\download-wikimedia-gifs.ps1

This script attempts to find GIFs; if none are found for an exercise, it leaves the data unchanged.
#>

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location $repoRoot

$placeholdersDir = Join-Path $repoRoot 'public\placeholders'
if (-not (Test-Path $placeholdersDir)) { New-Item -ItemType Directory -Path $placeholdersDir | Out-Null }

$dataFile = Join-Path $repoRoot 'data\workouts.json'
if (-not (Test-Path $dataFile)) { Write-Error "data/workouts.json not found"; exit 2 }

$json = Get-Content $dataFile -Raw | ConvertFrom-Json

# Build list of unique search terms from the JSON gif fields and names
$targets = @{}

function Add-Target($baseName, $searchTerm) {
  if (-not $targets.ContainsKey($baseName)) { $targets[$baseName] = $searchTerm }
}

foreach ($dayKey in $json.psobject.Properties.Name) {
  $day = $json.$dayKey
  if ($day -is [System.Management.Automation.PSCustomObject]) {
    if ($day.session) { foreach ($s in $day.session) { if ($s.gif) { $base = [System.IO.Path]::GetFileNameWithoutExtension($s.gif); Add-Target $base ($s.name) } } }
    if ($day.am -and $day.am.session) { foreach ($s in $day.am.session) { if ($s.gif) { $base = [System.IO.Path]::GetFileNameWithoutExtension($s.gif); Add-Target $base ($s.name) } } }
    if ($day.pm -and $day.pm.session) { foreach ($s in $day.pm.session) { if ($s.gif) { $base = [System.IO.Path]::GetFileNameWithoutExtension($s.gif); Add-Target $base ($s.name) } } }
  }
}

Write-Host "Will search Wikimedia Commons for $($targets.Count) targets..."

$headers = @{ 'User-Agent' = 'self-site-fetcher/1.0 (https://github.com/jparkcs/self-site)'}

$downloaded = @()

foreach ($kv in $targets.GetEnumerator()) {
  $base = $kv.Key
  $term = $kv.Value
  Write-Host "Searching for: $term (base: $base)"

  $sr = [System.Uri]::EscapeDataString($term)
  $searchUrl = "https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=$sr&srnamespace=6&srlimit=5"
  # retry on 429 a few times
  $attempt = 0
  $resp = $null
  while ($attempt -lt 4 -and -not $resp) {
    try {
      $resp = Invoke-RestMethod -Uri $searchUrl -Method Get -UseBasicParsing -Headers $headers
    } catch {
      $attempt++
      $code = $_.Exception.Response.StatusCode.value__ 2>$null
      if ($code -eq 429) {
        $wait = 1 * $attempt
        Write-Host "Received 429; retrying in $wait seconds..."
        Start-Sleep -Seconds $wait
        continue
      } else {
        Write-Warning ("Search failed for {0}: {1}" -f $term, $_.Exception.Message)
        break
      }
    }
  }
  if (-not $resp) { Write-Host "No file search results for $term"; Start-Sleep -Seconds 1; continue }
  if (-not $resp.query.search) { Write-Host "No file search results for $term"; continue }

  $found = $false
  foreach ($item in $resp.query.search) {
    $title = $item.title # e.g. File:Some_name.gif
    $titleEsc = [System.Uri]::EscapeDataString($title)
    $infoUrl = "https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=$titleEsc&prop=imageinfo&iiprop=url|mime|size&formatversion=2"
    try {
      $info = Invoke-RestMethod -Uri $infoUrl -Method Get -UseBasicParsing -Headers $headers
    } catch {
      continue
    }
    if (-not $info.query.pages) { continue }
    foreach ($p in $info.query.pages) {
      if ($p.imageinfo) {
        foreach ($ii in $p.imageinfo) {
          $mime = $ii.mime
          $url = $ii.url
          if ($mime -and $mime -like 'image/gif' -or ($url -and $url.ToLower().EndsWith('.gif'))) {
            Write-Host "Found GIF: $url"
            $outFile = Join-Path $placeholdersDir ($base + '.gif')
            try {
              Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -Headers $headers -ErrorAction Stop
              $downloaded += ($base + '.gif')
              $found = $true
              break
            } catch {
              Write-Warning ("Failed to download {0}: {1}" -f $url, $_.Exception.Message)
            }
          }
        }
      }
      if ($found) { break }
    }
    if ($found) { break }
  }
  if (-not $found) { Write-Host "No GIF found for $term" }
  Start-Sleep -Seconds 1
}

if ($downloaded.Count -eq 0) { Write-Host "No GIFs downloaded."; Pop-Location; exit 0 }

Write-Host "Downloaded: $($downloaded -join ', ')"

# Update JSON: replace gif fields that have same base name
foreach ($dayKey in $json.psobject.Properties.Name) {
  $day = $json.$dayKey
  if ($day -is [System.Management.Automation.PSCustomObject]) {
    if ($day.session) { foreach ($s in $day.session) { if ($s.gif) { $base = [System.IO.Path]::GetFileNameWithoutExtension($s.gif); foreach ($d in $downloaded) { if ($d -like "$base.*") { $s.gif = $d } } } } }
    if ($day.am -and $day.am.session) { foreach ($s in $day.am.session) { if ($s.gif) { $base = [System.IO.Path]::GetFileNameWithoutExtension($s.gif); foreach ($d in $downloaded) { if ($d -like "$base.*") { $s.gif = $d } } } } }
    if ($day.pm -and $day.pm.session) { foreach ($s in $day.pm.session) { if ($s.gif) { $base = [System.IO.Path]::GetFileNameWithoutExtension($s.gif); foreach ($d in $downloaded) { if ($d -like "$base.*") { $s.gif = $d } } } } }
  }
}

$json | ConvertTo-Json -Depth 10 | Set-Content $dataFile -Encoding UTF8

# Commit locally
git add public/placeholders/* | Out-Null
git add data/workouts.json | Out-Null
& git commit -m "chore: add Wikimedia exercise GIFs (local commit)"
if ($LASTEXITCODE -ne 0) { Write-Host "No changes to commit." }

Pop-Location
Write-Host "Done. Local commit created; no push performed." 

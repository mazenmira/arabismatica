Add-Type -AssemblyName System.IO.Compression.FileSystem

$base = "D:\GitHub\arab-catalogue-next\arabismatica"
$dest = "C:\Users\mazen\Desktop\arabismatica-rebuild.zip"

if (Test-Path $dest) { Remove-Item $dest -Force }

$archive = [System.IO.Compression.ZipFile]::Open($dest, [System.IO.Compression.ZipArchiveMode]::Create)

$files = @(
  "src/lib/catalogues.ts",
  "src/lib/coins.ts",
  "src/lib/coinsApi.ts",
  "src/components/layout/CatalogueShell.tsx",
  "src/components/islamic/IslamicPage.tsx",
  "src/components/catalogue/CataloguePage.tsx",
  "src/components/header/SiteHeader.tsx",
  "src/app/[locale]/layout.tsx",
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/islamic/page.tsx",
  "src/app/[locale]/islamic/layout.tsx",
  "src/app/[locale]/islamic/dynasties/page.tsx",
  "src/app/[locale]/islamic/mints/page.tsx",
  "src/app/[locale]/islamic/rulers/page.tsx",
  "src/app/[locale]/islamic/coin-index/page.tsx",
  "src/app/sitemap.ts",
  "public/robots.txt"
)

foreach ($rel in $files) {
  $winPath = $rel.Replace("/", "\")
  $full    = Join-Path $base $winPath
  $item    = Get-Item -LiteralPath $full
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $item.FullName, $rel) | Out-Null
  Write-Host "  + $rel"
}

$archive.Dispose()
$kb = [math]::Round((Get-Item $dest).Length / 1KB, 1)
Write-Host ""
Write-Host "Created: $dest  ($kb KB, $($files.Count) files)"

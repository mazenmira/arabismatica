# finish-all.ps1
# Waits for pipeline-extra (PID 10680), runs P4, enriches, updates latest, zips.
# Launch: Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File scripts/finish-all.ps1" -WorkingDirectory "D:/GitHub/arab-catalogue-next/arabismatica" -NoNewWindow -RedirectStandardOutput scripts/finish-all.log

$ROOT = "D:/GitHub/arab-catalogue-next/arabismatica"
$LOG  = "$ROOT/scripts/finish-all.log"

function Write-Log($msg) {
  $ts = Get-Date -Format "HH:mm:ss"
  $line = "[$ts] $msg"
  Add-Content -Path $LOG -Value $line
  Write-Host $line
}

Write-Log "=== finish-all.ps1 started ==="

# ── Step 1: Wait for pipeline-extra (PID 10680) ───────────────────────────────
$pid1 = 10680
$proc = Get-Process -Id $pid1 -ErrorAction SilentlyContinue
if ($proc) {
  Write-Log "Waiting for pipeline-extra (PID $pid1) to finish..."
  $proc.WaitForExit()
  Write-Log "pipeline-extra done. Exit code: $($proc.ExitCode)"
} else {
  Write-Log "pipeline-extra (PID $pid1) already finished."
}

# Show pipeline-extra final lines
Write-Log "pipeline-extra last log:"
$extraLog = "$ROOT/scripts/pipeline-extra.log"
if (Test-Path $extraLog) {
  Get-Content $extraLog -Tail 8 | ForEach-Object { Write-Log "  $_" }
}

# ── Step 2: Run pipeline-p4 (Buyid + Samanid + tsc + latest + zip) ───────────
Write-Log ""
Write-Log "Starting pipeline-p4 (Buyid + Samanid)..."

$p4 = Start-Process -FilePath "node" `
  -ArgumentList "scripts/pipeline-p4.js" `
  -WorkingDirectory $ROOT `
  -NoNewWindow `
  -RedirectStandardOutput "$ROOT/scripts/pipeline-p4.log" `
  -RedirectStandardError  "$ROOT/scripts/pipeline-p4-error.log" `
  -PassThru

Write-Log "pipeline-p4 PID: $($p4.Id)"
$p4.WaitForExit()
Write-Log "pipeline-p4 done. Exit code: $($p4.ExitCode)"

if (Test-Path "$ROOT/scripts/pipeline-p4.log") {
  Write-Log "pipeline-p4 last log:"
  Get-Content "$ROOT/scripts/pipeline-p4.log" -Tail 12 | ForEach-Object { Write-Log "  $_" }
}

# ── Step 3: Enrich all Zeno coins (v2) ────────────────────────────────────────
Write-Log ""
Write-Log "Running enrich-zeno-v2.js..."

$enrichOut = node scripts/enrich-zeno-v2.js 2>&1
$enrichOut | ForEach-Object { Write-Log "  $_" }

# ── Step 4: Update latest_additions.json ─────────────────────────────────────
Write-Log ""
Write-Log "Updating latest_additions.json..."

$latestOut = node scripts/latest-additions.js 2>&1
$latestOut | ForEach-Object { Write-Log "  $_" }

# ── Step 5: Create handoff.zip ────────────────────────────────────────────────
Write-Log ""
Write-Log "Creating handoff.zip..."

$zipPath = "$ROOT/scripts/handoff.zip"
$tmpDir  = "$ROOT/scripts/_handoff_final_tmp"

$files = @(
  "src/data/coins.json",
  "src/data/latest_additions.json"
)

if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }

foreach ($f in $files) {
  $src  = Join-Path $ROOT $f
  $dest = Join-Path $tmpDir $f
  $dir  = Split-Path $dest -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Copy-Item $src $dest
  $kb = [math]::Round((Get-Item $src).Length / 1KB, 1)
  Write-Log "  $f  ($kb KB)"
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$tmpDir/*" -DestinationPath $zipPath -Force
Remove-Item $tmpDir -Recurse -Force

$zipKB = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Log "  handoff.zip: $zipKB KB"

# ── Final coin count ──────────────────────────────────────────────────────────
Write-Log ""
Write-Log "=== FINAL SUMMARY ==="

$cmd = 'node -e "const c=require(\"./src/data/coins.json\"); const dyn={}; c.forEach(x=>{ dyn[x.dyn||\"(none)\"]=(dyn[x.dyn||\"(none)\"]||0)+1; }); const sorted=Object.entries(dyn).sort((a,b)=>b[1]-a[1]); console.log(\"TOTAL:\",c.length); sorted.slice(0,30).forEach(([d,n])=>console.log(n.toString().padStart(7),\" \",d)); "'

$out = Invoke-Expression $cmd
$out | ForEach-Object { Write-Log "  $_" }

Write-Log ""
Write-Log "=== All done. handoff.zip is at: $zipPath ==="

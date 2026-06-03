# run-sequel.ps1
# Waits for pipeline-extra (PID 10680) to finish, then runs pipeline-p4.
# Launch detached: Start-Process powershell -ArgumentList "-File scripts/run-sequel.ps1" -WindowStyle Hidden

$ROOT = "D:/GitHub/arab-catalogue-next/arabismatica"
$LOG  = "$ROOT/scripts/run-sequel.log"

function Write-Log($msg) {
  $ts = Get-Date -Format "HH:mm:ss"
  "[$ts] $msg" | Tee-Object -FilePath $LOG -Append | Write-Host
}

Write-Log "run-sequel.ps1 started"

# ── Step 1: Wait for pipeline-extra (PID 10680) to exit ──────────────────────
$extraPid = 10680
$proc = Get-Process -Id $extraPid -ErrorAction SilentlyContinue
if ($proc) {
  Write-Log "Waiting for pipeline-extra (PID $extraPid) to finish..."
  $proc.WaitForExit()
  Write-Log "pipeline-extra exited (code $($proc.ExitCode))"
} else {
  Write-Log "pipeline-extra PID $extraPid not found — already finished or not started"
}

# Verify pipeline-extra log shows completion
$extraLog = "$ROOT/scripts/pipeline-extra.log"
if (Test-Path $extraLog) {
  $lastLines = Get-Content $extraLog -Tail 5
  Write-Log "pipeline-extra last log lines:"
  $lastLines | ForEach-Object { Write-Log "  $_" }
}

# ── Step 2: Run pipeline-p4 (Buyid + Samanid + tsc + latest + zip) ───────────
Write-Log ""
Write-Log "Starting pipeline-p4 (Buyid + Samanid + finishing tasks)..."

$p4Log   = "$ROOT/scripts/pipeline-p4.log"
$p4Err   = "$ROOT/scripts/pipeline-p4-error.log"

$proc4 = Start-Process -FilePath "node" `
  -ArgumentList "scripts/pipeline-p4.js" `
  -WorkingDirectory $ROOT `
  -NoNewWindow `
  -RedirectStandardOutput $p4Log `
  -RedirectStandardError  $p4Err `
  -PassThru

Write-Log "pipeline-p4 PID: $($proc4.Id)"
$proc4.WaitForExit()
Write-Log "pipeline-p4 exited (code $($proc4.ExitCode))"

# Print final log
if (Test-Path $p4Log) {
  Write-Log ""
  Write-Log "=== pipeline-p4 final output ==="
  Get-Content $p4Log -Tail 30 | ForEach-Object { Write-Log "  $_" }
}

Write-Log ""
Write-Log "All pipelines complete."

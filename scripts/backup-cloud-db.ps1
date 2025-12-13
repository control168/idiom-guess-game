$ErrorActionPreference = "Stop"

$ProjectId = "gen-lang-client-0631854585"
$InstanceName = "guess-what-postgresql"

Write-Host "Triggering Manual Backup for CloudSQL Instance: $InstanceName"
Write-Host "Project: $ProjectId"

$backupCmd = "gcloud sql backups create --instance $InstanceName --async --project $ProjectId"
Write-Host "Executing: $backupCmd"
cmd /c $backupCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBackup operation triggered successfully!" -ForegroundColor Green
    Write-Host "This is an async operation. You can check status in the Console."
}
else {
    Write-Host "`nBackup trigger failed." -ForegroundColor Red
}

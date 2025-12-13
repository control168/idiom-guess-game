$ErrorActionPreference = "Stop"

$ProjectId = "gen-lang-client-0631854585"
$Region = "asia-east1"
$InstanceName = "guess-what-postgresql"
$ServiceName = "idiom-game"

Write-Host "----------------------------------------"
Write-Host "Applying Cost Control Safeguards"
Write-Host "Project: $ProjectId"
Write-Host "----------------------------------------"

# 1. Cloud Run Limits
Write-Host "`n[1/2] limiting Cloud Run max instances..."
# Set max instances to 2 (User requested strict limit)
# Set memory to 512Mi (Next.js requirement)
$runCmd = "gcloud run services update $ServiceName --max-instances 2 --memory 512Mi --region $Region --project $ProjectId"
Write-Host "Executing: $runCmd"
cmd /c $runCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Cloud Run limits updated successfully." -ForegroundColor Green
}
else {
    Write-Host "Failed to update Cloud Run limits." -ForegroundColor Red
}

# 2. Cloud SQL Downscaling
Write-Host "`n[2/2] Downscaling Cloud SQL instance..."
Write-Host "Current tier is likely 'db-perf-optimized' (High Cost)."
Write-Host "Attempting to switch to 'db-f1-micro' (Shared Core, ~$10/mo)..."

# Note: Enterprise Plus instances might need to be switched to Enterprise first or simpler tiers.
# We try updating the edition and tier.
$sqlCmd = "gcloud sql instances patch $InstanceName --tier db-f1-micro --edition ENTERPRISE --project $ProjectId"
Write-Host "Executing: $sqlCmd"
cmd /c $sqlCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Cloud SQL downscaled successfully!" -ForegroundColor Green
}
else {
    Write-Host "Failed to downscale Cloud SQL directly. Trying 'db-g1-small'..."
    $sqlCmdRetry = "gcloud sql instances patch $InstanceName --tier db-g1-small --edition ENTERPRISE --project $ProjectId"
    cmd /c $sqlCmdRetry
}

Write-Host "`n----------------------------------------"
Write-Host "Cost Control Setup Complete"
Write-Host "Please verify Billing Budgets in the GCP Console:"
Write-Host "https://console.cloud.google.com/billing"

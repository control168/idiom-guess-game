param(
    [string]$ProjectId,
    [string]$Region = "us-central1",
    [string]$RepoName = "my-repo",
    [string]$ImageName = "idiom-game"
)

$ErrorActionPreference = "Stop"

if (-not $ProjectId) {
    $ProjectId = Read-Host "Enter your GCP Project ID"
}

Write-Host "Deploying to Project: $ProjectId" -ForegroundColor Cyan

# 1. Enable Services
Write-Host "Enabling services..." -ForegroundColor Yellow
cmd /c "gcloud services enable artifactregistry.googleapis.com run.googleapis.com --project $ProjectId"

# 2. Create Repo
Write-Host "Checking Artifact Registry repository..." -ForegroundColor Yellow
$repoCheck = cmd /c "gcloud artifacts repositories describe $RepoName --location=$Region --project=$ProjectId 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating repository $RepoName..." -ForegroundColor Yellow
    cmd /c "gcloud artifacts repositories create $RepoName --repository-format=docker --location=$Region --project=$ProjectId"
}
else {
    Write-Host "Repository $RepoName already exists." -ForegroundColor Green
}

# 3. Build and Submit (Cloud Build)
$ImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/$ImageName`:latest"
Write-Host "Building and pushing image to $ImageTag..." -ForegroundColor Yellow
# Using gcloud builds submit is easier than local docker push
cmd /c "gcloud builds submit --tag $ImageTag --project $ProjectId"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Exiting." -ForegroundColor Red
    exit 1
}

# 4. Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow

$DatabaseUrl = $env:DATABASE_URL
if (-not $DatabaseUrl) {
    Write-Host "WARNING: DATABASE_URL environment variable is not found in current session." -ForegroundColor Magenta
    $DatabaseUrl = Read-Host "Enter your DATABASE_URL (or press Enter to update it later in Console)"
}

$deployCmd = "gcloud run deploy $ImageName --image $ImageTag --region $Region --allow-unauthenticated --project $ProjectId"

if ($DatabaseUrl) {
    # Using double double-quotes to escape quotes within a PowerShell string
    $deployCmd += " --set-env-vars DATABASE_URL=""$DatabaseUrl"""
}

Write-Host "Executing: $deployCmd" -ForegroundColor DarkGray
cmd /c $deployCmd

Write-Host "Deployment Logic Complete!" -ForegroundColor Green

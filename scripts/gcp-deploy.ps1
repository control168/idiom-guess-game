# GCP Deploy Script
# Usage: .\scripts\gcp-deploy.ps1 -ProjectId "your-project-id" -Region "asia-east1" -InstanceConnectionName "project:region:instance"

param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [string]$Region = "asia-east1",
    
    [string]$RepoName = "idiom-game-repo",
    
    [string]$ServiceName = "idiom-guess-game",
    
    [string]$ImageTag = "latest",
    
    [Parameter(Mandatory = $true)]
    [string]$InstanceConnectionName,

    [string]$DatabaseUrl
)

$ErrorActionPreference = "Stop"

$ImageUri = "$Region-docker.pkg.dev/$ProjectId/$RepoName/$ServiceName`:$ImageTag"

Write-Host "Deploying to Cloud Run..."
Write-Host "Project: $ProjectId"
Write-Host "Image: $ImageUri"
Write-Host "Service: $ServiceName"

# 1. Build Docker Image
Write-Host "Building Docker Image..."
# Using --platform linux/amd64 to ensure compatibility with Cloud Run
docker build --platform linux/amd64 -t $ImageUri .

# 2. Configure Docker Auth
Write-Host "Configuring Docker Authentication for Artifact Registry..."
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet

# 3. Push Image
Write-Host "Pushing Image to Artifact Registry..."
docker push $ImageUri

# 4. Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..."
# Construct environment variables string
$envVars = "DATABASE_URL=$DatabaseUrl"

gcloud run deploy $ServiceName `
    --image $ImageUri `
    --region $Region `
    --project $ProjectId `
    --allow-unauthenticated `
    --add-cloudsql-instances $InstanceConnectionName `
    --set-env-vars "$envVars" `
    --port 3000

Write-Host "Deployment Complete!"


$ErrorActionPreference = "Stop"

$ProjectId = "gen-lang-client-0631854585"
$Region = "asia-east1"
$InstanceName = "guess-what-postgresql"
$RepoName = "my-repo"
$ImageName = "idiom-game"

# Database Configuration
$DbUser = "idiom-app"
# Password URL encoded: SafePassw0rd2025!
$DbPassEncoded = "SafePassw0rd2025!"
$DbName = "idiom-game"
$ConnectionName = "${ProjectId}:${Region}:${InstanceName}"

# Connection String for Cloud Run (using Unix socket)
$DatabaseUrl = "postgresql://$($DbUser):$($DbPassEncoded)@localhost/$($DbName)?host=/cloudsql/$($ConnectionName)"

# Image Tag
$ImageTag = "$Region-docker.pkg.dev/$ProjectId/$RepoName/$ImageName`:latest"

Write-Host "----------------------------------------"
Write-Host "Deploying to Cloud Run: $ImageName"
Write-Host "Project:       $ProjectId"
Write-Host "Region:        $Region"
Write-Host "Image:         $ImageTag"
Write-Host "DB Connection: $ConnectionName"
Write-Host "----------------------------------------"

# Build and Push Image
Write-Host "Building and Pushing Image..."
cmd /c "gcloud builds submit --tag $ImageTag --project $ProjectId"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build Failed!" -ForegroundColor Red
    exit 1
}

# Deploy Command
$deployCmd = "gcloud run deploy $ImageName --image $ImageTag --region $Region --allow-unauthenticated --project $ProjectId --add-cloudsql-instances=$ConnectionName --set-env-vars ""DATABASE_URL=$DatabaseUrl"""

Write-Host "Executing deployment..."
cmd /c $deployCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment Successful!" -ForegroundColor Green
}
else {
    Write-Host "Deployment Failed!" -ForegroundColor Red
    exit 1
}

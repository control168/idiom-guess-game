# GCP Setup Script
# Usage: .\scripts\gcp-setup.ps1 -ProjectId "your-project-id" -Region "asia-east1"

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,

    [string]$Region = "asia-east1",
    
    [string]$RepoName = "idiom-game-repo",
    
    [string]$InstanceName = "idiom-game-db-instance",
    
    [string]$DatabaseName = "idiom-game-db",
    
    [string]$DbUser = "idiom-admin"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up GCP resources for project: $ProjectId in region: $Region"

# 1. Enable APIs
Write-Host "Enabling Google Cloud APIs..."
gcloud services enable run.googleapis.com sql-component.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com --project $ProjectId

# 2. Create Artifact Registry Repository
Write-Host "Checking Artifact Registry Repository..."
$repoExists = gcloud artifacts repositories list --project=$ProjectId --location=$Region --filter="name:$RepoName" --format="value(name)"
if (-not $repoExists) {
    Write-Host "Creating Artifact Registry Repository '$RepoName'..."
    gcloud artifacts repositories create $RepoName --repository-format=docker --location=$Region --description="Docker repository for Idiom Guess Game" --project=$ProjectId
} else {
    Write-Host "Repository '$RepoName' already exists."
}

# 3. Create Cloud SQL Instance
Write-Host "Checking Cloud SQL Instance..."
$instanceExists = gcloud sql instances list --project=$ProjectId --filter="name:$InstanceName" --format="value(name)"
if (-not $instanceExists) {
    Write-Host "Creating Cloud SQL Instance '$InstanceName' (PostgreSQL)... This may take a few minutes."
    # Using specific tier to save cost for dev/test, e.g., db-f1-micro
    gcloud sql instances create $InstanceName --database-version=POSTGRES_15 --cpu=1 --memory=3840MB --region=$Region --project=$ProjectId --root-password="ChangeMe123!"
} else {
    Write-Host "Cloud SQL Instance '$InstanceName' already exists."
}

# 4. Create Database
Write-Host "Creating Database '$DatabaseName'..."
try {
    gcloud sql databases create $DatabaseName --instance=$InstanceName --project=$ProjectId
} catch {
    Write-Host "Database might already exist or error occurred: $_"
}

# 5. Create User
Write-Host "Creating User '$DbUser'..."
# Generate a random password or ask user to change it later. For now simple.
$DbPassword = "SecurePassword123!" 
try {
    gcloud sql users create $DbUser --instance=$InstanceName --password=$DbPassword --project=$ProjectId
} catch {
     Write-Host "User might already exist or error occurred: $_"
}

# Output Connection Name
$connectionName = gcloud sql instances describe $InstanceName --project=$ProjectId --format="value(connectionName)"
Write-Host "`nSetup Complete!"
Write-Host "------------------------------------------------"
Write-Host "Instance Connection Name: $connectionName"
Write-Host "Database Name:            $DatabaseName"
Write-Host "Database User:            $DbUser"
Write-Host "Database Password:        $DbPassword (Please change this in production!)"
Write-Host "Start migration using the connection name."
Write-Host "------------------------------------------------"

# GCP Migration Script
# Usage: .\scripts\gcp-migrate.ps1 -InstanceConnectionName "project:region:instance" -DatabaseUrl "postgresql://user:pass@localhost:5432/db"

param(
    [Parameter(Mandatory = $true)]
    [string]$InstanceConnectionName,

    [string]$LocalPort = "5432"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Database Migration..."

# Check if cloud-sql-proxy is installed
if (-not (Get-Command "cloud-sql-proxy" -ErrorAction SilentlyContinue)) {
    Write-Warning "cloud-sql-proxy not found in PATH."
    Write-Warning "Please install it from: https://cloud.google.com/sql/docs/postgres/sql-proxy"
    Write-Warning "Or download it specifically for this script."
    exit 1
}

Write-Host "Starting Cloud SQL Proxy in the background..."
$proxyProcess = Start-Process -FilePath "cloud-sql-proxy" -ArgumentList "$InstanceConnectionName --port $LocalPort" -PassThru -NoNewWindow

Write-Host "Waiting for proxy to initialize (5 seconds)..."
Start-Sleep -Seconds 5

try {
    Write-Host "Running Prisma Migrate..."
    # Ensure DATABASE_URL points to localhost for the migration
    # The user must ensure the DATABASE_URL passed to this script or in .env matches the local proxy.
    # We will assume .env or environment variable is set correctly for localhost usage, 
    # but we can force it here for the command scope if provided in a specific way, 
    # however, prisma reads from .env usually.
    
    Write-Host "IMPORTANT: Ensure your .env file has DATABASE_URL='postgresql://USER:PASSWORD@localhost:$LocalPort/DB_NAME'"
    
    npx prisma migrate deploy
    
    Write-Host "Migration Complete!"

}
catch {
    Write-Error "Migration Failed: $_"
}
finally {
    Write-Host "Stopping Cloud SQL Proxy..."
    Stop-Process -Id $proxyProcess.Id -Force
}

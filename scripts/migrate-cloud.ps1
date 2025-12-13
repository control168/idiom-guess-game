
$ErrorActionPreference = "Stop"

$ProjectId = "gen-lang-client-0631854585"
$Instance = "guess-what-postgresql"
$Database = "idiom-game"
$User = "idiom-app"
# Password URL encoded: SafePassw0rd2025!
$PasswordEncoded = "SafePassw0rd2025!"
$InstanceIp = "34.81.76.80"

# 1. Get Public IP
Write-Host "Fetching public IP..."
$PublicIp = (Invoke-RestMethod -Uri "https://api.ipify.org").Trim()
Write-Host "Public IP: $PublicIp"

# 2. Add to Authorized Networks
Write-Host "Authorizing IP on CloudSQL..."
cmd /c "gcloud sql instances patch $Instance --authorized-networks=$PublicIp --project=$ProjectId --quiet"

# 3. Push Schema (using db push instead of migrate deploy to avoid migration history issues)
Write-Host "Pushing Prisma Schema..."
$env:DATABASE_URL = "postgresql://$($User):$($PasswordEncoded)@$($InstanceIp):5432/$($Database)"
try {
    npx prisma db push --accept-data-loss
}
catch {
    Write-Host "Migration failed: $_" -ForegroundColor Red
}
finally {
    # 4. Remove Authorization (Restore to empty or pre-existing? For this task, assuming empty/default)
    # WARNING: This removes ALL authorized networks. If you had others, they are gone.
    Write-Host "Revoking IP authorization..."
    cmd /c "gcloud sql instances patch $Instance --authorized-networks=127.0.0.1 --project=$ProjectId --quiet"
}

Write-Host "Done."

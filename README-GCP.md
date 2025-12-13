# Google Cloud Platform Deployment

This directory contains scripts to help you deploy the "Idiom Guess Game" to Google Cloud Platform using Cloud Run and Cloud SQL (PostgreSQL).

## Prerequisites

1.  **Google Cloud SDK**: Install `gcloud` CLI.
2.  **Docker**: Install Docker Desktop.
3.  **Cloud SQL Auth Proxy**: Download and `cloud-sql-proxy` executable to your PATH (required for migrations).
4.  **PowerShell**: Used to run the scripts.

## Scripts

### 1. Setup Resources (`scripts/gcp-setup.ps1`)

This script enables necessary APIs, creates an Artifact Registry repository, and provisions a Cloud SQL instance.

```powershell
.\scripts\gcp-setup.ps1 -ProjectId "YOUR_PROJECT_ID" -Region "asia-east1"
```

**Output**: Note down the `Instance Connection Name`, `Database User`, and `Database Password`.

### 2. Run Migrations (`scripts/gcp-migrate.ps1`)

This script connects to the Cloud SQL instance via a local proxy and runs Prisma migrations.

1.  Update your local `.env` file (or create a temporary one) to point to the local proxy:
    ```env
    DATABASE_URL="postgresql://idiom-admin:SecurePassword123!@localhost:5432/idiom-game-db"
    ```
2.  Run the script:
    ```powershell
    .\scripts\gcp-migrate.ps1 -InstanceConnectionName "PROJECT:REGION:INSTANCE"
    ```

### 3. Deploy Application (`scripts/gcp-deploy.ps1`)

This script builds the Docker image, pushes it to Artifact Registry, and deploys it to Cloud Run.

```powershell
.\scripts\gcp-deploy.ps1 `
    -ProjectId "YOUR_PROJECT_ID" `
    -InstanceConnectionName "PROJECT:REGION:INSTANCE" `
    -DatabaseUrl "postgresql://idiom-admin:SecurePassword123!@localhost/idiom-game-db?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

> **Note**: The `DATABASE_URL` for Cloud Run uses a unix socket connection (host=/cloudsql/...). Ensure you replace the user, password, db name, and instance connection name correctly.

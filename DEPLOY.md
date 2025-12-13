# Deployment Guide: Idiom Guess Game to Google Cloud Run

This guide covers how to build your container, deploy it to Google Cloud Run, and configure your custom domain (`www.guesswhat.cc`).

## Prerequisites

1.  **Google Cloud Platform (GCP) Project**: Ensure you have a project created.
2.  **gcloud CLI**: Installed and authorized (`gcloud auth login`).
3.  **PostgreSQL Database**: You need a Postgres database accessible from Cloud Run (e.g., Google Cloud SQL or a managed service like Neon).

## 1. Database Setup

Since Cloud Run is stateless, you must use an external database. 

1.  Create a PostgreSQL database.
2.  Get the Connection String: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require`
3.  This connection string will be used as the `DATABASE_URL` environment variable.

## 2. Build and Push Container

We will use Google Artifact Registry to store the Docker image.

### Enable Services
```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

### Create Repository (if not exists)
```bash
gcloud artifacts repositories create my-repo --repository-format=docker --location=us-central1 --description="Docker repository"
```

### Build and Push
Replace `[PROJECT_ID]` with your GCP Project ID.

```bash
# Set your project ID
gcloud config set project [PROJECT_ID]

# Authenticate Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build the image
docker build -t us-central1-docker.pkg.dev/[PROJECT_ID]/my-repo/idiom-game:latest .

# Push the image
docker push us-central1-docker.pkg.dev/[PROJECT_ID]/my-repo/idiom-game:latest
```

*(Alternatively, you can use `gcloud builds submit --tag ...` if you don't have local Docker)*

## 3. Deploy to Cloud Run

Deploy the container to Cloud Run.

```bash
gcloud run deploy idiom-game \
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/my-repo/idiom-game:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="Your_Postgres_Connection_String"
```

*Note: If using Google Cloud SQL, you should use the `--add-cloudsql-instances` flag instead of public IP access if possible.*

## 4. Custom Domain Configuration (Cloudflare)

### Step A: Map Domain in Cloud Run
1.  Go to the **Cloud Run Console**.
2.  Select your service (`idiom-game`).
3.  Click **Manage Custom Domains**.
4.  Click **Add Mapping**.
5.  Select "Verify a new domain" if needed, or select your verified domain `guesswhat.cc`.
6.  Enter `www.guesswhat.cc` as the subdomain.
7.  Cloud Run will provide distinct DNS records (usually a CNAME or A record).

### Step B: Update Cloudflare DNS
1.  Log in to **Cloudflare**.
2.  Select your domain `guesswhat.cc`.
3.  Go to **DNS** > **Records**.
4.  Add the record provided by Cloud Run:
    *   **Type**: CNAME (usually `ghs.googlehosted.com`)
    *   **Name**: `www`
    *   **Content**: `ghs.googlehosted.com` (or whatever Google provides)
    *   **Proxy Status**: You can try **Proxied (Orange Cloud)**. It generally works with Cloud Run, giving you Cloudflare's WAF and CDN.
5.  Save the record.

### SSL
Cloud Run provides a managed certificate. Cloudflare also provides SSL. Both can work together (Full or Full(Strict) mode in Cloudflare crypto settings).

## Local Development Note
We switched the database to PostgreSQL. For local development, you should:
1.  Install Postgres or run it via Docker.
2.  Create a `.env` file with `DATABASE_URL=postgresql://...`.
3.  Run `npx prisma migrate dev` to setup the schema locally.

# Authentication Setup Guide

This document outlines the required configuration for external services, specifically Google OAuth, to ensure authentication works seamlessly in both local development and production environments.

## Google Cloud Console (OAuth 2.0 Client IDs)

If you have created new Google Cloud Console credentials, you need to configure the **Authorized JavaScript origins** and **Authorized redirect URIs** to cover both your local machine and your production server.

1. Go to the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Select your project and edit your **OAuth 2.0 Client ID**.
3. Apply the configurations below, then click **Save**. *(Note: Changes may take up to 5 minutes to propagate).*

### Authorized JavaScript origins
Add the following URLs to allow requests from your frontend:

**For Production:**
- `https://dezignbuild.site`
- `https://api.dezignbuild.site`

**For Local Development:**
- `http://localhost:3000`
- `http://localhost:3001`

### Authorized redirect URIs
Add the following URLs to allow Better Auth to securely handle the OAuth callback:

**For Production:**
- `https://api.dezignbuild.site/api/auth/callback/google`

**For Local Development:**
- `http://localhost:3001/api/auth/callback/google`

---

## Updating Environment Variables

After generating your new Google credentials, make sure to update your `.env` files with the new Client ID and Secret.

### Local (`F:\OruClass\.env`)
Update the following keys in your local environment file:
```env
GOOGLE_CLIENT_ID="your_new_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_new_client_secret"
```

### Production (VPS)
You will also need to update these values on the VPS. 
You can either edit `/docker/OruClass/.env` directly on the server, or update your local `prod.env` and push it to the server, followed by restarting the API container:
```bash
docker compose up -d api
```

---

## Cloudflare R2 (CORS Policy)
If you are using Cloudflare R2 for file uploads and have a CORS policy enabled on the bucket, ensure the `AllowedOrigins` array includes your domains:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://dezignbuild.site"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]
```

## Resend (Email Deliverability)
When you are ready to send production emails (like Welcome Emails or Magic Links):
1. Go to your [Resend Dashboard](https://resend.com/).
2. Add the domain `dezignbuild.site`.
3. Copy the provided TXT and MX records into your DNS provider (where you added the A records). This prevents your system emails from landing in users' spam folders.

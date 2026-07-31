# FCM Test Push Sender

Sends a remote FCM push notification to a registered device token.

## Prerequisites

1. `firebase-admin` is installed (`pnpm install`).

2. Firebase service account JSON with FCM permissions. Set `FIREBASE_SERVICE_ACCOUNT` to:
   - The JSON string (single-line), OR
   - The file path to the service account JSON

3. Supabase service role credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).

## Usage

```bash
# Required env vars
$env:SUPABASE_URL = "https://gbnnerrcezlgeuohaume.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "..."
$env:FIREBASE_SERVICE_ACCOUNT = '{"type":"service_account","project_id":"celis-mobile",...}'

# Send test push
pnpm notifications:test <user-uuid> "Test Title" "Test body"
```

The script:
1. Reads `profiles.fcm_token` for the given user UUID
2. Initializes Firebase Admin with service account credentials
3. Sends an FCM V1 push with:
   - Notification title + body
   - Data payload: `{ type: "test" }`
   - Android channel `celis-default`, high priority
4. Prints success/failure

## Notification Job Worker

For automated chat push delivery, run the background worker:

```bash
pnpm cron:process-notifications
```

This polls the `notification_jobs` table every 10 seconds and sends FCM pushes for pending jobs triggered by chat message inserts.

## No Service Account File

The service account JSON is passed via env var (not a committed file). Never commit service account keys to git. See `.gitignore` for the ignore patterns.

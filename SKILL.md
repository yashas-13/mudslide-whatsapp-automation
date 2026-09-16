# SendStack WhatsApp Platform API & Automation Skill

Complete REST API, automation specifications, and CLI integration for the **SendStack WhatsApp Automation Platform** (User management, Calendly integration, Lead Capture, Cron-based Recurring Schedules, and Baileys / Mudslide Engine).

---

## 🤖 Universal AI Agent Prompt

Copy-paste this instruction block into any AI Coding Agent (Pi, Claude Code, Cursor, Windsurf, Roo Code, Aider, Codex):

```text
You have full access to the SendStack WhatsApp Platform API and automation engine. You can authenticate users, send direct/group WhatsApp messages, manage cron-based recurring schedules, handle Calendly booking webhooks & leads, and run local Baileys/Mudslide automation. Always authenticate with `x-api-key: <key>` or `Authorization: Bearer <token>` when using REST endpoints. For local operations, leverage the Baileys session stored at `~/.local/share/mudslide` with `markOnlineOnConnect: false`. Follow the exact endpoint specifications, query schemas, and payload structures documented in this repository.
```

---

## 📡 REST API Reference

All requests accept `Content-Type: application/json` and require `-H "x-api-key: <key>"` or `-H "Authorization: Bearer <token>"` unless otherwise noted.

---

### 1. User & WhatsApp Lifecycle Management

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/register` | No | Send magic link to email. Optional `next` query param for redirect target. |
| `GET` | `/api/verify/:token` | No | Verify magic-link token validity. |
| `POST` | `/api/apikey/generate` | Bearer Token | Generate a 1-hour session API key. |
| `GET` | `/api/apikey/status` | `x-api-key` | Check if API key exists and if it has expired. |
| `GET` | `/api/whatsapp/status` | `x-api-key` | Check local WhatsApp session status (cheap file check, safe to poll). |
| `GET` | `/api/whatsapp` | `x-api-key` | Real round-trip network check with WhatsApp servers. |
| `GET` | `/api/whatsapp/ip` | `x-api-key` | Fetch residential IP & geo location currently proxying the connection. |
| `GET` | `/api/whatsapp/qr` | `x-api-key` | Get QR code for linking new WhatsApp device. |
| `POST` | `/api/whatsapp/notify-user-connected` | `x-api-key` | Server-side re-verify and confirm QR scan completion. |
| `POST` | `/api/whatsapp/logout` | `x-api-key` | Clean up local session and disconnect device. |

---

### 2. Messaging & Groups

#### Send Immediate Message
```bash
curl -X POST https://<domain>/api/message \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"to": "919538384545", "message": "Hello from SendStack!"}'
```

#### List WhatsApp Groups
```bash
curl https://<domain>/api/whatsapp/groups \
  -H "x-api-key: <your-api-key>"
# Response:
# {"groups": [{"name": "Family", "id": "919876543210-1234567890@g.us"}]}
```

#### Send Message to Group
```bash
curl -X POST https://<domain>/api/message \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210-1234567890@g.us", "message": "Hello, everyone!"}'
```

---

### 3. Recurring Schedules (Automated Cron Messages)

Automated messages fired at specified times (daily, weekly, monthly, or one-off date). Handled autonomously in background without client uptime.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/schedules` | List all active schedules. |
| `POST` | `/api/schedules` | Create a new recurring or single-date schedule. |
| `GET` | `/api/schedules/:id` | Get schedule details by ID. |
| `PUT` | `/api/schedules/:id` | Update an existing schedule. |
| `DELETE` | `/api/schedules/:id` | Delete a schedule. |
| `GET` | `/api/usage/logs` | Fetch recent send logs (including scheduled runs). |

#### Create Schedule Example
```bash
curl -X POST https://<domain>/api/schedules \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Team Briefing",
    "recipients": ["919876543210", "120363424973777159@g.us"],
    "message": "Good morning team! Please submit daily updates.",
    "timezone": "Asia/Kolkata",
    "localTime": "09:00",
    "frequency": "Daily"
  }'
```

> **Note on Scheduling:** The backend automatically converts `localTime` + `timezone` into a UTC cron expression.
> **Frequency options:** `Daily`, `Weekly`, `Monthly`, or `Once` (requires `"localDate": "YYYY-MM-DD"`).

---

### 4. Calendly Integration & Lead Capture

Handles OAuth, calendar discovery, custom question phone extraction, embed scripts, and automated WhatsApp trigger on new bookings.

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/calendly/authorize` | `x-api-key` | Generate Calendly OAuth consent URL. |
| `GET` | `/api/calendly/oauth/callback` | None | OAuth redirect landing endpoint (uses nonce). |
| `GET` | `/api/calendly/status` | `x-api-key` | Return `{connected, calendlyKey}` from encrypted store. |
| `GET` | `/api/calendly/event-types` | `x-api-key` | List Calendly event types with detected phone fields. |
| `POST` | `/api/calendly/disconnect` | `x-api-key` | Unlink Calendly account. |
| `GET` | `/api/calendly/code` | `x-api-key` | Serve embeddable runtime script for web forms. |
| `POST` | `/api/calendly/:meetingId/lead` | `x-calendly-key` / `?token=` | Webhook called on booking to auto-send WhatsApp & record lead. Pass `test: true` to send to yourself and skip Firestore lead write. |

#### Check Calendly Status
```bash
curl https://<domain>/api/calendly/status \
  -H "x-api-key: <your-api-key>"
# Response: {"connected": true, "calendlyKey": "<calendly-key>"}
```

#### List Calendly Event Types
```bash
curl https://<domain>/api/calendly/event-types \
  -H "x-api-key: <your-api-key>"
# Response:
# {"eventTypes": [{"uri": "...", "name": "30 Min Consultation", "schedulingUrl": "...", "phoneQuestionName": "WhatsApp number", "phoneDetectionStatus": "found_required"}]}
```

#### Lead Webhook Trigger (Auto-WhatsApp on Booking)
```bash
curl -X POST https://<domain>/api/calendly/<meetingId>/lead \
  -H "x-calendly-key: <your-calendly-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_uri": "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA",
    "invitee_uri": "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA/invitees/BBBBBBBBBBBBBBBB"
  }'
# Response: {"success": true, "status": "sent"}
```

> **Lead Status Values:**
> - `sent`: WhatsApp message delivered to invitee.
> - `failed`: Send attempted but failed (logged).
> - `no_phone`: Invitee did not provide a valid phone number.
> - `pending`: Auto-send toggled off for calendar (lead logged to Firestore).

---

### 5. Leads & Direct Firestore Access

Listing, editing notes, deleting, and manually managing leads is performed directly against Firestore client-side using a minted Firebase custom token.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/firebase-token` | `x-api-key` | Mint Firebase custom token & return `userDir` for client Firestore connection. |

```bash
curl https://<domain>/api/firebase-token \
  -H "x-api-key: <your-api-key>"
# Response: {"firebaseToken": "...", "userDir": "..."}
```

*Sending an ad-hoc message to a lead re-uses `POST /api/message`.*

---

## 🧪 Testing & Verification

Run automated test suite:

```bash
npm test
```

### Covered Test Suites:
1. **`test/flow.test.js`** (Node built-in test runner):
   - Magic link register → verify token → API key generation
   - Token signature structure (`token.slice(0,10) === sha256(email).slice(0,10)`)
   - `token_hash` written to disk, `tokens.json` deleted
   - Schedule CRUD & timezone-aware UTC cron expression evaluation
   - Encrypted-at-rest validation (schedule files encrypted)
   - Re-registration: token rotation, user directory preservation

2. **`test/calendly.test.js`** (Jest):
   - OAuth flow & calendar listing with phone-detection logic
   - Template placeholder string resolution (`{{name}}`, `{{date}}`)
   - Embed script generation
   - End-to-end webhook lead creation with mocked WhatsApp & Calendly APIs

---

## 🛠 Local CLI & Baileys Bridge

Combine REST capabilities with direct local CLI / Baileys scripts (`~/.local/share/mudslide`):

```bash
# Direct CLI Send
mudslide send "919538384545" "Hello!"

# List Groups
mudslide groups

# Trigger Batch Broadcaster
./scripts/batch-send.sh recipients.txt "Scheduled announcement"
```

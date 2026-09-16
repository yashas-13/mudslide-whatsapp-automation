# SendStack WhatsApp Automation Platform & Skill

[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yashas-13/mudslide-whatsapp-automation?style=social)](https://github.com/yashas-13/mudslide-whatsapp-automation)

Production-ready WhatsApp automation skillset for **any AI Coding Agent** (Pi, Claude Code, Cursor, Windsurf, Roo Code, Aider, Codex, GitHub Copilot). Covers the full **SendStack REST API Specification** (User lifecycle, Calendly integration, Lead Capture, Cron-based Recurring Schedules) along with local CLI/Baileys scripts.

---

## 🤖 AI Agent Integration Prompt

Paste this single prompt into your AI Agent (Claude, ChatGPT, Cursor, Pi, Roo-Code, etc.) to give it full SendStack + Mudslide capabilities:

```text
You are equipped with the full SendStack WhatsApp Platform API & Mudslide Automation Skill (https://github.com/yashas-13/mudslide-whatsapp-automation). You can manage user authentication (POST /api/register, GET /api/verify/:token, POST /api/apikey/generate), check WhatsApp QR/status/IP (GET /api/whatsapp/status, GET /api/whatsapp/ip), send direct or group WhatsApp messages (POST /api/message, GET /api/whatsapp/groups), manage cron-based recurring schedules with timezone auto-conversion (GET/POST/PUT/DELETE /api/schedules), handle Calendly booking webhooks & automatic lead messaging (GET /api/calendly/authorize, GET /api/calendly/status, GET /api/calendly/event-types, POST /api/calendly/:meetingId/lead), and mint Firebase tokens for direct Firestore lead management (GET /api/firebase-token). You can also run local offline WhatsApp commands using `mudslide` CLI or zero-relogin Node.js Baileys scripts via ~/.local/share/mudslide with markOnlineOnConnect: false. Always use x-api-key or Bearer token for authenticated HTTP endpoints. Refer to SKILL.md and references/ for complete request schemas, payload structures, and test suites.
```

---

## 📡 Complete REST API Surface

### 1. User & WhatsApp Connection Lifecycle
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/register` | Send magic link to email (`next` query param supported). |
| `GET` | `/api/verify/:token` | Verify magic-link token. |
| `POST` | `/api/apikey/generate` | Generate 1-hour session API key. |
| `GET` | `/api/apikey/status` | Check if key exists and whether expired. |
| `GET` | `/api/whatsapp/status` | Check local WhatsApp session (cheap file check, safe to poll). |
| `GET` | `/api/whatsapp` | Real round-trip network check with WhatsApp servers. |
| `GET` | `/api/whatsapp/ip` | Fetch residential IP/location proxying the session. |
| `GET` | `/api/whatsapp/qr` | Get QR code for login. |
| `POST` | `/api/whatsapp/notify-user-connected` | Confirm QR scan server-side. |
| `POST` | `/api/whatsapp/logout` | Clean up session after device unlinking. |

### 2. Send Immediate Messages & Group Operations
```bash
# Send to individual:
curl -X POST https://<domain>/api/message \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"to": "919538384545", "message": "Hello!"}'

# List groups to get JID:
curl https://<domain>/api/whatsapp/groups -H "x-api-key: <your-api-key>"

# Send to group:
curl -X POST https://<domain>/api/message \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"to": "919876543210-1234567890@g.us", "message": "Hello, everyone!"}'
```

### 3. Recurring Schedules (Cron)
Schedules send automated recurring messages (Daily, Weekly, Monthly, or Once) firing autonomously in the background without keeping a client alive.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/schedules` | List all schedules. |
| `POST` | `/api/schedules` | Create schedule (auto-converts localTime + timezone to UTC cron). |
| `GET` | `/api/schedules/:id` | Get schedule details. |
| `PUT` | `/api/schedules/:id` | Update schedule. |
| `DELETE` | `/api/schedules/:id` | Delete schedule. |
| `GET` | `/api/usage/logs` | View recent send logs. |

```bash
curl -X POST https://<domain>/api/schedules \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily reminder",
    "recipients": ["919876543210"],
    "message": "Good morning!",
    "timezone": "Asia/Kolkata",
    "localTime": "09:00",
    "frequency": "Daily"
  }'
```

### 4. Calendly & Automated Lead Capture
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/calendly/authorize` | Get Calendly OAuth consent URL. |
| `GET` | `/api/calendly/oauth/callback` | OAuth redirect handler. |
| `GET` | `/api/calendly/status` | Check connection status `{connected, calendlyKey}`. |
| `GET` | `/api/calendly/event-types` | List event types with auto-detected phone field status. |
| `POST` | `/api/calendly/disconnect` | Unlink Calendly. |
| `GET` | `/api/calendly/code` | Serves embeddable runtime booking script. |
| `POST` | `/api/calendly/:meetingId/lead` | Webhook called on booking; sends WhatsApp message and writes lead to Firestore (supports `test: true`). |

```bash
curl -X POST https://<domain>/api/calendly/<meetingId>/lead \
  -H "x-calendly-key: <your-calendly-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_uri": "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA",
    "invitee_uri": "https://api.calendly.com/scheduled_events/AAAAAAAAAAAAAAAA/invitees/BBBBBBBBBBBBBBBB"
  }'
```

### 5. Leads & Firestore
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/firebase-token` | Mint Firebase custom token + return `userDir` for client-side Firestore access. |

---

## 🧪 Test Suite Specifications

Run tests with `npm test` (MailDev runs automatically):

- **`test/flow.test.js`**:
  - Register → verify → API key generation
  - Token structure check (`token.slice(0,10) === sha256(email).slice(0,10)`)
  - `token_hash` written to disk, `tokens.json` deleted
  - Schedule CRUD with timezone-aware cron validation
  - Encrypted-at-rest verification
- **`test/calendly.test.js`**:
  - OAuth flow & calendar discovery
  - Message template placeholder interpolation
  - Lead creation with mocked WhatsApp/Calendly responses

---

## 🛠 Local CLI & Baileys Zero-Relogin

Use `~/.local/share/mudslide` for offline or terminal operations:

```bash
mudslide send "919538384545" "Hello!"
mudslide groups
./scripts/batch-send.sh recipients.txt "Message"
```

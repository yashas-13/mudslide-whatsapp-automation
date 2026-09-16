---
name: mudslide
description: WhatsApp automation (send/receive/bot) via mudslide CLI + Baileys. Covers messaging, media, polls, groups, and advanced features (reactions, quotes, status/story, broadcasts, admin ops) through Baileys creds-reuse pattern.
---

# Mudslide WhatsApp Automation Skill

Automates WhatsApp messaging and group operations via `mudslide` CLI (Baileys engine).

## Prerequisites

- Node.js >= 24
- `mudslide` installed globally (`npm i -g mudslide`)
- Active login state cached in `~/.local/share/mudslide`

Check authentication status:
```bash
mudslide me
```

Login if not authenticated:
```bash
mudslide login                 # Scan QR code
mudslide login --pairing-code  # Use 8-digit pairing code
```

## Recipient Formats

| Target | Format | Example |
|---|---|---|
| Self | `me` | `me` |
| Phone Number | International without `+` | `14155552671` |
| Group | Group JID ending in `@g.us` | `120363424973777159@g.us` |
| Individual JID | Full JID ending in `@s.whatsapp.net` | `14155552671@s.whatsapp.net` |

## Core Commands

### 1. Send Text Messages

```bash
# Basic message
mudslide send <recipient> "Hello world"

# Message with newlines (use literal \n in string)
mudslide send <recipient> "Line 1\nLine 2\nLine 3"

# Verify recipient exists on WhatsApp before sending
mudslide send <recipient> "Important alert" --live-check

# Simulate typing indicator (milliseconds)
mudslide send <recipient> "Writing response..." --typing 2000
```

### 2. Send Media & Files

```bash
# Send image (PNG, JPG, GIF) with optional caption
mudslide send-image <recipient> /path/to/image.png --caption "Check this out"

# Send document (PDF, TXT, ZIP, etc.)
mudslide send-file <recipient> /path/to/doc.pdf --caption "Report"

# Send playable audio (MP3, OGG, M4A)
mudslide send-file <recipient> /path/to/voice.mp3 --type audio

# Send playable video (MP4)
mudslide send-file <recipient> /path/to/video.mp4 --type video --caption "Demo video"
```

### 3. Send Location

```bash
# Latitude Longitude (decimal format)
mudslide send-location <recipient> 37.774929 -122.419416
```

### 4. Send Interactive Polls

```bash
# Single-choice poll
mudslide send-poll <recipient> "Which day works best?" --item "Monday" --item "Wednesday" --item "Friday"

# Multi-choice poll (allow up to N selections)
mudslide send-poll <recipient> "Pick your favorite tools" --item "Pi" --item "Termux" --item "Mudslide" --selectable 2
```

### 5. Group Management

```bash
# List all participating groups (outputs ID and Subject JSON)
mudslide groups

# List participant IDs for a specific group
mudslide list-group <group-id>

# Add user to group (international phone without +)
mudslide add-to-group <group-id> <phone-number>

# Remove user from group
mudslide remove-from-group <group-id> <phone-number>
```

## Global Configuration Options

All global options must appear **before** the command name:

```bash
# Custom cache location (useful for multi-account / isolated profiles)
mudslide --cache /custom/path/cache me

# HTTP/HTTPS Proxy (reads HTTP_PROXY / HTTPS_PROXY env vars)
HTTP_PROXY=http://127.0.0.1:8080 mudslide --proxy send me "Via proxy"

# Increase connection & command timeouts (for slow mobile networks)
mudslide --connect-timeout 10000 --timeout 120 send <recipient> "Heavy message"

# Debug verbosity (-v, -vv, -vvv)
mudslide -vvv me
```

## Multi-Account Profile Pattern

Isolate sessions by setting `MUDSLIDE_CACHE_FOLDER`:

```bash
# Work account
MUDSLIDE_CACHE_FOLDER=~/.mudslide-work mudslide login
MUDSLIDE_CACHE_FOLDER=~/.mudslide-work mudslide send <recipient> "Work msg"

# Personal account
MUDSLIDE_CACHE_FOLDER=~/.mudslide-personal mudslide login
MUDSLIDE_CACHE_FOLDER=~/.mudslide-personal mudslide send <recipient> "Personal msg"
```

## Helper Scripts

Use scripts in `./scripts/` for bulk automation:

- `./scripts/batch-send.sh recipients.txt "Message text"` — broadcast to list of recipients with rate-limiting
- `./scripts/find-top-groups.sh` — ranks all joined groups by member count

## Beyond Mudslide: Baileys Capabilities

mudslide is **send-only**. Full WhatsApp automation (receive messages, bot, reactions, status/story, broadcast lists, advanced group admin, profile/privacy) requires Baileys directly — but **mudslide's auth cache is a Baileys `useMultiFileAuthState` folder**, so you can reuse the exact same login.

See references for deeper recipes:
- [references/baileys-capabilities.md](references/baileys-capabilities.md) — full API matrix
- [references/advanced-usecases.md](references/advanced-usecases.md) — real-world recipes (DevOps alerts, LLM bridge, morning digests, auto-welcomes, voice note reminders)

### Reuse Login for Bot / Inbox Automation

```js
// bot.mjs — Baileys reusing mudslide session
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const { state, saveCreds } = await useMultiFileAuthState(
  process.env.MUDSLIDE_CACHE_FOLDER || '~/.local/share/mudslide')
const sock = makeWASocket({ auth: state, markOnlineOnConnect: false })
sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.key.fromMe && m.message?.conversation === '.ping') {
      await sock.sendMessage(m.key.remoteJid, { text: 'pong' })
    }
  }
})
```

Capabilities unlocked this way:
- Receive/read messages (`messages.upsert`, `messages.update`)
- Reactions, quotes, mentions, pinned messages
- Status/story broadcasts (`status@broadcast`)
- Broadcast lists (`xxx@broadcast`)
- Full group admin: create, promote/demote, invite code, join requests, settings
- Edit/delete for everyone, view-once, forward
- Profile (name, status, DP), privacy (last seen, read receipts, blocks)
- Presence (typing/online), chat archive/mute/star

> **Key flag:** `markOnlineOnConnect: false` — bot stays invisible while phone WhatsApp works normally.

## Safety Notes

- No Selenium/Chromium — pure WebSocket (~500MB RAM saved vs browser automation).
- Bulk/spam violates WhatsApp ToS. Keep rates human.
- `DisconnectReason.loggedOut` → re-login via `mudslide login`; `restartRequired` → reconnect loop.

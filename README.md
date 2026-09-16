# Mudslide WhatsApp Automation

Complete WhatsApp automation skillset for [pi](https://github.com/earendil-works/pi-coding-agent) / Claude Code — built on the [mudslide](https://github.com/robvanderleek/mudslide) WhatsApp CLI (Baileys engine).

## What's Inside

```
mudslide/
├── SKILL.md                          # Skill manifest — command reference + Baileys creds-reuse pattern
├── scripts/
│   ├── batch-send.sh                 # Broadcast same message to recipient list (rate-limited)
│   └── find-top-groups.sh            # Rank all joined groups by member count
└── references/
    ├── baileys-capabilities.md       # Full WhatsApp API capability matrix (mudslide vs Baileys)
    └── advanced-usecases.md          # Production recipes: DevOps alerts, LLM bridge, digests, media pipelines
```

## Quick Start

```bash
# Install
npm i -g mudslide

# Auth (scan QR or use pairing code)
mudslide login

# Send
mudslide send <recipient> "Hello world"
mudslide send-image <recipient> photo.png --caption "Nice pic"
mudslide send-poll <recipient> "Which day?" --item "Mon" --item "Fri"

# Groups
mudslide groups
mudslide list-group <group-id>
```

Recipients: `me` (self), `3161234567890` (intl phone, no `+`), `123456789-987654321@g.us` (group JID).

## Advanced: Reuse Login for Bots

mudslide's cache folder (`~/.local/share/mudslide`) is a Baileys `useMultiFileAuthState` directory. Point Baileys at it for **receive, reactions, status/story broadcasts, advanced group admin, and LLM-powered chat bots with zero re-login**.

```js
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

## Recipes (see references/advanced-usecases.md)

- **DevOps alerts** — cron-triggered disk/CPU thresholds, deploy notifications, log watchers
- **LLM assistant bridge** — route `!ai <prompt>` queries to Ollama/OpenAI/Claude from WhatsApp
- **Daily digests** — weather/crypto/news briefings pushed to `me` at 8 AM
- **Community management** — auto-welcome new members, multi-group poll campaigns
- **Media pipelines** — generated charts sent with captions, TTS voice notes via `send-file --type audio`

## Safety

- No Selenium/Chromium — pure WebSocket (saves ~500MB RAM vs browser automation)
- Bulk/spam violates WhatsApp ToS. Keep rates human.
- `DisconnectReason.loggedOut` → re-run `mudslide login`

## License

ISC — see [LICENSE](LICENSE). Author: [yashas-13](https://github.com/yashas-13).
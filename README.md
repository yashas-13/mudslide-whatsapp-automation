# Mudslide WhatsApp Automation Skill

[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yashas-13/mudslide-whatsapp-automation?style=social)](https://github.com/yashas-13/mudslide-whatsapp-automation)

Production-ready WhatsApp automation skillset for **any AI Coding Agent** (Pi, Claude Code, Cursor, Windsurf, Roo Code, Aider, Codex, GitHub Copilot). Built on top of the [Mudslide](https://github.com/robvanderleek/mudslide) CLI and [Baileys](https://github.com/WhiskeySockets/Baileys) engine.

---

## 🤖 AI Agent Integration Prompt

Copy-paste this prompt directly into your AI Agent (Claude, ChatGPT, Cursor, Pi, Roo-Code, etc.) to give it full WhatsApp automation capabilities:

```markdown
You are equipped with the "Mudslide WhatsApp Automation Skill".
Repository: https://github.com/yashas-13/mudslide-whatsapp-automation

When asked to send WhatsApp messages, broadcasts, polls, media, alerts, or manage groups, follow these rules:

1. AUTHENTICATION & STATUS:
   - Check if logged in: `mudslide me`
   - If not logged in: Ask user to scan QR with `mudslide login` or enter pairing code with `mudslide login --pairing-code`
   - Cache folder: `~/.local/share/mudslide`

2. RECIPIENT FORMATS:
   - Self: `me`
   - Phone number: International format WITHOUT '+' (e.g. `14155552671`)
   - Group ID: `120363424973777159@g.us`
   - User JID: `14155552671@s.whatsapp.net`

3. CORE COMMANDS:
   - Text message: `mudslide send <recipient> "<message>"` (supports `\n` for newlines)
   - Media: `mudslide send-image <recipient> <path> --caption "<text>"`
   - File/Doc/Audio: `mudslide send-file <recipient> <path> --type [document|audio|video] --caption "<text>"`
   - Location: `mudslide send-location <recipient> <latitude> <longitude>`
   - Poll: `mudslide send-poll <recipient> "<question>" --item "<opt1>" --item "<opt2>" --selectable <N>`
   - Groups: `mudslide groups` (list all), `mudslide list-group <group-id>` (list members)
   - Membership: `mudslide add-to-group <group-id> <phone>` / `mudslide remove-from-group <group-id> <phone>`

4. ADVANCED / ZERO RE-LOGIN (BAILEYS NODE.JS):
   - To build reactive bots, LLM bridges, handle incoming messages, or broadcast to Status (`status@broadcast`), write a Node.js script using `@whiskeysockets/baileys` pointing `useMultiFileAuthState` to `~/.local/share/mudslide`. Never require the user to re-authenticate!
   - Always set `markOnlineOnConnect: false` to keep the bot invisible while normal WhatsApp operates.

5. BATCH & SAFETY:
   - Rate limit multi-recipient broadcasts (sleep 3-5s between calls).
   - Use `find-top-groups.sh` to rank joined groups before bulk operations.
   - For complete technical matrix, consult `references/baileys-capabilities.md` and `references/advanced-usecases.md`.
```

---

## 📦 Compatibility & Agent Support Matrix

| Harness / Agent | Support Level | Installation / Loading Method |
|---|---|---|
| **Pi Coding Agent** | Native | `git clone` into `~/.pi/agent/skills/mudslide` |
| **Claude Code** | Native | Add to `~/.claude/skills/` or invoke via prompt |
| **Cursor / Windsurf** | Full | Add prompt to `.cursorrules` / `.windsurfrules` |
| **Roo Code / Cline** | Full | Add prompt to Custom Instructions / System Prompt |
| **Aider** | Full | Pass as `--read-prompt` or add to `.aider.conf.yml` |
| **OpenAI Codex / GPTs** | Full | Paste Agent Integration Prompt into instructions |

---

## 🛠 Directory Structure

```
mudslide-whatsapp-automation/
├── SKILL.md                          # Standard Agent Skill specification
├── README.md                         # Universal Agent Prompt & Documentation
├── LICENSE                           # ISC License
├── scripts/
│   ├── batch-send.sh                 # Rate-limited bulk message broadcaster
│   ├── find-top-groups.sh            # Rank joined groups by member count
│   ├── devops-alert.sh               # Server metric / incident threshold alerter
│   └── ai-bridge-example.mjs         # Node.js LLM / AI agent listener bridge
└── references/
    ├── baileys-capabilities.md       # Full API matrix (Mudslide CLI vs Baileys engine)
    └── advanced-usecases.md          # 5 Production recipes (DevOps, LLM, Digests, Media, Community)
```

---

## 🚀 Native Pi / Claude Code Installation

To load this as a native skill on your system:

```bash
# Global installation for Pi
mkdir -p ~/.pi/agent/skills
git clone https://github.com/yashas-13/mudslide-whatsapp-automation ~/.pi/agent/skills/mudslide

# Or for Claude Code
mkdir -p ~/.claude/skills
git clone https://github.com/yashas-13/mudslide-whatsapp-automation ~/.claude/skills/mudslide
```

---

## 📖 Key Features & Recipes

### 1. Zero Re-login Architecture
Mudslide's session cache (`~/.local/share/mudslide`) is 100% compatible with Baileys `useMultiFileAuthState`. Any background script can tap into the authenticated session without triggering a new QR scan:

```javascript
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

const { state, saveCreds } = await useMultiFileAuthState(process.env.HOME + '/.local/share/mudslide');
const sock = makeWASocket({ auth: state, markOnlineOnConnect: false });
sock.ev.on('creds.update', saveCreds);

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (!m.key.fromMe && m.message?.conversation === '!ping') {
      await sock.sendMessage(m.key.remoteJid, { text: 'pong 🏓' });
    }
  }
});
```

### 2. DevOps & Infrastructure Alerts
Trigger formatted WhatsApp markdown alerts from bash scripts or cron jobs:

```bash
./scripts/devops-alert.sh "120363424973777159@g.us" "Disk Usage" "92%" "85%"
```

### 3. Media & Voice Notes
- **Images with Captions**: `mudslide send-image me chart.png --caption "Daily KPI"`
- **Playable Audio (PTT)**: `mudslide send-file me reminder.mp3 --type audio`
- **Playable Video**: `mudslide send-file me demo.mp4 --type video --caption "Demo"`

---

## 🔒 Security & Privacy

- **No Selenium / Puppeteer**: Direct WebSocket implementation saves ~500MB+ RAM.
- **Local Credentials**: Auth keys stay on your local disk (`~/.local/share/mudslide`).
- **ToS Responsibility**: Respect WhatsApp rate limits and terms of service. Use responsibly.

---

## 📄 License

[ISC](LICENSE) © 2024 [yashas-13](https://github.com/yashas-13)

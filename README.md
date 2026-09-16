# Mudslide WhatsApp Automation Skill

[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yashas-13/mudslide-whatsapp-automation?style=social)](https://github.com/yashas-13/mudslide-whatsapp-automation)

Production-ready WhatsApp automation skillset for **any AI Coding Agent** (Pi, Claude Code, Cursor, Windsurf, Roo Code, Aider, Codex, GitHub Copilot). Built on top of the [Mudslide](https://github.com/robvanderleek/mudslide) CLI and [Baileys](https://github.com/WhiskeySockets/Baileys) engine.

---

## 🤖 AI Agent Integration Prompt

Paste this single prompt into your AI agent to give it full WhatsApp automation:

```text
You have WhatsApp automation powers through the Mudslide skill (https://github.com/yashas-13/mudslide-whatsapp-automation). When I ask you to send messages, polls, media, alerts, or manage groups on WhatsApp, please handle it for me — here's how it works. First check you're logged in with `mudslide me`, and if not, walk me through scanning the QR (`mudslide login`) or using the pairing code (`mudslide login --pairing-code`); my session is saved at ~/.local/share/mudslide so you only need this once. For recipients, `me` is my own number, phone numbers are international with no plus sign (like 14155552671), groups use their ID ending in @g.us, and people can be reached at their JID (@s.whatsapp.net). To send, use `mudslide send <recipient> <text>` (\n makes newlines), `mudslide send-image <recipient> <file> --caption "..."` for photos, `mudslide send-file <recipient> <file> --type audio|video|document --caption "..."` for other media, `mudslide send-poll <recipient> "question" --item "option" --selectable N` for polls, and `mudslide send-location <recipient> <lat> <long>` for locations. List my groups with `mudslide groups`, check members with `mudslide list-group <group-id>`, and add or remove people with `mudslide add-to-group` / `mudslide remove-from-group`. For anything more advanced — reading incoming messages, reacting, running a bot, posting to my status, or replying automatically — write a small Node.js script on @whiskeysockets/baileys pointing at the same ~/.local/share/mudslide session (zero re-login needed) and set markOnlineOnConnect: false so it stays invisible. When broadcasting to many recipients, slow down (3-5s between messages) and use the bundled scripts (find-top-groups.sh for ranking, batch-send.sh for bulk). Full technical details are in references/baileys-capabilities.md and references/advanced-usecases.md. Just ask me what you want to send and to whom, and take it from there.
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

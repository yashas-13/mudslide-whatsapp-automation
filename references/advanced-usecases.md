# Advanced WhatsApp Automation Recipes

Ready-to-use patterns combining `mudslide`, standard Unix tools (`cron`, `jq`, `curl`, `tail`), and zero-relogin Baileys scripts.

---

## 1. Automated System & DevOps Alerts

### Server Health / Metric Alerting
Send alert to a dedicated admin group when disk/RAM/CPU exceeds threshold:

```bash
#!/bin/bash
# alert-disk.sh — Run via cron every 5 min
THRESHOLD=85
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
ADMIN_GROUP="120363424973777159@g.us"

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  mudslide send "$ADMIN_GROUP" "🚨 *DISK ALERT*\nServer: $(hostname)\nDisk usage at *${USAGE}%* (Threshold: ${THRESHOLD}%)"
fi
```

### GitHub / CI/CD Deployment Notifications
Wrap build scripts or listen to webhooks to push release summaries:

```bash
# In your deploy.sh:
COMMIT=$(git log -1 --pretty=format:'%h - %s (%an)')
BRANCH=$(git rev-parse --abbrev-ref HEAD)
mudslide send "$ADMIN_GROUP" "🚀 *Deployment Succeeded*\nRepo: MyApp\nBranch: \`${BRANCH}\`\nCommit: ${COMMIT}"
```

### Log Watcher / Error Trigger
Tail a log file and alert instantly on `FATAL` or `500` status:

```bash
tail -Fn0 /var/log/nginx/error.log | while read -r line; do
  if echo "$line" | grep -qE "\[crit\]|\[alert\]|\[emerg\]"; then
    mudslide send "$ADMIN_GROUP" "⚠️ *Nginx Error Detected*:\n\`\`\`${line}\`\`\`"
  fi
done
```

---

## 2. LLM / AI Integration

### WhatsApp Assistant / Agent Bridge (Zero Re-login)
Using Node.js + Baileys directly pointing to Mudslide's auth cache to route incoming queries to an LLM:

```js
// ai-bot.mjs
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

const { state, saveCreds } = await useMultiFileAuthState(process.env.HOME + '/.local/share/mudslide');
const sock = makeWASocket({ auth: state, markOnlineOnConnect: false });
sock.ev.on('creds.update', saveCreds);

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (m.key.fromMe) continue;
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text;
    
    if (text?.startsWith('!ai ')) {
      const prompt = text.replace('!ai ', '');
      await sock.sendPresenceUpdate('composing', m.key.remoteJid);
      
      // Call local/remote LLM (Ollama, OpenAI, Claude, etc.)
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'mistral', prompt, stream: false })
      }).then(r => r.json());

      await sock.sendMessage(m.key.remoteJid, { text: response.response }, { quoted: m });
    }
  }
});
```

---

## 3. Scheduled Digests & Content Aggregation

### Daily Morning Digest
Fetch HackerNews top story / Weather / Crypto price and push to `me` or a group at 8:00 AM:

```bash
#!/bin/bash
# daily-digest.sh
WEATHER=$(curl -s "wttr.in/?format=3")
BTC=$(curl -s "https://api.coinbase.com/v2/prices/spot?currency=USD" | jq -r '.data.amount')

MSG="🌅 *Daily Briefing*\n\n🌤 Weather: ${WEATHER}\n💰 BTC: $${BTC}\n\nHave a productive day!"
mudslide send me "$MSG"
```

Cron setup:
```cron
0 8 * * * /path/to/daily-digest.sh
```

---

## 4. Group Operations & Community Management

### Automated Welcome Broadcast
Detect new participant joins and post onboarding info:

```js
// welcome.mjs
sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
  if (action === 'add') {
    for (const user of participants) {
      const tag = user.split('@')[0];
      await sock.sendMessage(id, {
        text: `Welcome @${tag} to the group! 👋\nPlease check the pinned rules.`,
        mentions: [user]
      });
    }
  }
});
```

### Interactive Polling Campaign
Trigger automated feedback loops across multiple groups with structured choices:

```bash
#!/bin/bash
GROUPS=("120363278663720267@g.us" "120363296018216189@g.us")
for g in "${GROUPS[@]}"; do
  mudslide send-poll "$g" "Which workshop topic next weekend?" \
    --item "Rust Systems Programming" \
    --item "LLM Fine-tuning & RAG" \
    --item "Mobile Security / Pentest" \
    --selectable 1
  sleep 5
done
```

---

## 5. Rich Media Automation

### Automated Chart/Report Sender
Generate a dynamic graph (via `gnuplot` or Python) and send immediately with caption:

```bash
python3 generate_metrics_chart.py --out report.png
mudslide send-image "$ADMIN_GROUP" report.png --caption "📈 Weekly Traffic & Growth Metrics"
```

### Audio Voice Note Dispatcher (PTT)
Deliver TTS or voice reminders as playable in-chat audio:

```bash
# Convert text to audio using edge-tts or gTTS
edge-tts --text "Reminder: Team standup in 10 minutes" --write-media reminder.mp3
mudslide send-file "$GROUP_ID" reminder.mp3 --type audio
```

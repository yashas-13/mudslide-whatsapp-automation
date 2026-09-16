# WhatsApp Capabilities: Baileys Matrix

Source: Baileys README (github.com/WhiskeySockets/Baileys) + mudslide `src/commands.ts`.

## Capability Availability

| Capability | mudslide CLI | Baileys API |
|---|---|---|
| Send text | ✅ `send` | `sendMessage(jid,{text})` |
| Send image | ✅ `send-image` | `sendMessage(jid,{image,caption})` |
| Send file/video/audio | ✅ `send-file --type` | `sendMessage(jid,{video\|audio\|document})` |
| Send location | ✅ `send-location` | `sendMessage(jid,{location})` |
| Send poll | ✅ `send-poll` | `sendMessage(jid,{poll})` |
| List groups | ✅ `groups` | `groupFetchAllParticipating()` |
| Group add/remove/list | ✅ `add/remove-from-group`, `list-group` | `groupParticipantsUpdate()` |
| **Receive/read messages** | ❌ (send-only FAQ) | `ev.on('messages.upsert')` |
| **Reply/quote** | ❌ | `sendMessage(jid,{text},{quoted:msg})` |
| **Mentions** | ❌ | `sendMessage(jid,{text,mentions:[jid]})` |
| **Reactions** | ❌ | `sendMessage(jid,{react:{text,key}})` |
| **Pin message** | ❌ | `sendMessage(jid,{pin:{type,time,key}})` (86400=24h, 604800=7d, 2592000=30d; type 0 removes) |
| **Forward** | ❌ | `sendMessage(jid,{forward:msg})` |
| **Contact card (vCard)** | ❌ | `sendMessage(jid,{contacts:{displayName,contacts:[{vcard}]}})` |
| **View-once media** | ❌ | `sendMessage(jid,{viewOnce:true,...})` |
| **GIF** | ❌ | video + `gifPlayback:true` (mp4) |
| **Video note** | ❌ | video + `ptv:true` |
| **Delete for everyone** | ❌ | `sendMessage(jid,{delete:key})` |
| **Edit message** | ❌ | `sendMessage(jid,{edit:key,text})` |
| **Download media** | ❌ | `downloadContentFromMessage(msg,'image\|video')` |
| **Presence** (typing/online) | partial `--typing` | `sendPresenceUpdate('composing'\|'paused'\|'online',jid)` |
| **Read receipts** | ❌ | `readMessages([key])` |
| Archive/mute/star/delete chat | ❌ | `chatModify({archive\|mute\|star\|clear\|delete},jid)` |
| Disappearing messages | ❌ | `chatModify({disappearingMessagesInChat},jid)` |
| Chat history query | ❌ | `loadMessages(jid,limit)` |
| Profile: name/status/DP | ❌ | `updateProfileName/Status/Picture` |
| Block/unblock | ❌ | `updateBlockStatus(jid,'block'\|'unblock')` |
| Privacy settings | ❌ | `updateLastSeenPrivacy` / `updateOnlinePrivacy` / `updateReadReceiptsPrivacy` / `updateStatusPrivacy` / `updateGroupsAddPrivacy` / `updateProfilePicturePrivacy` |
| **Status/Story broadcast** | ❌ | send to `status@broadcast` |
| Broadcast list | ❌ | send to `xxx@broadcast`, `groupMetadata` query |
| **Create group** | ❌ | `groupCreate(subject,participants[])` |
| Promote/demote admins | ❌ | `groupParticipantsUpdate(jid,[id],'promote'\|'demote')` |
| Group subject/description | ❌ | `groupUpdateSubject/Description` |
| Group settings | ❌ | `groupSettingUpdate(jid,'announcement'\|'not_announcement'\|'locked'\|'unlocked')` |
| Leave group | ❌ | `groupLeave(jid)` |
| **Invite code** get/revoke/join/info | ❌ | `groupInviteCode`, `groupRevokeInvite`, `groupAcceptInvite`, `groupGetInviteInfo` |
| **Join requests** approve/reject | ❌ | `groupRequestJoinList`, `groupRequestJoinUpdate` |
| Ephemeral (vanishing) messages | ❌ | `groupToggleEphemeral(jid,seconds)` |
| Exists check | ✅ `--live-check` | `onWhatsApp(jid)` |
| Fetch profile pic | ❌ | `profilePictureUrl(jid)` |
| Fetch presence | ❌ | `presence(jid)` |

## Key Trick: Reuse Existing mudslide Login

mudslide cache folder `~/.local/share/mudslide` **is** a Baileys `useMultiFileAuthState` folder. Point Baileys at it and you get receive/bot/admin powers with zero re-login:

```js
// bot.mjs — requires global baileys (ships with mudslide)
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'
// alias from mudslide's node_modules:
//   import { createRequire } from 'module'
//   const require = createRequire(import.meta.url)
//   const { default: makeWASocket, useMultiFileAuthState } = require(process.env.GLOBAL_MODULES + '/mudslide/node_modules/@whiskeysockets/baileys')

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

`markOnlineOnConnect: false` = stay invisible; device still works normally in WhatsApp app.

## Automation Recipes

### Auto-reply / keyword bot
`messages.upsert` + `sendMessage` loop (stub above). Command prefix (`!cmd`) routing.

### Scheduled digests (cron + mudslide)
```bash
# crontab
0 9 * * *  mudslide send <group-jid> "$(date '+%d %b') daily report"
```

### Status/story automation (Baileys)
```js
await sock.sendMessage('status@broadcast', { image: { url: 'pic.png' }, caption: 'New update!' })
```

### Mention-broadcast (Baileys)
```js
await sock.sendMessage(jid, { text: '@all', mentions: participantJids })
```

### Reaction automations
React to own sent message: `{ react: { text: '✅', key } }`; empty string removes.

## Safety

- No Selenium/Chromium — WebSocket only (~half GB RAM saved vs browser automation).
- Bulk/spam violates WhatsApp ToS; mudslide/Baileys both disclaim. Keep rates human.
- `DisconnectReason.loggedOut` (401) → re-login via `mudslide login`; `restartRequired` → reconnect loop.
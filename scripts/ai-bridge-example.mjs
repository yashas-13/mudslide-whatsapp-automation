// ai-bridge-example.mjs
// Standalone Baileys script reusing mudslide auth to route WhatsApp DMs/mentions to an LLM
// Run: node ai-bridge-example.mjs

import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import os from 'os';

const cacheFolder = process.env.MUDSLIDE_CACHE_FOLDER || path.join(os.homedir(), '.local/share/mudslide');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(cacheFolder);
  
  const sock = makeWASocket({
    auth: state,
    markOnlineOnConnect: false, // Stay invisible; mobile app works normally
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut
        : true;
      console.log('Connection closed, reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('WhatsApp AI bridge connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const m of messages) {
      if (m.key.fromMe) continue;
      
      const sender = m.key.remoteJid;
      const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';

      if (text.startsWith('!ai ')) {
        const prompt = text.replace('!ai ', '').trim();
        console.log(`Received prompt from ${sender}: ${prompt}`);

        // Typing indicator
        await sock.sendPresenceUpdate('composing', sender);

        try {
          // Replace with your preferred LLM endpoint (Ollama / OpenAI / Claude)
          const reply = `Echo from AI bridge: You asked "${prompt}"`;
          await sock.sendMessage(sender, { text: reply }, { quoted: m });
        } catch (err) {
          console.error('Failed to reply:', err);
        } finally {
          await sock.sendPresenceUpdate('paused', sender);
        }
      }
    }
  });
}

startBot();

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { signTechnocore } from './sign_message.js';
const [, , room, text] = process.argv;
if (!text) throw new Error('usage: technocore_preview.js <room> <text>');
const signed = signTechnocore(resolve(import.meta.dirname, '..'), room, String(Date.now()), text);
console.log(JSON.stringify({ type: 'POST PREVIEW — NOT SENT', did: signed.did, room: signed.room, message: signed.text, destination: `https://technocore.chat/r/${signed.room}`, secret_information_included: false, message_hash: createHash('sha256').update(signed.text, 'utf8').digest('hex'), signed_payload: { did: signed.did, sig: signed.signature, nonce: signed.nonce, text: signed.text } }, null, 2));

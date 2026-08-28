// This command performs exactly one request when a human has explicitly approved it.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { appendSendReceipt } from '../src/evidence/receipt.js';
import { reserveNonce } from '../src/technocore/nonce_ledger.js';
import { signTechnocore } from './sign_message.js';

const [, , approval, room, text] = process.argv;
if (approval !== '--approved' || !room || !text) throw new Error('usage: send_approved.js --approved <room> <text>');
const root = resolve(import.meta.dirname, '..');
const identity = JSON.parse(readFileSync(resolve(root, 'state/public/identity.json'), 'utf8'));
const nonce = reserveNonce(root, identity.did, room);
const signed = signTechnocore(root, room, nonce, text);
const sentAt = new Date().toISOString();
const response = await fetch(`https://technocore.chat/r/${signed.room}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ did: signed.did, sig: signed.signature, nonce: signed.nonce, text: signed.text }) });
const responseBody = await response.text();
let server = {};
try { server = JSON.parse(responseBody); } catch { /* receipt records only the body hash */ }
const receipt = { http_status: response.status, did: signed.did, room: signed.room, nonce: signed.nonce, message_hash: createHash('sha256').update(signed.text, 'utf8').digest('hex'), sent_at: sentAt, endpoint_kind: 'POST', response_hash: createHash('sha256').update(responseBody, 'utf8').digest('hex'), sequence: server.seq ?? server.sequence ?? 'UNAVAILABLE', server_timestamp: server.ts ?? server.timestamp ?? 'UNAVAILABLE' };
appendSendReceipt(resolve(root, 'evidence/send-receipts.jsonl'), receipt);
console.log(JSON.stringify(receipt, null, 2));
if (!response.ok) process.exitCode = 1;

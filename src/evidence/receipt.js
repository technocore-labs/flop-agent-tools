import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function appendSendReceipt(path, receipt) {
  const required = ['http_status', 'did', 'room', 'nonce', 'message_hash', 'sent_at', 'endpoint_kind', 'response_hash', 'sequence', 'server_timestamp'];
  for (const key of required) if (!(key in receipt)) throw new Error(`missing send receipt field: ${key}`);
  if (!Number.isInteger(receipt.http_status)) throw new Error('http_status must be an integer');
  if (!['POST', 'GET'].includes(receipt.endpoint_kind)) throw new Error('unsupported endpoint kind');
  for (const key of ['sequence', 'server_timestamp']) if (receipt[key] === null) receipt[key] = 'UNAVAILABLE';
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(receipt) + '\n', { encoding: 'utf8', mode: 0o600 });
}

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function appendContribution(path, record) {
  const required = ['timestamp','did','title','description','public_url','git_commit','technocore_room','technocore_seq','message_hash'];
  for (const field of required) if (!(field in record)) throw new Error(`missing evidence field: ${field}`);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(record) + '\n', { encoding: 'utf8', mode: 0o600 });
}

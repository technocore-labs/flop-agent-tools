import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const digest = value => createHash('sha256').update(value, 'utf8').digest('hex');
const canonical = value => {
  const sort = input => {
    if (Array.isArray(input)) return input.map(sort);
    if (input && typeof input === 'object') return Object.fromEntries(Object.keys(input).sort().map(key => [key, sort(input[key])]));
    return input;
  };
  return JSON.stringify(sort(value));
};

export class AutonomousEvidenceLedger {
  constructor(path) { this.path = path; }
  read() {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, 'utf8').split(/\r?\n/u).filter(Boolean).map(line => JSON.parse(line));
  }
  verify() {
    let previousHash = 'GENESIS'; let sequence = 1;
    for (const entry of this.read()) {
      const { record_hash: recordHash, ...unsigned } = entry;
      if (unsigned.sequence !== sequence || unsigned.previous_hash !== previousHash || digest(canonical(unsigned)) !== recordHash) return false;
      previousHash = recordHash; sequence += 1;
    }
    return true;
  }
  append(type, data, timestamp = new Date().toISOString()) {
    return this.appendMany([{ type, data, timestamp }])[0];
  }
  appendMany(records) {
    if (!Array.isArray(records) || records.length === 0) return [];
    if (!this.verify()) throw new Error('evidence ledger integrity failure');
    const entries = this.read();
    let sequence = entries.length + 1;
    let previousHash = entries.at(-1)?.record_hash ?? 'GENESIS';
    const appended = records.map(({ type, data, timestamp = new Date().toISOString() }) => {
      const unsigned = { sequence, previous_hash: previousHash, timestamp, type, data };
      const entry = { ...unsigned, record_hash: digest(canonical(unsigned)) };
      sequence += 1;
      previousHash = entry.record_hash;
      return entry;
    });
    mkdirSync(dirname(this.path), { recursive: true });
    appendFileSync(this.path, `${appended.map(entry => JSON.stringify(entry)).join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
    return appended;
  }
}

export function createAutonomousLedgers(directory) {
  return Object.fromEntries(['events', 'candidates', 'validations', 'posts', 'rejects'].map(name => [name, new AutonomousEvidenceLedger(`${directory}/${name}.jsonl`)]));
}

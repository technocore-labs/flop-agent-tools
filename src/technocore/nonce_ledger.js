import { closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertNonce, assertRoom } from './protocol.js';

const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function withLock(lockPath, action) {
  const deadline = Date.now() + 5_000;
  let fd;
  while (true) {
    try { fd = openSync(lockPath, 'wx', 0o600); break; }
    catch (error) {
      if (error.code !== 'EEXIST' || Date.now() >= deadline) throw new Error('nonce ledger is locked; no nonce was reserved');
      sleep(25);
    }
  }
  try { return action(); } finally { closeSync(fd); unlinkSync(lockPath); }
}

export function reserveNonce(root, did, room, floor = Date.now()) {
  room = assertRoom(room);
  const floorNonce = BigInt(assertNonce(floor));
  const stateDir = resolve(root, 'state/public');
  const ledgerPath = resolve(stateDir, 'nonce-ledger.json');
  const lockPath = resolve(stateDir, 'nonce-ledger.lock');
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  return withLock(lockPath, () => {
    const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : { version: 1, entries: {} };
    const previous = BigInt(ledger.entries?.[did]?.[room]?.last_nonce ?? '0');
    const nonce = (floorNonce > previous ? floorNonce : previous + 1n).toString();
    ledger.entries[did] ??= {};
    ledger.entries[did][room] = { last_nonce: nonce, reserved_at: new Date().toISOString() };
    const temporary = `${ledgerPath}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(ledger, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
    renameSync(temporary, ledgerPath);
    return nonce;
  });
}

export function recordConfirmedNonce(root, did, room, nonce) {
  room = assertRoom(room);
  const confirmed = BigInt(assertNonce(nonce));
  const stateDir = resolve(root, 'state/public');
  const ledgerPath = resolve(stateDir, 'nonce-ledger.json');
  const lockPath = resolve(stateDir, 'nonce-ledger.lock');
  mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  return withLock(lockPath, () => {
    const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf8')) : { version: 1, entries: {} };
    const previous = BigInt(ledger.entries?.[did]?.[room]?.last_nonce ?? '0');
    if (confirmed < previous) throw new Error('confirmed nonce would move the ledger backward');
    ledger.entries[did] ??= {};
    ledger.entries[did][room] = { last_nonce: confirmed.toString(), confirmed_at: new Date().toISOString() };
    const temporary = `${ledgerPath}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(ledger, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
    renameSync(temporary, ledgerPath);
  });
}

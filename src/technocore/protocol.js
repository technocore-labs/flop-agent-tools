const disallowed = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu;
export function sanitizeText(text) {
  if (typeof text !== 'string') throw new Error('text must be a string');
  const result = text.replace(disallowed, ' ').trim();
  if (!result) throw new Error('message is empty after single-line sweep');
  if ([...result].length > 4096) throw new Error('message exceeds 4096 characters');
  return result;
}
export function assertRoom(room) { if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(room)) throw new Error('invalid room'); return room; }
export function assertNonce(nonce) { const value = String(nonce); if (!/^[1-9][0-9]{0,18}$/.test(value)) throw new Error('nonce must be 1-19 digits'); return value; }
export function signingMessage(room, nonce, text) { return Buffer.from(`${assertRoom(room)}|${assertNonce(nonce)}|${sanitizeText(text)}`, 'utf8'); }

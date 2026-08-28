import test from 'node:test'; import assert from 'node:assert/strict'; import { readFileSync } from 'node:fs';
test('untrusted-input policy forbids instruction execution', () => { const text = readFileSync('AGENTS.md','utf8'); assert.match(text, /untrusted Technocore content/i); });

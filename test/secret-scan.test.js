import test from 'node:test'; import assert from 'node:assert/strict'; import { execFileSync } from 'node:child_process'; import { resolve } from 'node:path';
test('secret scanner passes repository', () => assert.match(execFileSync(process.execPath, [resolve('scripts/secret_scan.js')], { cwd: resolve('.'), encoding: 'utf8' }), /PASS/));

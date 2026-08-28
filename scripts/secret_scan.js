import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const excluded = new Set(['.git', 'node_modules', 'state/private', 'private', 'secrets', 'credentials']);
const forbiddenNames = new Set(['.env']);
const patterns = [/SIGN_SEED\s*=/i, /BEGIN (?:[A-Z ]+ )?PRIVATE KEY/, /\bseed\s*[:=]\s*['"][A-Za-z0-9+/_=-]{24,}/i];
function walk(dir) { for (const entry of readdirSync(dir)) { const full = resolve(dir, entry); const rel = relative(root, full).replaceAll('\\', '/'); if (excluded.has(rel) || entry === '.git') continue; if (statSync(full).isDirectory()) walk(full); else { if (forbiddenNames.has(entry)) throw new Error(`forbidden tracked filename: ${rel}`); const data = readFileSync(full, 'utf8'); if (patterns.some(p => p.test(data))) throw new Error(`possible secret found: ${rel}`); } } }
walk(root); console.log('Secret exposure test: PASS');

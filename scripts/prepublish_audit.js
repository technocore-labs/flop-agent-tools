import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const tracked = git(['ls-files']);
if (/(^|\n)(state\/private|private|secrets|credentials)(\/|\n)/.test(tracked)) throw new Error('private path is tracked');
const historyNames = git(['log', '--all', '--name-only', '--pretty=format:']);
if (/(^|\n)(state\/private|private|secrets|credentials)(\/|\n)/.test(historyNames)) throw new Error('private path exists in Git history');
const history = git(['log', '--all', '-p', '--format=']);
const forbidden = [/SIGN_SEED\s*=/i, /BEGIN (?:[A-Z ]+ )?PRIVATE KEY/, /\bseed\s*[:=]\s*['"][A-Za-z0-9+/_=-]{24,}/i, /[A-Z]:\\Users\\/i, /\/Users\//, /\/home\//];
if (forbidden.some(pattern => pattern.test(history))) throw new Error('sensitive content or absolute user path exists in Git history');
const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
if (forbidden.some(pattern => pattern.test(readme))) throw new Error('README contains sensitive content or an absolute user path');
console.log('Pre-publication audit: PASS');

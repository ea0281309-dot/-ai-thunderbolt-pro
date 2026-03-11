import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distIndexPath = path.join(rootDir, 'dist', 'index.html');

test('build injects configured API URL into the frontend bundle', () => {
  execFileSync('node', ['scripts/build.mjs'], {
    cwd: rootDir,
    env: {
      ...process.env,
      VITE_API_URL: 'https://backend.example.com'
    }
  });

  const builtHtml = readFileSync(distIndexPath, 'utf8');
  assert.match(builtHtml, /https:\/\/backend\.example\.com/);
});

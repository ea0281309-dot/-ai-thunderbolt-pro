import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const apiBaseUrl = process.env.VITE_API_URL || 'http://localhost:3001';

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await cp(sourceDir, distDir, { recursive: true });

const indexPath = path.join(distDir, 'index.html');
const indexHtml = await readFile(indexPath, 'utf8');
await writeFile(indexPath, indexHtml.replaceAll('__API_BASE_URL__', apiBaseUrl));

import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await cp(sourceDir, distDir, { recursive: true });

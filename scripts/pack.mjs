/**
 * Build a Microsoft Edge Add-ons upload zip.
 * Store packages must NOT include manifest.key (Partner Center rejects it).
 */
import { spawnSync } from 'child_process';
import {
  readFileSync,
  writeFileSync,
  rmSync,
  mkdirSync,
  cpSync,
  existsSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const stage = join(root, '.store-pack');
const zipPath = join(root, 'TubeFolders.zip');

const build = spawnSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});
if (build.status !== 0) process.exit(build.status || 1);

rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
cpSync(dist, stage, { recursive: true });

// Drop source maps from the store package
for (const rel of ['background.js.map', 'content.js.map', 'popup/popup.js.map']) {
  rmSync(join(stage, rel), { force: true });
}

const manifestPath = join(stage, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
delete manifest.key;
// Edge listing prefers an explicit default_locale when present; keep package minimal
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

rmSync(zipPath, { force: true });
const zip = spawnSync('zip', ['-r', '-q', zipPath, '.'], {
  cwd: stage,
  stdio: 'inherit',
});
rmSync(stage, { recursive: true, force: true });
if (zip.status !== 0) process.exit(zip.status || 1);

console.log('Store package ready:', zipPath);
console.log('Note: manifest.key was stripped (required by Edge Add-ons).');
console.log(
  'After publish, if Google sign-in fails, add the store extension ID redirect URI in Google Cloud OAuth.'
);
if (existsSync(join(root, '.extension-id'))) {
  const id = readFileSync(join(root, '.extension-id'), 'utf8').trim();
  console.log('(Local pinned ID stays', id + ' for unpacked builds.)');
}

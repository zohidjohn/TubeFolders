import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'src/background.js')],
  bundle: true,
  outfile: join(dist, 'background.js'),
  format: 'esm',
  platform: 'browser',
  target: ['chrome120'],
  sourcemap: true,
});

await esbuild.build({
  entryPoints: [join(root, 'src/content/main.js')],
  bundle: true,
  outfile: join(dist, 'content.js'),
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
  sourcemap: true,
});

await esbuild.build({
  entryPoints: [join(root, 'src/popup/popup.js')],
  bundle: true,
  outfile: join(dist, 'popup/popup.js'),
  format: 'esm',
  platform: 'browser',
  target: ['chrome120'],
  sourcemap: true,
});

mkdirSync(join(dist, 'popup'), { recursive: true });
mkdirSync(join(dist, 'styles'), { recursive: true });
mkdirSync(join(dist, 'assets/fonts'), { recursive: true });
mkdirSync(join(dist, 'icons'), { recursive: true });

cpSync(join(root, 'src/popup/popup.html'), join(dist, 'popup/popup.html'));
cpSync(join(root, 'src/styles/theme.css'), join(dist, 'styles/theme.css'));
cpSync(join(root, 'src/styles/popup.css'), join(dist, 'styles/popup.css'));
cpSync(join(root, 'src/styles/inject.css'), join(dist, 'styles/inject.css'));
cpSync(
  join(root, 'src/assets/fonts/Outfit-Variable.ttf'),
  join(dist, 'assets/fonts/Outfit-Variable.ttf')
);
for (const size of [16, 32, 48, 128]) {
  cpSync(join(root, `icons/icon${size}.png`), join(dist, `icons/icon${size}.png`));
}

// Fix CSS paths in popup HTML for dist layout
let html = readFileSync(join(dist, 'popup/popup.html'), 'utf8');
html = html
  .replaceAll('../styles/theme.css', '../styles/theme.css')
  .replaceAll('../styles/popup.css', '../styles/popup.css');
writeFileSync(join(dist, 'popup/popup.html'), html);

// theme.css font path from styles/ -> ../assets/fonts
let theme = readFileSync(join(dist, 'styles/theme.css'), 'utf8');
theme = theme.replace(
  "url('../assets/fonts/Outfit-Variable.ttf')",
  "url('../assets/fonts/Outfit-Variable.ttf')"
);
writeFileSync(join(dist, 'styles/theme.css'), theme);

const key = existsSync(join(root, '.extension-key'))
  ? readFileSync(join(root, '.extension-key'), 'utf8').trim()
  : '';
const configHint = existsSync(join(root, 'src/config.js'))
  ? readFileSync(join(root, 'src/config.js'), 'utf8')
  : '';
const oauthMatch = configHint.match(
  /oauthClientId\s*=\s*['"]([^'"]+)['"]/
);
const oauthClientId =
  oauthMatch?.[1] && !oauthMatch[1].startsWith('YOUR_')
    ? oauthMatch[1]
    : 'YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com';

const manifest = {
  manifest_version: 3,
  name: 'TubeFolders',
  version: '1.0.0',
  description:
    'Group YouTube subscriptions into folders with Lucide icons. Sync with Google + Firestore.',
  action: {
    default_popup: 'popup/popup.html',
    default_title: 'TubeFolders',
    default_icon: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  permissions: ['storage', 'identity'],
  host_permissions: [
    'https://www.youtube.com/*',
    'https://accounts.google.com/*',
    'https://*.googleapis.com/*',
    'https://*.firebaseio.com/*',
    'https://*.cloudfunctions.net/*',
    'https://*.firebaseapp.com/*',
  ],
  oauth2: {
    client_id: oauthClientId,
    scopes: ['openid', 'email', 'profile'],
  },
  content_scripts: [
    {
      matches: ['https://www.youtube.com/*'],
      js: ['content.js'],
      css: ['styles/inject.css'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['assets/fonts/*'],
      matches: ['https://www.youtube.com/*'],
    },
  ],
};

if (key) manifest.key = key;

writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Built dist/');
if (existsSync(join(root, '.extension-id'))) {
  const id = readFileSync(join(root, '.extension-id'), 'utf8').trim();
  console.log('Pinned extension ID:', id);
  console.log(`OAuth redirect URI: https://${id}.chromiumapp.org/`);
}

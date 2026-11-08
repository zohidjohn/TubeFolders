# TubeFolders

Edge / Chrome extension that adds a **Folders** section above YouTube’s default subscriptions list. Group channels, pick Lucide icons, assign a channel to multiple folders, and sync everything with **Google sign-in + Firestore**.

## Features

- Collapsible folders in the YouTube sidebar (above the native list)
- Lucide icons per folder
- Multi-folder assign panel on channel pages
- Filed vs unfiled highlighting on YouTube’s default subscription rows
- Flat red/black UI with the Outfit font
- Firestore cloud backup + Export/Import JSON

## Load in Microsoft Edge

1. `npm install`
2. Edit [`src/config.js`](src/config.js) with your Firebase web config and OAuth client ID
3. `npm run build`
4. Edge → `edge://extensions` → Developer mode → **Load unpacked** → select the `dist/` folder

Pinned extension ID (from `manifest.key`):

```text
clnkihfoeejlnhmjiobioepegefjfgdb
```

OAuth redirect URI to register:

```text
https://clnkihfoeejlnhmjiobioepegefjfgdb.chromiumapp.org/
```

## Firebase setup

1. Create a Firebase project (Spark / free is fine)
2. **Authentication → Sign-in method → Google** → enable
3. **Authorized domains** (hostnames only): `localhost`, `YOUR_PROJECT_ID.firebaseapp.com`
4. **Firestore** → create Native mode database → deploy rules:

```bash
npx firebase login
npx firebase use YOUR_PROJECT_ID
npx firebase deploy --only firestore:rules
```

5. **Project settings → Your apps → Web** → copy config into `src/config.js`
6. **Google Cloud Console → Credentials → OAuth 2.0 Client ID**
   - Type **Chrome Extension** with ID `clnkihfoeejlnhmjiobioepegefjfgdb`, **or**
   - Type **Web application** with redirect  
     `https://clnkihfoeejlnhmjiobioepegefjfgdb.chromiumapp.org/`
7. Put that client ID in `src/config.js` (`oauthClientId`) and rebuild (`npm run build`)  
   The build also writes it into `dist/manifest.json` → `oauth2.client_id`

### Prototype Firestore rules

See [`firestore.rules`](firestore.rules). Owner-only access under `users/{uid}`.

## Usage

1. Open the extension popup → create folders (name + icon)
2. Open a YouTube channel page → use **Add to folders** → Save
3. Reload YouTube → folders appear above Subscriptions; filed channels get a red accent in the default list
4. Sign in with Google → **Sync now** (or automatic after sign-in)

## Export / Import

Popup → **Export JSON** / **Import JSON** for offline backups (OneDrive, USB, etc.).

## Package for Edge Add-ons

```bash
npm run pack
```

Uploads `TubeFolders.zip` in Partner Center. The pack script **strips `manifest.key`** (Edge rejects it) and excludes source maps. Local `npm run build` still keeps the key so your unpacked ID stays pinned.

## Git remote

```bash
git init
git add .
git commit -m "Initial TubeFolders extension"
git remote add origin https://github.com/zohidjohn/TubeFolders.git
git branch -M main
git push -u origin main
```

## Design

- Font: Outfit (bundled)
- Colors: black `#0a0a0a` / `#141414`, accent red `#e11d2e`
- Flat only — no glow, gradients, or pill buttons

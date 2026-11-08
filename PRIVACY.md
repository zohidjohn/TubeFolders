# TubeFolders Privacy Policy

**Last updated:** November 8, 2026

TubeFolders (“the extension”) helps you organize YouTube subscriptions into folders. This policy explains what data we handle and why.

## Data we collect

When you use TubeFolders, we may process:

- **Google account profile data** (if you sign in): display name, email address, and profile photo, used only to identify your sync account.
- **Folder library data**: folder names, colors, icons, and which YouTube channels you assigned to which folders.
- **Channel metadata from YouTube pages you visit while using the extension**: channel id/handle, display name, and avatar URL, used to build and show your folders.

We do **not** collect passwords, payment information, health data, precise location, or private messages.

## How we use data

- Store your folders locally in the browser (`chrome.storage`).
- Optionally sync your folder library to **Google Firebase / Cloud Firestore** under your signed-in user id so it can restore on another device/browser.
- Display folders and related UI on `youtube.com`.

## Storage and third parties

- Local storage stays on your device.
- Optional cloud sync uses Google Firebase Authentication and Firestore. Google’s processing is also covered by [Google’s Privacy Policy](https://policies.google.com/privacy).
- We do not sell your data. We do not use your data for advertising or credit decisions.

## Permissions

- **storage** — save folders and settings on your device.
- **identity** — Google sign-in for optional sync.
- **Host access to YouTube and Google/Firebase endpoints** — inject the folder UI on YouTube and talk to Google sign-in / Firestore APIs.

## Your choices

- You can use TubeFolders without signing in (local-only folders).
- You can export/import your library as JSON from the extension popup.
- You can sign out; you may also delete your Firestore data by contacting support or deleting documents under your Firebase user (if you operate the project).
- Uninstalling the extension removes local extension storage on that browser profile.

## Contact

For privacy questions: open an issue at [github.com/zohidjohn/TubeFolders](https://github.com/zohidjohn/TubeFolders) or email the address listed on the Edge Add-ons support contact for this extension.

## Changes

We may update this policy when the extension’s data practices change. The “Last updated” date above will change when we do.

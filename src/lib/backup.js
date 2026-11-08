import { getLibrary, setLibrary, emptyLibrary } from './storage.js';

const BACKUP_VERSION = 1;

export async function exportLibraryJson() {
  const library = await getLibrary();
  return JSON.stringify(
    {
      app: 'TubeFolders',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      library: {
        folders: library.folders,
        channels: library.channels,
      },
    },
    null,
    2
  );
}

export function downloadBackup(jsonText) {
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tubefolders-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
  const library = data.library || data;
  if (!Array.isArray(library.folders)) throw new Error('Backup missing folders');
  if (!library.channels || typeof library.channels !== 'object') {
    throw new Error('Backup missing channels');
  }
  return {
    folders: library.folders,
    channels: library.channels,
    updatedAt: Date.now(),
  };
}

export async function importLibraryJson(text, { merge = false } = {}) {
  const incoming = parseBackup(text);
  if (!merge) {
    return setLibrary(incoming, { dirty: true });
  }
  const current = await getLibrary();
  const folderById = new Map(current.folders.map((f) => [f.id, f]));
  for (const folder of incoming.folders) {
    const existing = folderById.get(folder.id);
    if (!existing) {
      folderById.set(folder.id, folder);
    } else {
      const ids = new Set([...(existing.channelIds || []), ...(folder.channelIds || [])]);
      folderById.set(folder.id, {
        ...existing,
        name: folder.name || existing.name,
        icon: folder.icon || existing.icon,
        channelIds: [...ids],
      });
    }
  }
  return setLibrary(
    {
      folders: [...folderById.values()],
      channels: { ...current.channels, ...incoming.channels },
      updatedAt: Date.now(),
    },
    { dirty: true }
  );
}

export { emptyLibrary };

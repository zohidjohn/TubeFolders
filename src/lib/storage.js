import { isExtensionAlive, safeStorageGet, safeStorageSet } from './extension.js';

const LIBRARY_KEY = 'library';
const AUTH_META_KEY = 'authMeta';
const DIRTY_KEY = 'libraryDirty';

export function emptyLibrary() {
  return { folders: [], channels: {}, updatedAt: 0 };
}

export async function getLibrary() {
  const data = await safeStorageGet(LIBRARY_KEY);
  const lib = data[LIBRARY_KEY];
  if (!lib || typeof lib !== 'object') return emptyLibrary();
  return {
    folders: Array.isArray(lib.folders) ? lib.folders : [],
    channels: lib.channels && typeof lib.channels === 'object' ? lib.channels : {},
    updatedAt: lib.updatedAt || 0,
  };
}

export async function setLibrary(library, { dirty = true } = {}) {
  const next = {
    folders: library.folders || [],
    channels: library.channels || {},
    updatedAt: library.updatedAt || Date.now(),
  };
  await safeStorageSet({
    [LIBRARY_KEY]: next,
    [DIRTY_KEY]: dirty,
  });
  return next;
}

export async function isLibraryDirty() {
  const data = await safeStorageGet(DIRTY_KEY);
  return Boolean(data[DIRTY_KEY]);
}

export async function clearDirty() {
  await safeStorageSet({ [DIRTY_KEY]: false });
}

export async function setAuthMeta(meta) {
  await safeStorageSet({ [AUTH_META_KEY]: meta || null });
}

export async function getAuthMeta() {
  const data = await safeStorageGet(AUTH_META_KEY);
  return data[AUTH_META_KEY] || null;
}

export function createId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function upsertChannel(channel) {
  const lib = await getLibrary();
  lib.channels[channel.id] = {
    id: channel.id,
    name: channel.name || lib.channels[channel.id]?.name || 'Channel',
    handle: channel.handle || lib.channels[channel.id]?.handle || '',
    avatarUrl: channel.avatarUrl || lib.channels[channel.id]?.avatarUrl || '',
  };
  return setLibrary(lib);
}

export async function createFolder({ name, icon, color }) {
  const lib = await getLibrary();
  const folder = {
    id: createId(),
    name: (name || 'New folder').trim() || 'New folder',
    icon: icon || 'Folder',
    color: color || '#e11d2e',
    channelIds: [],
  };
  lib.folders.push(folder);
  await setLibrary(lib);
  return folder;
}

export async function updateFolder(folderId, patch) {
  const lib = await getLibrary();
  const idx = lib.folders.findIndex((f) => f.id === folderId);
  if (idx === -1) throw new Error('Folder not found');
  lib.folders[idx] = { ...lib.folders[idx], ...patch, id: folderId };
  await setLibrary(lib);
  return lib.folders[idx];
}

export async function deleteFolder(folderId) {
  const lib = await getLibrary();
  lib.folders = lib.folders.filter((f) => f.id !== folderId);
  await setLibrary(lib);
}

export async function setChannelFolders(channel, folderIds) {
  const lib = await getLibrary();
  const id = channel.id;
  lib.channels[id] = {
    id,
    name: channel.name || lib.channels[id]?.name || 'Channel',
    handle: channel.handle || lib.channels[id]?.handle || '',
    avatarUrl: channel.avatarUrl || lib.channels[id]?.avatarUrl || '',
  };
  const selected = new Set(folderIds);
  for (const folder of lib.folders) {
    const has = folder.channelIds.includes(id);
    if (selected.has(folder.id) && !has) folder.channelIds.push(id);
    if (!selected.has(folder.id) && has) {
      folder.channelIds = folder.channelIds.filter((cid) => cid !== id);
    }
  }
  await setLibrary(lib);
  return lib;
}

export function getFiledChannelIds(library) {
  const ids = new Set();
  for (const folder of library.folders || []) {
    for (const id of folder.channelIds || []) ids.add(id);
  }
  return ids;
}

export function onLibraryChange(callback) {
  if (!isExtensionAlive()) return () => {};
  const listener = (changes, area) => {
    if (!isExtensionAlive()) return;
    if (area === 'local' && changes[LIBRARY_KEY]) {
      callback(changes[LIBRARY_KEY].newValue || emptyLibrary());
    }
  };
  try {
    chrome.storage.onChanged.addListener(listener);
  } catch {
    return () => {};
  }
  return () => {
    try {
      chrome.storage.onChanged.removeListener(listener);
    } catch {
      /* invalidated */
    }
  };
}

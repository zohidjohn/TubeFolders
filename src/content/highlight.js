import { getLibrary, onLibraryChange } from '../lib/storage.js';
import { extractChannelFromGuideItem } from '../lib/youtube.js';

function guideEntries() {
  return [
    ...document.querySelectorAll(
      'ytd-guide-entry-renderer, yt-guide-entry-renderer'
    ),
  ];
}

function isInsideTubeFolders(el) {
  return Boolean(el.closest('#tf-sidebar-section'));
}

function channelMatchesId(channel, id, meta) {
  if (!channel || !id) return false;
  if (channel.id === id) return true;
  if (channel.handle && (channel.handle === id || channel.handle === meta?.handle)) return true;
  const handle = channel.handle?.replace(/^@/, '') || '';
  const metaHandle = meta?.handle?.replace(/^@/, '') || '';
  if (handle && (id === handle || id === `@${handle}` || handle === metaHandle)) return true;
  if (channel.name && meta?.name && channel.name.toLowerCase() === meta.name.toLowerCase()) {
    return true;
  }
  return false;
}

/** First matching folder color for a channel (multi-folder → first folder wins). */
function folderColorForChannel(channel, library) {
  for (const folder of library.folders || []) {
    for (const id of folder.channelIds || []) {
      const meta = library.channels?.[id];
      if (channelMatchesId(channel, id, meta)) {
        return folder.color || '#e11d2e';
      }
    }
  }
  return null;
}

export async function highlightSubscriptions() {
  const library = await getLibrary();

  for (const entry of guideEntries()) {
    if (isInsideTubeFolders(entry)) continue;
    const channel = extractChannelFromGuideItem(entry);
    if (!channel) {
      entry.classList.remove('tf-filed', 'tf-unfiled');
      entry.style.removeProperty('--tf-folder-bar');
      delete entry.dataset.tfChannelId;
      continue;
    }
    const color = folderColorForChannel(channel, library);
    const isFiled = Boolean(color);
    entry.classList.toggle('tf-filed', isFiled);
    entry.classList.toggle('tf-unfiled', !isFiled);
    entry.dataset.tfChannelId = channel.id;
    if (isFiled) entry.style.setProperty('--tf-folder-bar', color);
    else entry.style.removeProperty('--tf-folder-bar');
  }
}

export function startHighlight() {
  highlightSubscriptions();
  onLibraryChange(() => highlightSubscriptions());
}

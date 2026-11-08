import { getLibrary, getFiledChannelIds, onLibraryChange } from '../lib/storage.js';
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

function buildAliasIndex(library) {
  const filed = getFiledChannelIds(library);
  const aliases = new Set(filed);
  for (const [id, meta] of Object.entries(library.channels || {})) {
    if (!filed.has(id)) continue;
    aliases.add(id);
    if (meta?.handle) {
      aliases.add(meta.handle);
      aliases.add(meta.handle.replace(/^@/, ''));
      aliases.add(`@${meta.handle.replace(/^@/, '')}`);
    }
    if (meta?.name) aliases.add(meta.name.toLowerCase());
  }
  return aliases;
}

function isChannelFiled(channel, aliases) {
  if (!channel) return false;
  if (aliases.has(channel.id)) return true;
  if (channel.handle && aliases.has(channel.handle)) return true;
  if (channel.handle && aliases.has(channel.handle.replace(/^@/, ''))) return true;
  if (channel.name && aliases.has(channel.name.toLowerCase())) return true;
  return false;
}

export async function highlightSubscriptions() {
  const library = await getLibrary();
  const aliases = buildAliasIndex(library);

  for (const entry of guideEntries()) {
    if (isInsideTubeFolders(entry)) continue;
    const channel = extractChannelFromGuideItem(entry);
    if (!channel) {
      entry.classList.remove('tf-filed', 'tf-unfiled');
      continue;
    }
    const isFiled = isChannelFiled(channel, aliases);
    entry.classList.toggle('tf-filed', isFiled);
    entry.classList.toggle('tf-unfiled', !isFiled);
    entry.dataset.tfChannelId = channel.id;
  }
}

export function startHighlight() {
  highlightSubscriptions();
  onLibraryChange(() => highlightSubscriptions());
}

import { extractChannelFromGuideItem } from './youtube.js';

/**
 * Detect which guide subscription channels YouTube marks as having new content.
 * Heuristics: newness dot, unread badge, bold title styling.
 */
export function collectNewChannelIds() {
  const ids = new Set();
  const entries = document.querySelectorAll(
    'ytd-guide-entry-renderer, yt-guide-entry-renderer'
  );

  for (const entry of entries) {
    if (entry.closest('#tf-sidebar-section')) continue;

    const hasDot =
      entry.querySelector('#newness-dot:not([hidden])') ||
      entry.querySelector('.guide-entry-new-unseen-dot') ||
      entry.querySelector('[class*="newness"]');

    const badge = entry.querySelector(
      '.guide-entry-count, #guide-entry-count, .yt-spec-status-badge, [class*="badge"]'
    );
    const badgeText = (badge?.textContent || '').trim();
    const hasBadge = Boolean(badgeText && /\d+/.test(badgeText));

    const title =
      entry.querySelector('#guide-entry-title, .title, yt-formatted-string') ||
      entry.querySelector('a');
    let bold = false;
    if (title) {
      const weight = Number.parseInt(getComputedStyle(title).fontWeight, 10);
      bold = weight >= 500;
      // YouTube often uses semi-bold for unseen
      if (title.hasAttribute('is-empty')) bold = false;
    }

    if (!hasDot && !hasBadge && !bold) continue;

    const channel = extractChannelFromGuideItem(entry);
    if (channel?.id) ids.add(channel.id);
  }

  return ids;
}

export function countNewInFolder(folder, channels, newIds) {
  let count = 0;
  for (const id of folder.channelIds || []) {
    if (newIds.has(id)) {
      count += 1;
      continue;
    }
    const meta = channels[id];
    if (!meta) continue;
    if (meta.handle && newIds.has(meta.handle)) count += 1;
    else if (meta.handle && newIds.has(`@${meta.handle.replace(/^@/, '')}`))
      count += 1;
  }
  return count;
}

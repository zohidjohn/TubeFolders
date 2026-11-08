/** Parse YouTube channel identity from URLs and DOM. */

export function parseChannelFromHref(href) {
  if (!href) return null;
  try {
    const url = new URL(href, 'https://www.youtube.com');
    const path = url.pathname;

    let m = path.match(/^\/channel\/(UC[\w-]+)/i);
    if (m) return { id: m[1], handle: '', url: url.pathname };

    m = path.match(/^\/@([\w.-]+)/);
    if (m) return { id: `@${m[1]}`, handle: `@${m[1]}`, url: url.pathname };

    m = path.match(/^\/c\/([\w.-]+)/);
    if (m) return { id: `c/${m[1]}`, handle: m[1], url: url.pathname };

    m = path.match(/^\/user\/([\w.-]+)/);
    if (m) return { id: `user/${m[1]}`, handle: m[1], url: url.pathname };
  } catch {
    return null;
  }
  return null;
}

export function channelKeyFromParsed(parsed) {
  return parsed?.id || null;
}

export function extractChannelFromGuideItem(el) {
  const link =
    el.querySelector('a#endpoint') ||
    el.querySelector('a.yt-simple-endpoint') ||
    el.closest('a') ||
    el.querySelector('a');
  if (!link) return null;
  const href = link.getAttribute('href') || '';
  const parsed = parseChannelFromHref(href);
  if (!parsed) return null;

  const titleEl =
    el.querySelector('#guide-entry-title') ||
    el.querySelector('.title') ||
    el.querySelector('yt-formatted-string') ||
    link;
  const name = (titleEl?.textContent || '').trim() || parsed.handle || 'Channel';
  const img = el.querySelector('img');
  const avatarUrl = img?.src || img?.getAttribute('src') || '';

  return {
    id: parsed.id,
    name,
    handle: parsed.handle || '',
    avatarUrl,
    href: href.startsWith('http') ? href : `https://www.youtube.com${href}`,
  };
}

function findUcIdInPage() {
  // Prefer page-identity meta only — never scrape the whole document
  // (recommendations embed other channelIds and poison membership checks).
  const candidates = [
    document.querySelector('meta[itemprop="channelId"]')?.content,
    document.querySelector('link[itemprop="url"]')?.href,
    document.querySelector('meta[property="og:url"]')?.content,
    document.querySelector('link[rel="canonical"]')?.href,
    document.querySelector('#page-header a[href*="/channel/UC"]')?.href,
    document.querySelector('yt-page-header-view-model a[href*="/channel/UC"]')?.href,
  ].filter(Boolean);

  for (const value of candidates) {
    const m =
      String(value).match(/\/channel\/(UC[\w-]+)/i) ||
      String(value).match(/^(UC[\w-]+)$/);
    if (m) return m[1];
  }
  return null;
}

/** Stable keys that may all refer to the same channel in storage. */
export function channelIdentityKeys(channel) {
  if (!channel) return [];
  const keys = new Set();
  if (channel.id) keys.add(channel.id);
  if (channel.handle) keys.add(channel.handle);
  if (channel.id?.startsWith('@')) keys.add(channel.id);
  return [...keys];
}

export function folderHasChannel(folder, channel) {
  const ids = new Set(folder?.channelIds || []);
  return channelIdentityKeys(channel).some((k) => ids.has(k));
}

export function extractChannelFromPage() {
  const canonical =
    document.querySelector('link[rel="canonical"]')?.href ||
    location.href;
  const parsed = parseChannelFromHref(location.href) || parseChannelFromHref(canonical);
  if (!parsed) return null;

  const handle =
    parsed.handle ||
    (parsed.id.startsWith('@') ? parsed.id : '') ||
    '';

  // Prefer handle from the URL for SPA stability; attach UC id when available.
  const ucId = findUcIdInPage();
  // Storage key: prefer UC when we have it, else handle/path id from the URL.
  // URL handle always wins over a mismatched stale UC (should not happen now).
  const id = ucId || parsed.id;

  const name =
    document.querySelector('#page-header h1')?.textContent ||
    document.querySelector('yt-page-header-view-model h1')?.textContent ||
    document.querySelector('meta[property="og:title"]')?.content ||
    document.querySelector('#channel-name yt-formatted-string')?.textContent ||
    document.querySelector('ytd-channel-name yt-formatted-string')?.textContent ||
    handle ||
    'Channel';

  const avatarUrl =
    document.querySelector('#page-header img')?.src ||
    document.querySelector('yt-page-header-view-model img')?.src ||
    document.querySelector('meta[property="og:image"]')?.content ||
    document.querySelector('#avatar img')?.src ||
    '';

  return {
    id,
    name: name.trim(),
    handle,
    avatarUrl,
    href: location.href,
    ucId: ucId || '',
  };
}

export function isChannelPage() {
  const p = location.pathname;
  return (
    /^\/@[\w.-]+/.test(p) ||
    /^\/channel\/UC[\w-]+/i.test(p) ||
    /^\/c\/[\w.-]+/.test(p) ||
    /^\/user\/[\w.-]+/.test(p)
  );
}

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
  const candidates = [
    document.querySelector('link[itemprop="url"]')?.href,
    document.querySelector('meta[itemprop="channelId"]')?.content,
    document.querySelector('meta[property="og:url"]')?.content,
    ...[...document.querySelectorAll('a[href*="/channel/UC"]')].map((a) => a.href),
  ].filter(Boolean);

  for (const value of candidates) {
    const m = String(value).match(/\/channel\/(UC[\w-]+)/i) || String(value).match(/^(UC[\w-]+)$/);
    if (m) return m[1];
  }

  const html = document.documentElement?.innerHTML?.slice(0, 500000) || '';
  const browse = html.match(/"browseId"\s*:\s*"(UC[\w-]+)"/);
  if (browse) return browse[1];
  const channelId = html.match(/"channelId"\s*:\s*"(UC[\w-]+)"/);
  if (channelId) return channelId[1];
  return null;
}

export function extractChannelFromPage() {
  const canonical =
    document.querySelector('link[rel="canonical"]')?.href ||
    location.href;
  const parsed = parseChannelFromHref(canonical) || parseChannelFromHref(location.href);
  if (!parsed) return null;

  const ucId = findUcIdInPage();
  const id = ucId || parsed.id;
  const handle =
    parsed.handle ||
    (parsed.id.startsWith('@') ? parsed.id : '') ||
    '';

  const name =
    document.querySelector('meta[property="og:title"]')?.content ||
    document.querySelector('#channel-name yt-formatted-string')?.textContent ||
    document.querySelector('ytd-channel-name yt-formatted-string')?.textContent ||
    document.querySelector('#page-header h1')?.textContent ||
    handle ||
    'Channel';

  const avatarUrl =
    document.querySelector('meta[property="og:image"]')?.content ||
    document.querySelector('#avatar img')?.src ||
    document.querySelector('yt-page-header-renderer img')?.src ||
    '';

  return {
    id,
    name: name.trim(),
    handle,
    avatarUrl,
    href: ucId ? `https://www.youtube.com/channel/${ucId}` : canonical,
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

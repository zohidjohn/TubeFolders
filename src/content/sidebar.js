import { getLibrary, onLibraryChange } from '../lib/storage.js';
import { iconHtml } from '../lib/icons.js';
import { openManager } from './manager.js';

const SECTION_ID = 'tf-sidebar-section';

function findSubscriptionsAnchor() {
  const entries = [
    ...document.querySelectorAll(
      'ytd-guide-section-renderer, yt-guide-section-renderer'
    ),
  ];
  for (const section of entries) {
    const title = (
      section.querySelector('#guide-section-title, h3, #header, yt-formatted-string')
        ?.textContent || ''
    )
      .trim()
      .toLowerCase();
    if (title.includes('subscription')) return section;
  }

  // Prefer placing near subscription entries rather than the very top of the guide
  const subEntry = [...document.querySelectorAll('a#endpoint, a.yt-simple-endpoint')].find(
    (a) => (a.getAttribute('href') || '').includes('/feed/subscriptions')
  );
  if (subEntry) {
    return (
      subEntry.closest('ytd-guide-section-renderer, yt-guide-section-renderer') ||
      subEntry.closest('#sections') ||
      subEntry
    );
  }

  return document.querySelector('#guide-inner-content, ytd-guide-renderer');
}

function channelHref(channel) {
  if (channel.href) return channel.href;
  const id = channel.id || '';
  if (id.startsWith('UC')) return `https://www.youtube.com/channel/${id}`;
  if (id.startsWith('@')) return `https://www.youtube.com/${id}`;
  if (id.startsWith('c/')) return `https://www.youtube.com/${id}`;
  if (id.startsWith('user/')) return `https://www.youtube.com/${id}`;
  return `https://www.youtube.com/${id}`;
}

function buildSection(library) {
  const section = document.createElement('div');
  section.id = SECTION_ID;
  section.className = 'tf-root';

  const folders = library.folders || [];
  const channels = library.channels || {};

  section.innerHTML = `
    <button type="button" class="tf-sidebar-header tf-sidebar-open" title="Manage TubeFolders">
      <h2 class="tf-sidebar-title"><span class="tf-mark"></span> TubeFolders</h2>
      <span class="tf-sidebar-edit">${iconHtml('Pencil', 'tf-icon')}</span>
    </button>
    ${
      folders.length === 0
        ? `<button type="button" class="tf-sidebar-empty tf-sidebar-open">Click to create and manage folders</button>`
        : folders
            .map((folder) => {
              const items = (folder.channelIds || [])
                .map((id) => channels[id])
                .filter(Boolean);
              return `
            <div class="tf-folder" data-folder-id="${folder.id}" data-open="false">
              <button type="button" class="tf-folder-toggle" aria-expanded="false">
                ${iconHtml(folder.icon || 'Folder', 'tf-icon')}
                <span>${escapeHtml(folder.name)}</span>
                <span class="tf-chevron">${iconHtml('ChevronRight', 'tf-icon')}</span>
              </button>
              <div class="tf-folder-channels">
                ${
                  items.length
                    ? items
                        .map(
                          (ch) => `
                  <a class="tf-channel-link" href="${escapeAttr(channelHref(ch))}">
                    ${
                      ch.avatarUrl
                        ? `<img src="${escapeAttr(ch.avatarUrl)}" alt="" width="24" height="24" />`
                        : `<span class="tf-icon">${iconHtml('Folder', 'tf-icon')}</span>`
                    }
                    <span>${escapeHtml(ch.name || ch.handle || ch.id)}</span>
                  </a>`
                        )
                        .join('')
                    : `<button type="button" class="tf-sidebar-empty tf-sidebar-open">No channels — manage folders</button>`
                }
              </div>
            </div>`;
            })
            .join('')
    }
  `;

  section.addEventListener('click', (e) => {
    if (e.target.closest('.tf-sidebar-open')) {
      e.preventDefault();
      openManager();
      return;
    }
    const toggle = e.target.closest('.tf-folder-toggle');
    if (!toggle) return;
    const folder = toggle.closest('.tf-folder');
    const open = folder.getAttribute('data-open') === 'true';
    folder.setAttribute('data-open', open ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    const chevron = toggle.querySelector('.tf-chevron');
    if (chevron) {
      chevron.innerHTML = iconHtml(open ? 'ChevronRight' : 'ChevronDown', 'tf-icon');
    }
  });

  return section;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

export async function renderSidebar() {
  const existing = document.getElementById(SECTION_ID);
  const openFolders = new Set(
    [...(existing?.querySelectorAll('.tf-folder[data-open="true"]') || [])].map(
      (el) => el.dataset.folderId
    )
  );
  const library = await getLibrary();
  const next = buildSection(library);
  for (const id of openFolders) {
    const folder = next.querySelector(`.tf-folder[data-folder-id="${id}"]`);
    if (folder) {
      folder.setAttribute('data-open', 'true');
      const toggle = folder.querySelector('.tf-folder-toggle');
      const chevron = folder.querySelector('.tf-chevron');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      if (chevron) chevron.innerHTML = iconHtml('ChevronDown', 'tf-icon');
    }
  }

  if (existing) {
    existing.replaceWith(next);
    return;
  }

  const anchor = findSubscriptionsAnchor();
  if (!anchor) return;

  if (anchor.matches?.('ytd-guide-section-renderer, yt-guide-section-renderer')) {
    anchor.parentElement?.insertBefore(next, anchor);
  } else if (anchor.parentElement) {
    anchor.parentElement.insertBefore(next, anchor);
  } else {
    anchor.prepend?.(next);
  }
}

export function startSidebar() {
  renderSidebar();
  onLibraryChange(() => renderSidebar());
}

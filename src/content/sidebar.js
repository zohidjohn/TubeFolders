import { getLibrary, onLibraryChange } from '../lib/storage.js';
import { iconHtml } from '../lib/icons.js';

const SECTION_ID = 'tf-sidebar-section';

function findSubscriptionsAnchor() {
  const entries = [
    ...document.querySelectorAll(
      'ytd-guide-section-renderer, yt-guide-section-renderer'
    ),
  ];
  for (const section of entries) {
    const title = (
      section.querySelector('#guide-section-title, h3, #header')?.textContent ||
      ''
    )
      .trim()
      .toLowerCase();
    if (title.includes('subscription')) return section;
  }

  // Fallback: first guide entry that looks like a channel avatar row
  const guide = document.querySelector('#guide-inner-content, ytd-guide-renderer');
  return guide || null;
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
    <div class="tf-sidebar-header">
      <h2 class="tf-sidebar-title"><span class="tf-mark"></span> TubeFolders</h2>
    </div>
    ${
      folders.length === 0
        ? `<div class="tf-sidebar-empty">Create folders in the TubeFolders extension popup.</div>`
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
                    : `<div class="tf-sidebar-empty">No channels in this folder</div>`
                }
              </div>
            </div>`;
            })
            .join('')
    }
  `;

  section.addEventListener('click', (e) => {
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
  const library = await getLibrary();
  const next = buildSection(library);

  if (existing) {
    existing.replaceWith(next);
    return;
  }

  const anchor = findSubscriptionsAnchor();
  if (!anchor) return;

  if (anchor.matches?.('ytd-guide-section-renderer, yt-guide-section-renderer')) {
    anchor.parentElement?.insertBefore(next, anchor);
  } else {
    anchor.prepend(next);
  }
}

export function startSidebar() {
  renderSidebar();
  onLibraryChange(() => renderSidebar());
}

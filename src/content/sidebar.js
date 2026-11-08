import { getLibrary, onLibraryChange } from '../lib/storage.js';
import { iconHtml } from '../lib/icons.js';
import { collectNewChannelIds } from '../lib/newness.js';
import { openManager } from './manager.js';

const SECTION_ID = 'tf-sidebar-section';

function guideSections() {
  return [
    ...document.querySelectorAll(
      '#sections > ytd-guide-section-renderer, ytd-guide-renderer #sections > ytd-guide-section-renderer'
    ),
  ];
}

function sectionEntries(section) {
  return [...section.querySelectorAll(':scope ytd-guide-entry-renderer')].map((entry) => {
    const title = (
      entry.querySelector('#guide-entry-title, yt-formatted-string')?.textContent || ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const href =
      entry.querySelector('a#endpoint, a.yt-simple-endpoint')?.getAttribute('href') || '';
    return { title, href, entry };
  });
}

/**
 * Signed-in YouTube guide (verified):
 *  [0] Home, Shorts
 *  [1] Subscriptions + channels   ← insert TubeFolders BEFORE this
 *  [2] You + items
 */
function findSubscriptionsSection() {
  for (const section of guideSections()) {
    const entries = sectionEntries(section);
    if (!entries.length) continue;
    const first = entries[0];
    if (
      first.href.includes('/feed/subscriptions') ||
      /^subscriptions$/i.test(first.title)
    ) {
      return section;
    }
    // Some layouts put "Subscriptions" header as section title entry among items
    if (entries.some((e) => e.href.includes('/feed/subscriptions'))) {
      return section;
    }
  }
  return null;
}

function isCorrectPlacement(node) {
  const next = node?.nextElementSibling;
  if (!next || next.tagName !== 'YTD-GUIDE-SECTION-RENDERER') return false;
  const entries = sectionEntries(next);
  return entries.some(
    (e) => e.href.includes('/feed/subscriptions') || /^subscriptions$/i.test(e.title)
  );
}

function placeSection(node) {
  const subscriptions = findSubscriptionsSection();
  if (subscriptions?.parentElement) {
    subscriptions.parentElement.insertBefore(node, subscriptions);
    return true;
  }

  // Fallback: after first section (Home/Shorts)
  const sections = guideSections();
  if (sections[0]) {
    sections[0].insertAdjacentElement('afterend', node);
    return true;
  }
  return false;
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

function chevronHtml(open = false) {
  return iconHtml(open ? 'ChevronDown' : 'ChevronRight', 'tf-icon tf-yt-chevron');
}

function buildSection(library, newIds) {
  const section = document.createElement('div');
  section.id = SECTION_ID;
  section.className = 'tf-root tf-guide-section';

  const folders = library.folders || [];
  const channels = library.channels || {};

  section.innerHTML = `
    <button type="button" class="tf-guide-header tf-sidebar-open" title="Manage TubeFolders">
      <span class="tf-guide-title">TubeFolders</span>
      <span class="tf-guide-chevron">${chevronHtml(false)}</span>
    </button>
    <div class="tf-guide-items">
      ${
        folders.length === 0
          ? `<button type="button" class="tf-guide-empty tf-sidebar-open">Create folders</button>`
          : folders
              .map((folder) => {
                const items = (folder.channelIds || [])
                  .map((id) => channels[id])
                  .filter(Boolean);
                const color = folder.color || '#e11d2e';
                return `
            <div class="tf-folder" data-folder-id="${folder.id}" data-open="false" style="--tf-folder-color:${escapeAttr(color)}">
              <button type="button" class="tf-folder-toggle" aria-expanded="false">
                <span class="tf-folder-icon" style="color:${escapeAttr(color)}">${iconHtml(
                  folder.icon || 'Folder',
                  'tf-icon'
                )}</span>
                <span class="tf-folder-name">${escapeHtml(folder.name)}</span>
                <span class="tf-chevron">${chevronHtml(false)}</span>
              </button>
              <div class="tf-folder-channels">
                ${
                  items.length
                    ? items
                        .map((ch) => {
                          const isNew =
                            newIds.has(ch.id) ||
                            (ch.handle && newIds.has(ch.handle));
                          return `
                  <a class="tf-channel-link${isNew ? ' tf-channel-new' : ''}" href="${escapeAttr(
                    channelHref(ch)
                  )}">
                    ${
                      ch.avatarUrl
                        ? `<img src="${escapeAttr(ch.avatarUrl)}" alt="" width="24" height="24" />`
                        : `<span class="tf-avatar-fallback"></span>`
                    }
                    <span>${escapeHtml(ch.name || ch.handle || ch.id)}</span>
                  </a>`;
                        })
                        .join('')
                    : `<button type="button" class="tf-guide-empty tf-sidebar-open">No channels yet</button>`
                }
              </div>
            </div>`;
              })
              .join('')
      }
    </div>
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
    const nextOpen = !open;
    folder.setAttribute('data-open', nextOpen ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    const chevron = toggle.querySelector('.tf-chevron');
    if (chevron) chevron.innerHTML = chevronHtml(nextOpen);
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
  const newIds = collectNewChannelIds();
  const next = buildSection(library, newIds);

  for (const id of openFolders) {
    const folder = next.querySelector(`.tf-folder[data-folder-id="${id}"]`);
    if (folder) {
      folder.setAttribute('data-open', 'true');
      const toggle = folder.querySelector('.tf-folder-toggle');
      const chevron = folder.querySelector('.tf-chevron');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      if (chevron) chevron.innerHTML = chevronHtml(true);
    }
  }

  existing?.remove();
  if (!placeSection(next)) return;
  if (!isCorrectPlacement(next)) {
    next.remove();
    placeSection(next);
  }
}

export function startSidebar() {
  renderSidebar();
  onLibraryChange(() => renderSidebar());
}

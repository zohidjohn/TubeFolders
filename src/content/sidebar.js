import { getLibrary, onLibraryChange } from '../lib/storage.js';
import { iconHtml } from '../lib/icons.js';
import { collectNewChannelIds, countNewInFolder } from '../lib/newness.js';
import { openManager } from './manager.js';

const SECTION_ID = 'tf-sidebar-section';

function sectionTitleText(section) {
  return (
    section.querySelector('#guide-section-title, h3, #header, yt-formatted-string')
      ?.textContent || ''
  )
    .trim()
    .toLowerCase();
}

function findGuideSections() {
  return [
    ...document.querySelectorAll(
      'ytd-guide-section-renderer, yt-guide-section-renderer'
    ),
  ];
}

/** Insert TubeFolders between Subscriptions and You. */
function placeSection(node) {
  const sections = findGuideSections();
  let subscriptions = null;
  let you = null;

  for (const section of sections) {
    const title = sectionTitleText(section);
    if (!subscriptions && title.includes('subscription')) subscriptions = section;
    // Exact-ish "You" heading (not "Your videos" alone as section in some layouts)
    if (!you && (title === 'you' || title.startsWith('you'))) you = section;
  }

  if (subscriptions?.parentElement) {
    // After Subscriptions, before whatever follows (usually You)
    subscriptions.insertAdjacentElement('afterend', node);
    return true;
  }

  if (you?.parentElement) {
    you.parentElement.insertBefore(node, you);
    return true;
  }

  const guide = document.querySelector('#guide-inner-content, ytd-guide-renderer #sections');
  if (guide) {
    guide.appendChild(node);
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

function buildSection(library, newIds) {
  const section = document.createElement('div');
  section.id = SECTION_ID;
  section.className = 'tf-root tf-guide-section';

  const folders = library.folders || [];
  const channels = library.channels || {};

  section.innerHTML = `
    <button type="button" class="tf-guide-header tf-sidebar-open" title="Manage TubeFolders">
      <span class="tf-guide-title">TubeFolders</span>
      <span class="tf-guide-chevron" aria-hidden="true">&gt;</span>
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
                const newCount = countNewInFolder(folder, channels, newIds);
                return `
            <div class="tf-folder" data-folder-id="${folder.id}" data-open="false" style="--tf-folder-color:${escapeAttr(color)}">
              <button type="button" class="tf-folder-toggle" aria-expanded="false">
                <span class="tf-folder-icon" style="color:${escapeAttr(color)}">${iconHtml(
                  folder.icon || 'Folder',
                  'tf-icon'
                )}</span>
                <span class="tf-folder-name">${escapeHtml(folder.name)}</span>
                ${
                  newCount > 0
                    ? `<span class="tf-folder-new" title="Channels with new videos" style="background:${escapeAttr(
                        color
                      )};color:${contrastText(color)}">${newCount}</span>`
                    : ''
                }
                <span class="tf-chevron" aria-hidden="true">&gt;</span>
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
    folder.setAttribute('data-open', open ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    const chevron = toggle.querySelector('.tf-chevron');
    if (chevron) chevron.textContent = open ? '>' : '∨';
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

function contrastText(hex) {
  const raw = String(hex || '#e11d2e').replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16) || 0;
  const g = Number.parseInt(full.slice(2, 4), 16) || 0;
  const b = Number.parseInt(full.slice(4, 6), 16) || 0;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#0a0a0a' : '#ffffff';
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
      if (chevron) chevron.textContent = '∨';
    }
  }

  if (existing) {
    existing.replaceWith(next);
    // replaceWith keeps position in DOM — good when already placed correctly
    // If it was in the wrong place (old top), re-place
    const parent = next.parentElement;
    const afterSubs =
      next.previousElementSibling &&
      sectionTitleText(next.previousElementSibling).includes('subscription');
    if (!afterSubs) {
      next.remove();
      placeSection(next);
    }
    return;
  }

  placeSection(next);
}

export function startSidebar() {
  renderSidebar();
  onLibraryChange(() => renderSidebar());
}

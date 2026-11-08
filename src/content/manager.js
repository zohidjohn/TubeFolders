import {
  getLibrary,
  createFolder,
  updateFolder,
  deleteFolder,
  moveChannelToFolder,
  onLibraryChange,
  getAuthMeta,
} from '../lib/storage.js';
import {
  iconHtml,
  renderIconPickerHtml,
  renderColorPickerHtml,
  searchIcons,
  FOLDER_COLORS,
} from '../lib/icons.js';
import { safeSendMessage } from '../lib/extension.js';

export const TF_PATH = '/feed/tubefolders';
const PAGE_ID = 'tf-manager-page';

let selectedIcon = 'Folder';
let selectedColor = '#e11d2e';
let iconQuery = '';
let draftName = '';
let unbound = null;
let navBound = false;
let openMenuId = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function send(type, payload = {}) {
  return safeSendMessage({ type, ...payload });
}

function channelLabel(ch) {
  return ch?.name || ch?.handle || ch?.id || 'Channel';
}

function isTubeFoldersRoute() {
  return location.pathname === TF_PATH || location.hash === '#tubefolders';
}

function findPrimaryHost() {
  return (
    document.querySelector('ytd-page-manager#page-manager') ||
    document.querySelector('#page-manager') ||
    document.querySelector('#content') ||
    document.body
  );
}

function hideYouTubeBrowse(hide) {
  const browse = document.querySelectorAll(
    'ytd-page-manager > ytd-browse, ytd-page-manager > ytd-watch-flexy, ytd-page-manager > ytd-search'
  );
  browse.forEach((el) => {
    if (hide) el.setAttribute('data-tf-hidden', '1');
    else el.removeAttribute('data-tf-hidden');
  });
  document.documentElement.classList.toggle('tf-manager-page-open', hide);
}

function closeMenus(page) {
  openMenuId = null;
  page?.querySelectorAll('.tf-folder-menu[open], .tf-folder-menu-panel').forEach((el) => {
    if (el.tagName === 'DETAILS') el.open = false;
    else el.hidden = true;
  });
  page?.querySelectorAll('[data-menu-panel]').forEach((el) => {
    el.hidden = true;
  });
}

function refreshIconGrid(page) {
  const grid = page.querySelector('[data-role="icon-grid"]');
  const label = page.querySelector('[data-role="icon-label"]');
  if (!grid) return;
  const names = searchIcons(iconQuery);
  grid.innerHTML = names
    .map((name) => {
      const selected = name === selectedIcon;
      return `
    <button type="button" class="tf-mgr-icon" data-icon="${name}" role="option" aria-selected="${selected}" title="${name}" style="${
      selected ? `color:${escapeHtml(selectedColor)};border-color:${escapeHtml(selectedColor)}` : ''
    }">
      ${iconHtml(name, 'tf-icon')}
    </button>`;
    })
    .join('');
  if (label) label.textContent = selectedIcon;
  updateCreateState(page);
}

function updateCreateState(page) {
  const name = draftName.trim();
  page.querySelectorAll('[data-action="create"]').forEach((btn) => {
    btn.disabled = !name;
  });

  page.querySelectorAll('.tf-create-card .tf-mgr-icon[aria-selected="true"]').forEach((btn) => {
    btn.style.color = selectedColor;
    btn.style.borderColor = selectedColor;
  });
  page.querySelectorAll('.tf-create-card [data-color]').forEach((btn) => {
    btn.setAttribute(
      'aria-selected',
      btn.dataset.color?.toLowerCase() === selectedColor.toLowerCase() ? 'true' : 'false'
    );
  });
  const custom = page.querySelector('.tf-create-card [data-role="color-custom"]');
  if (custom) {
    const isPreset = FOLDER_COLORS.some(
      (c) => c.toLowerCase() === selectedColor.toLowerCase()
    );
    custom.value = selectedColor;
    custom.setAttribute('aria-selected', isPreset ? 'false' : 'true');
    custom.closest('.tf-color-custom-wrap')?.classList.toggle('is-selected', !isPreset);
  }
}

function renderAuthChip(auth) {
  if (auth) {
    return `
      <div class="tf-manager-user">
        ${
          auth.photoURL
            ? `<img src="${escapeHtml(auth.photoURL)}" alt="" width="24" height="24" />`
            : `<span class="tf-manager-user-fallback">${iconHtml('User', 'tf-icon')}</span>`
        }
        <span class="tf-manager-user-name" title="${escapeHtml(auth.email || '')}">${escapeHtml(
          auth.displayName || 'Signed in'
        )}</span>
        <button type="button" class="tf-mgr-btn ghost tf-mgr-btn-sm" data-action="signout">Sign out</button>
      </div>`;
  }
  return `
    <div class="tf-manager-user">
      <span class="tf-manager-user-name">Not signed in</span>
      <button type="button" class="tf-mgr-btn tf-mgr-btn-sm" data-action="signin">Sign in</button>
    </div>`;
}

function renderChannelChip(ch, folderId) {
  const label = channelLabel(ch);
  const avatar = ch.avatarUrl
    ? `<img class="tf-channel-avatar" src="${escapeHtml(ch.avatarUrl)}" alt="" width="20" height="20" loading="lazy" />`
    : `<span class="tf-channel-avatar tf-channel-avatar-fallback">${escapeHtml(
        (label[0] || '?').toUpperCase()
      )}</span>`;
  return `
    <li class="tf-channel-chip"
        draggable="true"
        data-channel-id="${escapeHtml(ch.id)}"
        data-from-folder="${escapeHtml(folderId)}"
        tabindex="0">
      ${avatar}
      <span class="tf-channel-chip-name">${escapeHtml(label)}</span>
    </li>`;
}

function renderFolderCard(folder, channels) {
  const items = (folder.channelIds || []).map((id) => channels[id]).filter(Boolean);
  const color = folder.color || '#e11d2e';
  const menuOpen = openMenuId === folder.id;
  return `
    <article class="tf-manager-folder" data-id="${folder.id}" data-drop-folder="${folder.id}">
      <header class="tf-folder-card-header">
        <span class="tf-folder-icon" style="color:${escapeHtml(color)}">${iconHtml(
          folder.icon || 'Folder',
          'tf-icon tf-icon-lg'
        )}</span>
        <div class="tf-folder-card-meta">
          <strong class="tf-folder-card-name">${escapeHtml(folder.name)}</strong>
          <span class="tf-mgr-count">${items.length} channel${items.length === 1 ? '' : 's'}</span>
        </div>
        <div class="tf-folder-menu">
          <button type="button" class="tf-mgr-btn ghost tf-mgr-icon-btn" data-action="toggle-menu" data-id="${
            folder.id
          }" aria-haspopup="menu" aria-expanded="${menuOpen}" aria-label="Folder actions">
            ${iconHtml('Ellipsis', 'tf-icon')}
          </button>
          <div class="tf-folder-menu-panel" data-menu-panel="${folder.id}" role="menu" ${
            menuOpen ? '' : 'hidden'
          }>
            <button type="button" role="menuitem" data-action="menu-color" data-id="${folder.id}">Color</button>
            <button type="button" role="menuitem" data-action="menu-icon" data-id="${folder.id}">Icon</button>
            <button type="button" role="menuitem" data-action="rename" data-id="${folder.id}">Rename</button>
            <button type="button" role="menuitem" class="danger" data-action="delete" data-id="${
              folder.id
            }">Delete</button>
          </div>
        </div>
      </header>
      <ul class="tf-channel-list" data-drop-folder="${folder.id}">
        ${
          items.length
            ? items.map((ch) => renderChannelChip(ch, folder.id)).join('')
            : `<li class="tf-folder-empty-channels">No channels yet — drag one here or use Add to folder</li>`
        }
      </ul>
      <div class="tf-folder-subpanel" data-subpanel="${folder.id}" hidden></div>
    </article>`;
}

async function renderBody(page) {
  const library = await getLibrary();
  const auth = await getAuthMeta();
  const folders = library.folders || [];
  const channels = library.channels || {};
  const body = page.querySelector('.tf-manager-body');
  const headerRight = page.querySelector('[data-role="header-right"]');
  if (!body) return;

  if (headerRight) {
    headerRight.innerHTML = renderAuthChip(auth);
  }

  const createDisabled = !draftName.trim();

  body.innerHTML = `
    <div class="tf-manager-status" data-role="status" role="status" aria-live="polite"></div>

    <div class="tf-manager-grid">
      <section class="tf-manager-create" aria-label="Create folder">
        <div class="tf-create-card">
          <h2 class="tf-create-title">New folder</h2>

          <div class="tf-name-row">
            <input
              class="tf-mgr-input"
              data-role="folder-name"
              type="text"
              maxlength="48"
              placeholder="Folder name"
              value="${escapeHtml(draftName)}"
              aria-label="Folder name"
            />
            <button
              type="button"
              class="tf-mgr-btn tf-create-plus"
              data-action="create"
              aria-label="Create folder"
              title="Create folder"
              ${createDisabled ? 'disabled' : ''}
            >${iconHtml('Plus', 'tf-icon')}</button>
          </div>

          <div class="tf-field">
            <span class="tf-field-label">Color</span>
            ${renderColorPickerHtml(selectedColor)}
          </div>

          <div class="tf-field">
            ${renderIconPickerHtml({
              selectedIcon,
              query: iconQuery,
              selectedColor,
            })}
          </div>
        </div>
      </section>

      <section class="tf-manager-folders" aria-label="Your folders">
        <div class="tf-folders-heading">
          <h2>Your folders</h2>
          <span class="tf-folders-count">${folders.length}</span>
        </div>
        ${
          folders.length === 0
            ? `<div class="tf-folders-empty">
                <div class="tf-folders-empty-icon">${iconHtml('FolderPlus', 'tf-icon')}</div>
                <p>No folders yet — create your first one</p>
              </div>`
            : `<div class="tf-folders-list">${folders
                .map((folder) => renderFolderCard(folder, channels))
                .join('')}</div>`
        }
      </section>
    </div>
  `;

  const search = body.querySelector('[data-role="icon-search"]');
  if (search) {
    search.addEventListener('input', () => {
      iconQuery = search.value;
      refreshIconGrid(page);
    });
  }

  const nameInput = body.querySelector('[data-role="folder-name"]');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      draftName = nameInput.value;
      updateCreateState(page);
    });
  }

  bindDragAndDrop(page);
}

function setStatus(page, message, isError = false) {
  const el = page.querySelector('[data-role="status"]');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('error', Boolean(isError));
  el.classList.toggle('is-visible', Boolean(message));
}

function bindDragAndDrop(page) {
  let dragChannelId = null;
  let dragFromFolder = null;

  page.querySelectorAll('.tf-channel-chip[draggable="true"]').forEach((chip) => {
    chip.addEventListener('dragstart', (e) => {
      dragChannelId = chip.dataset.channelId;
      dragFromFolder = chip.dataset.fromFolder;
      chip.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragChannelId);
      e.dataTransfer.setData(
        'application/x-tf-channel',
        JSON.stringify({ channelId: dragChannelId, fromFolderId: dragFromFolder })
      );
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('is-dragging');
      page.querySelectorAll('.is-drop-target').forEach((el) => el.classList.remove('is-drop-target'));
      dragChannelId = null;
      dragFromFolder = null;
    });
  });

  page.querySelectorAll('[data-drop-folder]').forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const card = zone.closest('.tf-manager-folder') || zone;
      card.classList.add('is-drop-target');
    });
    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) {
        const card = zone.closest('.tf-manager-folder') || zone;
        card.classList.remove('is-drop-target');
      }
    });
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const card = zone.closest('.tf-manager-folder') || zone;
      card.classList.remove('is-drop-target');
      const toFolderId = zone.dataset.dropFolder || card.dataset.id;
      let payload = { channelId: dragChannelId, fromFolderId: dragFromFolder };
      try {
        const raw = e.dataTransfer.getData('application/x-tf-channel');
        if (raw) payload = JSON.parse(raw);
      } catch {
        /* use drag state */
      }
      if (!payload.channelId || !toFolderId || payload.fromFolderId === toFolderId) return;
      try {
        await moveChannelToFolder(payload.channelId, payload.fromFolderId, toFolderId);
        await send('tf-sync');
        setStatus(page, 'Channel moved');
        await renderBody(page);
      } catch (err) {
        setStatus(page, err.message || 'Move failed', true);
      }
    });
  });
}

async function showFolderColorPanel(page, folderId) {
  const host = page.querySelector(`[data-subpanel="${folderId}"]`);
  if (!host) return;
  const lib = await getLibrary();
  const folder = lib.folders.find((f) => f.id === folderId);
  if (!folder) return;
  host.hidden = false;
  host.innerHTML = `
    <div class="tf-subpanel-inner">
      <span class="tf-field-label">Pick a color</span>
      ${renderColorPickerHtml(folder.color || '#e11d2e', {
        customAttr: `data-role="folder-color-custom" data-folder-id="${folderId}"`,
      }).replace(
        /data-color="/g,
        `data-folder-color="${folderId}" data-color="`
      )}
      <button type="button" class="tf-mgr-btn ghost tf-mgr-btn-sm" data-action="close-subpanel" data-id="${folderId}">Done</button>
    </div>
  `;
}

async function showFolderIconPanel(page, folderId) {
  const host = page.querySelector(`[data-subpanel="${folderId}"]`);
  if (!host) return;
  const lib = await getLibrary();
  const folder = lib.folders.find((f) => f.id === folderId);
  if (!folder) return;
  let q = '';
  const color = folder.color || '#e11d2e';
  const renderGrid = () => {
    const names = searchIcons(q, 48);
    return names
      .map((name) => {
        const selected = name === (folder.icon || 'Folder');
        return `<button type="button" class="tf-mgr-icon" data-folder-icon="${folderId}" data-icon="${name}" aria-selected="${selected}" title="${name}" style="${
          selected ? `color:${color};border-color:${color}` : ''
        }">${iconHtml(name, 'tf-icon')}</button>`;
      })
      .join('');
  };
  host.hidden = false;
  host.innerHTML = `
    <div class="tf-subpanel-inner">
      <span class="tf-field-label">Pick an icon</span>
      <input class="tf-mgr-input tf-icon-search" data-role="folder-icon-search" data-folder-id="${folderId}" type="search" placeholder="Search icons…" />
      <div class="tf-mgr-icons tf-mgr-icons-compact" data-role="folder-icon-grid">${renderGrid()}</div>
      <button type="button" class="tf-mgr-btn ghost tf-mgr-btn-sm" data-action="close-subpanel" data-id="${folderId}">Done</button>
    </div>
  `;
  const search = host.querySelector('[data-role="folder-icon-search"]');
  const grid = host.querySelector('[data-role="folder-icon-grid"]');
  search?.addEventListener('input', () => {
    q = search.value;
    if (grid) grid.innerHTML = renderGrid();
  });
}

async function handleAction(page, action, target) {
  try {
    if (action === 'close') {
      closeManager({ navigateHome: true });
      return;
    }
    if (action === 'signin') {
      setStatus(page, 'Opening Google sign-in…');
      const res = await send('tf-signin');
      if (!res.ok) throw new Error(res.error || 'Sign-in failed');
      setStatus(page, `Signed in as ${res.user?.displayName || res.user?.email || 'user'}`);
      await renderBody(page);
      return;
    }
    if (action === 'signout') {
      await send('tf-signout');
      setStatus(page, 'Signed out');
      await renderBody(page);
      return;
    }
    if (action === 'create') {
      const name = draftName.trim();
      if (!name) return;
      await createFolder({ name, icon: selectedIcon, color: selectedColor });
      draftName = '';
      iconQuery = '';
      await send('tf-sync');
      setStatus(page, 'Folder created');
      await renderBody(page);
      return;
    }
    if (action === 'toggle-menu') {
      const id = target.dataset.id;
      const panel = page.querySelector(`[data-menu-panel="${id}"]`);
      const wasOpen = openMenuId === id;
      closeMenus(page);
      if (!wasOpen && panel) {
        openMenuId = id;
        panel.hidden = false;
        target.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    if (action === 'menu-color') {
      const id = target.dataset.id;
      closeMenus(page);
      await showFolderColorPanel(page, id);
      return;
    }
    if (action === 'menu-icon') {
      const id = target.dataset.id;
      closeMenus(page);
      await showFolderIconPanel(page, id);
      return;
    }
    if (action === 'close-subpanel') {
      const host = page.querySelector(`[data-subpanel="${target.dataset.id}"]`);
      if (host) {
        host.hidden = true;
        host.innerHTML = '';
      }
      return;
    }
    if (action === 'rename') {
      closeMenus(page);
      const id = target.dataset.id;
      const next = prompt('Folder name');
      if (!next || !next.trim()) return;
      await updateFolder(id, { name: next.trim() });
      await send('tf-sync');
      setStatus(page, 'Folder renamed');
      await renderBody(page);
      return;
    }
    if (action === 'delete') {
      closeMenus(page);
      const id = target.dataset.id;
      if (!confirm('Delete this folder? Channels stay on YouTube — only the folder is removed.')) {
        return;
      }
      await deleteFolder(id);
      await send('tf-sync');
      setStatus(page, 'Folder deleted');
      await renderBody(page);
    }
  } catch (err) {
    setStatus(page, err.message || 'Something went wrong', true);
  }
}

function ensurePageShell() {
  let page = document.getElementById(PAGE_ID);
  if (page) return page;

  page = document.createElement('div');
  page.id = PAGE_ID;
  page.className = 'tf-root tf-manager-page';
  page.innerHTML = `
    <div class="tf-manager-page-inner" role="main" aria-label="TubeFolders">
      <header class="tf-manager-header">
        <div class="tf-manager-header-left">
          <div class="tf-manager-brand">
            ${iconHtml('Folder', 'tf-icon tf-page-icon')}
            <h1>TubeFolders</h1>
          </div>
          <button type="button" class="tf-mgr-btn ghost" data-action="close" data-role="header-back">Back to Subscriptions</button>
        </div>
        <div class="tf-manager-header-right" data-role="header-right"></div>
      </header>
      <div class="tf-manager-body"></div>
    </div>
  `;

  page.addEventListener('click', async (e) => {
    const folderColorBtn = e.target.closest('[data-folder-color]');
    if (folderColorBtn && page.contains(folderColorBtn)) {
      const folderId = folderColorBtn.dataset.folderColor;
      const color = folderColorBtn.dataset.color;
      await updateFolder(folderId, { color });
      await send('tf-sync');
      setStatus(page, 'Color updated');
      await renderBody(page);
      return;
    }

    const folderIconBtn = e.target.closest('[data-folder-icon]');
    if (folderIconBtn && page.contains(folderIconBtn)) {
      const folderId = folderIconBtn.dataset.folderIcon;
      const icon = folderIconBtn.dataset.icon;
      await updateFolder(folderId, { icon });
      await send('tf-sync');
      setStatus(page, `Icon set to ${icon}`);
      await renderBody(page);
      return;
    }

    const colorBtn = e.target.closest('[data-color]:not([data-folder-color])');
    if (colorBtn && page.contains(colorBtn) && !colorBtn.dataset.folderColor) {
      // create-form color only
      if (!colorBtn.closest('[data-subpanel]')) {
        selectedColor = colorBtn.dataset.color;
        updateCreateState(page);
        refreshIconGrid(page);
        return;
      }
    }

    const iconBtn = e.target.closest('[data-icon]:not([data-folder-icon])');
    if (iconBtn && page.contains(iconBtn) && !iconBtn.dataset.folderIcon) {
      if (!iconBtn.closest('[data-subpanel]')) {
        selectedIcon = iconBtn.dataset.icon;
        refreshIconGrid(page);
        return;
      }
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn && page.contains(actionBtn)) {
      await handleAction(page, actionBtn.dataset.action, actionBtn);
      return;
    }

    // click outside menus
    if (!e.target.closest('.tf-folder-menu')) {
      closeMenus(page);
    }
  });

  page.addEventListener('input', (e) => {
    if (e.target.matches?.('[data-role="color-custom"]')) {
      selectedColor = e.target.value;
      updateCreateState(page);
      refreshIconGrid(page);
    }
    if (e.target.matches?.('[data-role="folder-color-custom"]')) {
      const folderId = e.target.dataset.folderId;
      const color = e.target.value;
      updateFolder(folderId, { color }).then(async () => {
        await send('tf-sync');
        setStatus(page, 'Color updated');
        await renderBody(page);
      });
    }
  });

  page.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenus(page);
  });

  findPrimaryHost().appendChild(page);
  return page;
}

export async function openManager() {
  if (!isTubeFoldersRoute()) {
    history.pushState({ tubefolders: true }, '', TF_PATH);
  }

  hideYouTubeBrowse(true);
  const page = ensurePageShell();
  page.hidden = false;
  await renderBody(page);

  if (!unbound) {
    unbound = onLibraryChange(() => {
      const el = document.getElementById(PAGE_ID);
      if (el && !el.hidden) renderBody(el);
    });
  }

  bindNavigation();
}

export function closeManager({ navigateHome = false } = {}) {
  const page = document.getElementById(PAGE_ID);
  if (page) page.hidden = true;
  hideYouTubeBrowse(false);
  if (navigateHome && isTubeFoldersRoute()) {
    location.assign('/feed/subscriptions');
  }
}

export function toggleManager() {
  const page = document.getElementById(PAGE_ID);
  if (page && !page.hidden && isTubeFoldersRoute()) closeManager({ navigateHome: true });
  else openManager();
}

export function syncManagerRoute() {
  if (isTubeFoldersRoute()) openManager();
  else closeManager({ navigateHome: false });
}

function bindNavigation() {
  if (navBound) return;
  navBound = true;
  window.addEventListener('popstate', () => syncManagerRoute());
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(syncManagerRoute, 50);
  });
}

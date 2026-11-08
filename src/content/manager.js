import {
  getLibrary,
  createFolder,
  updateFolder,
  deleteFolder,
  onLibraryChange,
  getAuthMeta,
} from '../lib/storage.js';
import {
  iconHtml,
  renderIconPickerHtml,
  renderColorPickerHtml,
  searchIcons,
} from '../lib/icons.js';
import { safeSendMessage } from '../lib/extension.js';

export const TF_PATH = '/feed/tubefolders';
const PAGE_ID = 'tf-manager-page';

let selectedIcon = 'Folder';
let selectedColor = '#e11d2e';
let iconQuery = '';
let unbound = null;
let navBound = false;

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

function refreshIconGrid(page) {
  const grid = page.querySelector('[data-role="icon-grid"]');
  const label = page.querySelector('.tf-icon-selected-label');
  if (!grid) return;
  const names = searchIcons(iconQuery);
  grid.innerHTML = names
    .map(
      (name) => `
    <button type="button" class="tf-mgr-icon" data-icon="${name}" aria-selected="${
      name === selectedIcon
    }" title="${name}">
      ${iconHtml(name, 'tf-icon')}
    </button>`
    )
    .join('');
  if (label) label.innerHTML = `Selected: <strong>${escapeHtml(selectedIcon)}</strong>`;
}

async function renderBody(page) {
  const library = await getLibrary();
  const auth = await getAuthMeta();
  const folders = library.folders || [];
  const channels = library.channels || {};
  const body = page.querySelector('.tf-manager-body');
  if (!body) return;

  body.innerHTML = `
    <section class="tf-manager-auth tf-manager-auth-compact">
      ${
        auth
          ? `<div class="tf-manager-user">
              ${auth.photoURL ? `<img src="${escapeHtml(auth.photoURL)}" alt="" width="20" height="20" />` : ''}
              <span class="tf-manager-user-name" title="${escapeHtml(auth.email || '')}">${escapeHtml(
                auth.displayName || 'Signed in'
              )}</span>
              <button type="button" class="tf-mgr-btn ghost" data-action="signout">Sign out</button>
            </div>`
          : `<div class="tf-manager-user">
              <span class="tf-manager-user-name">Not signed in</span>
              <button type="button" class="tf-mgr-btn" data-action="signin">Sign in with Google</button>
            </div>`
      }
      <div class="tf-manager-status" data-role="status"></div>
    </section>

    <div class="tf-manager-grid">
      <section class="tf-manager-create">
        <h3>New folder</h3>
        <input class="tf-mgr-input" data-role="folder-name" type="text" maxlength="48" placeholder="Folder name" />
        <h3>Color</h3>
        ${renderColorPickerHtml(selectedColor)}
        <h3>Icon</h3>
        ${renderIconPickerHtml({ selectedIcon, query: iconQuery })}
        <button type="button" class="tf-mgr-btn" data-action="create">Create folder</button>
      </section>

      <section class="tf-manager-folders">
        <h3>Your folders</h3>
        ${
          folders.length === 0
            ? `<p class="tf-manager-empty">No folders yet. Create one on the left.</p>`
            : folders
                .map((folder) => {
                  const items = (folder.channelIds || [])
                    .map((id) => channels[id])
                    .filter(Boolean);
                  const color = folder.color || '#e11d2e';
                  return `
              <article class="tf-manager-folder" data-id="${folder.id}">
                <header>
                  <span class="tf-folder-icon" style="color:${escapeHtml(color)}">${iconHtml(
                    folder.icon || 'Folder',
                    'tf-icon tf-icon-lg'
                  )}</span>
                  <strong>${escapeHtml(folder.name)}</strong>
                  <span class="tf-mgr-count">${items.length}</span>
                  <div class="tf-manager-folder-actions">
                    <button type="button" class="tf-mgr-btn ghost" data-action="recolor" data-id="${folder.id}">Color</button>
                    <button type="button" class="tf-mgr-btn ghost" data-action="reicon" data-id="${folder.id}">Icon</button>
                    <button type="button" class="tf-mgr-btn ghost" data-action="rename" data-id="${folder.id}">Rename</button>
                    <button type="button" class="tf-mgr-btn danger" data-action="delete" data-id="${folder.id}">Delete</button>
                  </div>
                </header>
                <ul>
                  ${
                    items.length
                      ? items
                          .map((ch) => `<li>${escapeHtml(channelLabel(ch))}</li>`)
                          .join('')
                      : `<li class="tf-manager-empty">No channels — use Add to folder on a channel page</li>`
                  }
                </ul>
              </article>`;
                })
                .join('')
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
}

function setStatus(page, message, isError = false) {
  const el = page.querySelector('[data-role="status"]');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('error', Boolean(isError));
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
      const input = page.querySelector('[data-role="folder-name"]');
      const name = input?.value?.trim() || '';
      await createFolder({ name, icon: selectedIcon, color: selectedColor });
      if (input) input.value = '';
      await send('tf-sync');
      setStatus(page, 'Folder created');
      await renderBody(page);
      return;
    }
    if (action === 'rename') {
      const id = target.dataset.id;
      const next = prompt('Folder name');
      if (!next || !next.trim()) return;
      await updateFolder(id, { name: next.trim() });
      await send('tf-sync');
      setStatus(page, 'Folder renamed');
      await renderBody(page);
      return;
    }
    if (action === 'recolor') {
      const id = target.dataset.id;
      const color = prompt('Folder color (hex)', selectedColor);
      if (!color || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim())) {
        setStatus(page, 'Use a hex color like #e11d2e', true);
        return;
      }
      await updateFolder(id, { color: color.trim() });
      await send('tf-sync');
      setStatus(page, 'Color updated');
      await renderBody(page);
      return;
    }
    if (action === 'reicon') {
      const id = target.dataset.id;
      await updateFolder(id, { icon: selectedIcon });
      await send('tf-sync');
      setStatus(page, `Icon set to ${selectedIcon}`);
      await renderBody(page);
      return;
    }
    if (action === 'delete') {
      const id = target.dataset.id;
      if (!confirm('Delete this folder?')) return;
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
        <div class="tf-manager-brand">
          ${iconHtml('Folder', 'tf-icon tf-page-icon')}
          <h1>TubeFolders</h1>
        </div>
        <button type="button" class="tf-mgr-btn ghost" data-action="close">Back to Subscriptions</button>
      </header>
      <div class="tf-manager-body"></div>
    </div>
  `;

  page.addEventListener('click', async (e) => {
    const colorBtn = e.target.closest('[data-color]');
    if (colorBtn && page.contains(colorBtn)) {
      selectedColor = colorBtn.dataset.color;
      page.querySelectorAll('[data-color]').forEach((btn) => {
        btn.setAttribute(
          'aria-selected',
          btn.dataset.color === selectedColor ? 'true' : 'false'
        );
      });
      const custom = page.querySelector('[data-role="color-custom"]');
      if (custom) custom.value = selectedColor;
      return;
    }

    const iconBtn = e.target.closest('[data-icon]');
    if (iconBtn && page.contains(iconBtn)) {
      selectedIcon = iconBtn.dataset.icon;
      refreshIconGrid(page);
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn || !page.contains(actionBtn)) return;
    await handleAction(page, actionBtn.dataset.action, actionBtn);
  });

  page.addEventListener('input', (e) => {
    if (e.target.matches?.('[data-role="color-custom"]')) {
      selectedColor = e.target.value;
      page.querySelectorAll('[data-color]').forEach((btn) => {
        btn.setAttribute('aria-selected', 'false');
      });
    }
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
    // Same destination as the Subscriptions sidebar entry
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

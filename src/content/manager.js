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

const OVERLAY_ID = 'tf-manager-overlay';
let selectedIcon = 'Folder';
let selectedColor = '#e11d2e';
let iconQuery = '';
let unbound = null;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function send(type, payload = {}) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, ...payload }, (res) => {
        void chrome.runtime.lastError;
        resolve(res || { ok: false });
      });
    } catch {
      resolve({ ok: false });
    }
  });
}

function channelLabel(ch) {
  return ch?.name || ch?.handle || ch?.id || 'Channel';
}

function refreshIconGrid(overlay) {
  const grid = overlay.querySelector('[data-role="icon-grid"]');
  const label = overlay.querySelector('.tf-icon-selected-label');
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

async function renderBody(overlay) {
  const library = await getLibrary();
  const auth = await getAuthMeta();
  const folders = library.folders || [];
  const channels = library.channels || {};
  const body = overlay.querySelector('.tf-manager-body');
  if (!body) return;

  body.innerHTML = `
    <section class="tf-manager-auth">
      ${
        auth
          ? `<div class="tf-manager-user">
              ${auth.photoURL ? `<img src="${escapeHtml(auth.photoURL)}" alt="" />` : ''}
              <div>
                <div class="tf-manager-user-name">${escapeHtml(auth.displayName || 'Signed in')}</div>
                <div class="tf-manager-user-email">${escapeHtml(auth.email || '')}</div>
              </div>
              <button type="button" class="tf-mgr-btn ghost" data-action="signout">Sign out</button>
            </div>`
          : `<div class="tf-manager-user">
              <div>
                <div class="tf-manager-user-name">Not signed in</div>
                <div class="tf-manager-user-email">Sign in to sync folders to the cloud</div>
              </div>
              <button type="button" class="tf-mgr-btn" data-action="signin">Sign in with Google</button>
            </div>`
      }
      <div class="tf-manager-status" data-role="status"></div>
    </section>

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
          ? `<p class="tf-manager-empty">No folders yet. Create one above.</p>`
          : folders
              .map((folder) => {
                const items = (folder.channelIds || [])
                  .map((id) => channels[id])
                  .filter(Boolean);
                const color = folder.color || '#e11d2e';
                return `
              <article class="tf-manager-folder" data-id="${folder.id}" style="border-color:${escapeHtml(color)}">
                <header>
                  <span class="tf-folder-icon" style="color:${escapeHtml(color)}">${iconHtml(
                    folder.icon || 'Folder',
                    'tf-icon tf-icon-lg'
                  )}</span>
                  <strong>${escapeHtml(folder.name)}</strong>
                  <span class="tf-mgr-count">${items.length}</span>
                  <button type="button" class="tf-mgr-btn ghost" data-action="recolor" data-id="${folder.id}" title="Change color">Color</button>
                  <button type="button" class="tf-mgr-btn ghost" data-action="reicon" data-id="${folder.id}" title="Change icon">Icon</button>
                  <button type="button" class="tf-mgr-btn ghost" data-action="rename" data-id="${folder.id}">Rename</button>
                  <button type="button" class="tf-mgr-btn danger" data-action="delete" data-id="${folder.id}">Delete</button>
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
  `;

  const search = body.querySelector('[data-role="icon-search"]');
  if (search) {
    search.addEventListener('input', () => {
      iconQuery = search.value;
      refreshIconGrid(overlay);
    });
  }
}

function setStatus(overlay, message, isError = false) {
  const el = overlay.querySelector('[data-role="status"]');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('error', Boolean(isError));
}

async function handleAction(overlay, action, target) {
  try {
    if (action === 'close') {
      closeManager();
      return;
    }
    if (action === 'signin') {
      setStatus(overlay, 'Opening Google sign-in…');
      const res = await send('tf-signin');
      if (!res.ok) throw new Error(res.error || 'Sign-in failed');
      setStatus(overlay, `Signed in as ${res.user?.displayName || res.user?.email || 'user'}`);
      await renderBody(overlay);
      return;
    }
    if (action === 'signout') {
      await send('tf-signout');
      setStatus(overlay, 'Signed out');
      await renderBody(overlay);
      return;
    }
    if (action === 'create') {
      const input = overlay.querySelector('[data-role="folder-name"]');
      const name = input?.value?.trim() || '';
      await createFolder({ name, icon: selectedIcon, color: selectedColor });
      if (input) input.value = '';
      await send('tf-sync');
      setStatus(overlay, 'Folder created');
      await renderBody(overlay);
      return;
    }
    if (action === 'rename') {
      const id = target.dataset.id;
      const next = prompt('Folder name');
      if (!next || !next.trim()) return;
      await updateFolder(id, { name: next.trim() });
      await send('tf-sync');
      setStatus(overlay, 'Folder renamed');
      await renderBody(overlay);
      return;
    }
    if (action === 'recolor') {
      const id = target.dataset.id;
      const color = prompt('Folder color (hex)', selectedColor);
      if (!color || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim())) {
        setStatus(overlay, 'Use a hex color like #e11d2e', true);
        return;
      }
      await updateFolder(id, { color: color.trim() });
      await send('tf-sync');
      setStatus(overlay, 'Color updated');
      await renderBody(overlay);
      return;
    }
    if (action === 'reicon') {
      const id = target.dataset.id;
      await updateFolder(id, { icon: selectedIcon });
      await send('tf-sync');
      setStatus(overlay, `Icon set to ${selectedIcon}`);
      await renderBody(overlay);
      return;
    }
    if (action === 'delete') {
      const id = target.dataset.id;
      if (!confirm('Delete this folder?')) return;
      await deleteFolder(id);
      await send('tf-sync');
      setStatus(overlay, 'Folder deleted');
      await renderBody(overlay);
    }
  } catch (err) {
    setStatus(overlay, err.message || 'Something went wrong', true);
  }
}

export async function openManager() {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'tf-root';
    overlay.innerHTML = `
      <div class="tf-manager-backdrop" data-action="close"></div>
      <div class="tf-manager-panel" role="dialog" aria-label="TubeFolders manager">
        <header class="tf-manager-header">
          <div class="tf-manager-brand">
            <span class="tf-mark"></span>
            <h2>TubeFolders</h2>
          </div>
          <button type="button" class="tf-mgr-btn ghost" data-action="close" aria-label="Close">
            ${iconHtml('X', 'tf-icon')}
          </button>
        </header>
        <div class="tf-manager-body"></div>
      </div>
    `;
    overlay.addEventListener('click', async (e) => {
      const colorBtn = e.target.closest('[data-color]');
      if (colorBtn && overlay.contains(colorBtn)) {
        selectedColor = colorBtn.dataset.color;
        overlay.querySelectorAll('[data-color]').forEach((btn) => {
          btn.setAttribute(
            'aria-selected',
            btn.dataset.color === selectedColor ? 'true' : 'false'
          );
        });
        const custom = overlay.querySelector('[data-role="color-custom"]');
        if (custom) custom.value = selectedColor;
        return;
      }

      const iconBtn = e.target.closest('[data-icon]');
      if (iconBtn && overlay.contains(iconBtn)) {
        selectedIcon = iconBtn.dataset.icon;
        refreshIconGrid(overlay);
        return;
      }

      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn || !overlay.contains(actionBtn)) return;
      await handleAction(overlay, actionBtn.dataset.action, actionBtn);
    });

    overlay.addEventListener('input', (e) => {
      if (e.target.matches?.('[data-role="color-custom"]')) {
        selectedColor = e.target.value;
        overlay.querySelectorAll('[data-color]').forEach((btn) => {
          btn.setAttribute('aria-selected', 'false');
        });
      }
    });

    document.documentElement.appendChild(overlay);
  }

  overlay.hidden = false;
  document.documentElement.classList.add('tf-manager-open');
  await renderBody(overlay);

  if (!unbound) {
    unbound = onLibraryChange(() => {
      const el = document.getElementById(OVERLAY_ID);
      if (el && !el.hidden) renderBody(el);
    });
  }
}

export function closeManager() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) overlay.hidden = true;
  document.documentElement.classList.remove('tf-manager-open');
}

export function toggleManager() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay && !overlay.hidden) closeManager();
  else openManager();
}

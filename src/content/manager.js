import {
  getLibrary,
  createFolder,
  updateFolder,
  deleteFolder,
  onLibraryChange,
  getAuthMeta,
} from '../lib/storage.js';
import { FOLDER_ICON_NAMES, iconHtml } from '../lib/icons.js';

const OVERLAY_ID = 'tf-manager-overlay';
let selectedIcon = 'Folder';
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
      <div class="tf-mgr-icons" data-role="icon-grid">
        ${FOLDER_ICON_NAMES.map(
          (name) => `
          <button type="button" class="tf-mgr-icon" data-icon="${name}" aria-selected="${
            name === selectedIcon
          }" title="${name}">
            ${iconHtml(name, 'tf-icon')}
          </button>`
        ).join('')}
      </div>
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
                return `
              <article class="tf-manager-folder" data-id="${folder.id}">
                <header>
                  ${iconHtml(folder.icon || 'Folder', 'tf-icon tf-icon-lg')}
                  <strong>${escapeHtml(folder.name)}</strong>
                  <span class="tf-mgr-count">${items.length}</span>
                  <button type="button" class="tf-mgr-btn ghost" data-action="rename" data-id="${folder.id}">Rename</button>
                  <button type="button" class="tf-mgr-btn danger" data-action="delete" data-id="${folder.id}">Delete</button>
                </header>
                <ul>
                  ${
                    items.length
                      ? items
                          .map(
                            (ch) =>
                              `<li>${escapeHtml(channelLabel(ch))}</li>`
                          )
                          .join('')
                      : `<li class="tf-manager-empty">No channels — open a channel page to add it</li>`
                  }
                </ul>
              </article>`;
              })
              .join('')
      }
    </section>
  `;
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
      await createFolder({ name, icon: selectedIcon });
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
      const iconBtn = e.target.closest('[data-icon]');
      if (iconBtn && overlay.contains(iconBtn)) {
        selectedIcon = iconBtn.dataset.icon;
        overlay.querySelectorAll('[data-icon]').forEach((btn) => {
          btn.setAttribute('aria-selected', btn.dataset.icon === selectedIcon ? 'true' : 'false');
        });
        return;
      }
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn || !overlay.contains(actionBtn)) return;
      await handleAction(overlay, actionBtn.dataset.action, actionBtn);
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

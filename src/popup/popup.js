import { isFirebaseConfigured } from '../config.js';
import { watchAuth } from '../lib/auth.js';
import {
  exportLibraryJson,
  downloadBackup,
  importLibraryJson,
} from '../lib/backup.js';
import { FOLDER_ICON_NAMES, iconHtml } from '../lib/icons.js';
import {
  getLibrary,
  createFolder,
  updateFolder,
  deleteFolder,
  onLibraryChange,
  getAuthMeta,
} from '../lib/storage.js';
import { syncLibrary, pullFromCloud, pushToCloud } from '../lib/sync.js';

const els = {
  signedOut: document.getElementById('auth-signed-out'),
  signedIn: document.getElementById('auth-signed-in'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  btnSignIn: document.getElementById('btn-signin'),
  btnSignOut: document.getElementById('btn-signout'),
  folderList: document.getElementById('folder-list'),
  folderEmpty: document.getElementById('folder-empty'),
  folderName: document.getElementById('folder-name'),
  iconGrid: document.getElementById('icon-grid'),
  btnCreate: document.getElementById('btn-create'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import'),
  btnSync: document.getElementById('btn-sync'),
  importFile: document.getElementById('import-file'),
  status: document.getElementById('status'),
};

let selectedIcon = 'Folder';
let currentUser = null;

function setStatus(message, isError = false) {
  els.status.textContent = message || '';
  els.status.classList.toggle('error', Boolean(isError));
}

function renderIconGrid() {
  els.iconGrid.innerHTML = FOLDER_ICON_NAMES.map(
    (name) => `
    <button type="button" class="tf-icon-pick" data-icon="${name}" aria-selected="${
      name === selectedIcon
    }" title="${name}" role="option">
      ${iconHtml(name, 'tf-icon')}
    </button>`
  ).join('');
}

function renderFolders(library) {
  const folders = library.folders || [];
  els.folderEmpty.classList.toggle('tf-hidden', folders.length > 0);
  els.folderList.innerHTML = folders
    .map(
      (folder) => `
    <div class="tf-folder-item" data-id="${folder.id}">
      ${iconHtml(folder.icon || 'Folder', 'tf-icon')}
      <span class="tf-name" title="${escapeAttr(folder.name)}">${escapeHtml(
        folder.name
      )}</span>
      <span class="tf-count">${(folder.channelIds || []).length}</span>
      <button type="button" class="tf-btn tf-btn-ghost" data-action="rename" title="Rename">
        ${iconHtml('Pencil', 'tf-icon')}
      </button>
      <button type="button" class="tf-btn tf-btn-danger" data-action="delete" title="Delete">
        ${iconHtml('Trash2', 'tf-icon')}
      </button>
    </div>`
    )
    .join('');
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

function setAuthUi(user) {
  currentUser = user;
  const signedIn = Boolean(user);
  els.signedIn.classList.toggle('tf-hidden', !signedIn);
  els.signedOut.classList.toggle('tf-hidden', signedIn);
  if (user) {
    els.userName.textContent = user.displayName || 'Signed in';
    els.userEmail.textContent = user.email || '';
    els.userAvatar.src = user.photoURL || '';
    els.userAvatar.style.display = user.photoURL ? 'block' : 'none';
  }
}

async function refresh() {
  const library = await getLibrary();
  renderFolders(library);
}

els.iconGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-icon]');
  if (!btn) return;
  selectedIcon = btn.dataset.icon;
  renderIconGrid();
});

els.btnCreate.addEventListener('click', async () => {
  try {
    const name = els.folderName.value.trim();
    await createFolder({ name, icon: selectedIcon });
    els.folderName.value = '';
    setStatus('Folder created');
    if (currentUser) await pushToCloud().catch(() => {});
    await refresh();
  } catch (err) {
    setStatus(err.message || 'Could not create folder', true);
  }
});

els.folderList.addEventListener('click', async (e) => {
  const item = e.target.closest('.tf-folder-item');
  const btn = e.target.closest('[data-action]');
  if (!item || !btn) return;
  const id = item.dataset.id;
  try {
    if (btn.dataset.action === 'delete') {
      if (!confirm('Delete this folder? Channels stay on YouTube.')) return;
      await deleteFolder(id);
      setStatus('Folder deleted');
    }
    if (btn.dataset.action === 'rename') {
      const next = prompt('Folder name');
      if (!next || !next.trim()) return;
      await updateFolder(id, { name: next.trim() });
      setStatus('Folder renamed');
    }
    if (currentUser) await pushToCloud().catch(() => {});
    await refresh();
  } catch (err) {
    setStatus(err.message || 'Update failed', true);
  }
});

els.btnSignIn.addEventListener('click', async () => {
  try {
    setStatus('Opening Google sign-in…');
    const response = await chrome.runtime.sendMessage({ type: 'tf-signin' });
    if (!response?.ok) throw new Error(response?.error || 'Sign-in failed');
    setAuthUi(response.user);
    await refresh();
    setStatus(`Signed in as ${response.user?.displayName || response.user?.email || 'user'}`);
  } catch (err) {
    setStatus(err.message || 'Sign-in failed', true);
  }
});

els.btnSignOut.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'tf-signout' });
    if (!response?.ok) throw new Error(response?.error || 'Sign-out failed');
    setAuthUi(null);
    setStatus('Signed out (local folders kept)');
  } catch (err) {
    setStatus(err.message || 'Sign-out failed', true);
  }
});

els.btnExport.addEventListener('click', async () => {
  try {
    const json = await exportLibraryJson();
    downloadBackup(json);
    setStatus('Backup downloaded');
  } catch (err) {
    setStatus(err.message || 'Export failed', true);
  }
});

els.btnImport.addEventListener('click', () => els.importFile.click());

els.importFile.addEventListener('change', async () => {
  const file = els.importFile.files?.[0];
  els.importFile.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    await importLibraryJson(text, { merge: false });
    if (currentUser) await pushToCloud();
    await refresh();
    setStatus('Backup imported');
  } catch (err) {
    setStatus(err.message || 'Import failed', true);
  }
});

els.btnSync.addEventListener('click', async () => {
  try {
    if (!isFirebaseConfigured()) {
      setStatus('Configure Firebase in src/config.js first', true);
      return;
    }
    if (!currentUser) {
      setStatus('Sign in to sync', true);
      return;
    }
    const result = await syncLibrary();
    await refresh();
    setStatus(`Sync ${result.action || 'done'}`);
  } catch (err) {
    setStatus(err.message || 'Sync failed', true);
  }
});

async function restoreAuthUi() {
  const meta = await getAuthMeta();
  if (meta?.uid || meta?.email || meta?.displayName) {
    setAuthUi(meta);
    return meta;
  }
  return null;
}

renderIconGrid();
refresh();
onLibraryChange(() => refresh());
restoreAuthUi();

if (isFirebaseConfigured()) {
  watchAuth(async (user) => {
    if (user) {
      setAuthUi({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      try {
        await pullFromCloud();
        await refresh();
      } catch {
        /* offline / rules */
      }
    } else {
      const meta = await getAuthMeta();
      if (meta) setAuthUi(meta);
      else setAuthUi(null);
    }
  });
} else {
  setStatus('Local mode — add Firebase keys in src/config.js to enable cloud sync');
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.authMeta) {
    const meta = changes.authMeta.newValue;
    if (meta) setAuthUi(meta);
    else setAuthUi(null);
  }
});

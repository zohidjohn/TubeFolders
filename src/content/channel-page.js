import {
  getLibrary,
  setChannelFolders,
  onLibraryChange,
} from '../lib/storage.js';
import { extractChannelFromPage, isChannelPage } from '../lib/youtube.js';
import { iconHtml } from '../lib/icons.js';

const PANEL_ID = 'tf-channel-panel';
const BTN_ID = 'tf-add-folder-btn';
const WRAP_ID = 'tf-add-folder-wrap';

function requestSync() {
  try {
    chrome.runtime.sendMessage({ type: 'tf-sync' }, () => void chrome.runtime.lastError);
  } catch {
    /* ignore */
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function findSubscribeHost() {
  return (
    document.querySelector('ytd-subscribe-button-renderer') ||
    document.querySelector('yt-subscribe-button-view-model') ||
    document.querySelector('#subscribe-button') ||
    document.querySelector('#owner-sub-count')?.parentElement ||
    document.querySelector('#channel-header #buttons') ||
    document.querySelector('#page-header .ytFlexibleActionsViewModelHost') ||
    null
  );
}

function removePanel() {
  document.getElementById(PANEL_ID)?.remove();
}

async function openAssignPanel(anchorBtn) {
  removePanel();
  const channel = extractChannelFromPage();
  if (!channel) return;

  const library = await getLibrary();
  const folders = library.folders || [];
  const membership = new Set(
    folders.filter((f) => (f.channelIds || []).includes(channel.id)).map((f) => f.id)
  );

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'tf-root';
  panel.innerHTML = `
    <h3>Add to folders</h3>
    <div class="tf-channel-meta">${escapeHtml(channel.name)}</div>
    <div class="tf-check-list">
      ${
        folders.length
          ? folders
              .map((folder) => {
                const color = folder.color || '#e11d2e';
                return `
        <label>
          <input type="checkbox" value="${folder.id}" ${
                  membership.has(folder.id) ? 'checked' : ''
                } />
          <span style="color:${escapeHtml(color)}">${iconHtml(
                  folder.icon || 'Folder',
                  'tf-icon'
                )}</span>
          <span>${escapeHtml(folder.name)}</span>
        </label>`;
              })
              .join('')
          : `<div class="tf-sidebar-empty">Create a folder first — click TubeFolders in the sidebar.</div>`
      }
    </div>
    <div class="tf-panel-actions">
      <button type="button" class="tf-save">Save</button>
      <button type="button" class="tf-close">${iconHtml('X', 'tf-icon')}</button>
    </div>
  `;

  // Position near the button when possible
  const rect = anchorBtn?.getBoundingClientRect?.();
  if (rect) {
    panel.style.position = 'fixed';
    panel.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 320)}px`;
    panel.style.right = `${Math.max(16, window.innerWidth - rect.right)}px`;
    panel.style.bottom = 'auto';
  }

  panel.querySelector('.tf-close').addEventListener('click', removePanel);
  panel.querySelector('.tf-save').addEventListener('click', async () => {
    const ids = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(
      (el) => el.value
    );
    await setChannelFolders(channel, ids);
    requestSync();
    const saveBtn = panel.querySelector('.tf-save');
    saveBtn.textContent = 'Saved';
    updateButtonLabel(ids.length);
    setTimeout(() => {
      saveBtn.textContent = 'Save';
      removePanel();
    }, 700);
  });

  document.documentElement.appendChild(panel);
}

async function updateButtonLabel(forcedCount) {
  const btn = document.getElementById(BTN_ID);
  if (!btn) return;
  let count = forcedCount;
  if (count == null) {
    const channel = extractChannelFromPage();
    if (!channel) return;
    const library = await getLibrary();
    count = library.folders.filter((f) =>
      (f.channelIds || []).includes(channel.id)
    ).length;
  }
  btn.innerHTML = `${iconHtml('FolderPlus', 'tf-icon')} <span>${
    count > 0 ? `Folders (${count})` : 'Add to folder'
  }</span>`;
}

async function ensureSubscribeButton() {
  if (!isChannelPage()) {
    document.getElementById(WRAP_ID)?.remove();
    removePanel();
    return;
  }

  if (document.getElementById(BTN_ID)) {
    await updateButtonLabel();
    return;
  }

  const host = findSubscribeHost();
  if (!host) return;

  const wrap = document.createElement('div');
  wrap.id = WRAP_ID;
  wrap.className = 'tf-root tf-add-folder-wrap';

  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.className = 'tf-add-folder-btn';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAssignPanel(btn);
  });

  wrap.appendChild(btn);

  // Prefer inserting after the subscribe control
  if (host.parentElement && host.matches('ytd-subscribe-button-renderer, yt-subscribe-button-view-model, #subscribe-button')) {
    host.insertAdjacentElement('afterend', wrap);
  } else {
    host.appendChild(wrap);
  }

  await updateButtonLabel();
}

export function startChannelPanel() {
  ensureSubscribeButton();
  onLibraryChange(() => {
    ensureSubscribeButton();
    if (document.getElementById(PANEL_ID)) {
      const btn = document.getElementById(BTN_ID);
      if (btn) openAssignPanel(btn);
    }
  });
}

export async function refreshChannelPanel() {
  await ensureSubscribeButton();
}

import {
  getLibrary,
  setChannelFolders,
  onLibraryChange,
} from '../lib/storage.js';
import { extractChannelFromPage, isChannelPage } from '../lib/youtube.js';
import { iconHtml } from '../lib/icons.js';
import { isExtensionAlive, safeSendMessage } from '../lib/extension.js';

const PANEL_ID = 'tf-channel-panel';
const BTN_ID = 'tf-add-folder-btn';
const WRAP_ID = 'tf-add-folder-wrap';

function requestSync() {
  safeSendMessage({ type: 'tf-sync' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Signed-in channel header (verified on @UtopiaShowLive):
 * yt-flexible-actions-view-model
 *   └─ div.ytFlexibleActionsViewModelAction
 *        └─ yt-subscribe-button-view-model.ytSubscribeButtonViewModelHost  ("Subscribed")
 *
 * Insert our button as the next action sibling after that action div.
 */
function findSubscribeInsertion() {
  // Prefer page-header subscribe (not shelf / related channel subscribe)
  const header =
    document.querySelector('#page-header yt-flexible-actions-view-model') ||
    document.querySelector(
      'yt-page-header-view-model yt-flexible-actions-view-model'
    ) ||
    document.querySelector('yt-flexible-actions-view-model');

  if (header) {
    const subVm =
      header.querySelector('yt-subscribe-button-view-model') ||
      header.querySelector('.ytSubscribeButtonViewModelHost');
    if (subVm) {
      const action = subVm.closest('.ytFlexibleActionsViewModelAction') || subVm;
      return { anchor: action, mode: 'after', host: header };
    }
  }

  const subVm = document.querySelector(
    '#page-header yt-subscribe-button-view-model, yt-page-header-view-model yt-subscribe-button-view-model'
  );
  if (subVm) {
    const action = subVm.closest('.ytFlexibleActionsViewModelAction') || subVm;
    return { anchor: action, mode: 'after', host: action.parentElement };
  }

  return null;
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
          : `<div class="tf-guide-empty">Create a folder first — click TubeFolders in the sidebar.</div>`
      }
    </div>
    <div class="tf-panel-actions">
      <button type="button" class="tf-save">Save</button>
      <button type="button" class="tf-close">${iconHtml('X', 'tf-icon')}</button>
    </div>
  `;

  const rect = anchorBtn?.getBoundingClientRect?.();
  panel.style.position = 'fixed';
  panel.style.bottom = 'auto';
  if (rect) {
    const top = Math.min(rect.bottom + 8, window.innerHeight - 340);
    let left = rect.left;
    if (left + 280 > window.innerWidth - 12) left = window.innerWidth - 292;
    if (left < 12) left = 12;
    panel.style.top = `${Math.max(12, top)}px`;
    panel.style.left = `${left}px`;
    panel.style.right = 'auto';
  } else {
    panel.style.top = '80px';
    panel.style.left = '50%';
    panel.style.transform = 'translateX(-50%)';
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

export async function ensureSubscribeButton() {
  if (!isChannelPage()) {
    document.getElementById(WRAP_ID)?.remove();
    removePanel();
    return false;
  }

  if (document.getElementById(BTN_ID)) {
    // Ensure it is still next to the header subscribe control
    const wrap = document.getElementById(WRAP_ID);
    const spot = findSubscribeInsertion();
    if (
      wrap &&
      spot?.anchor &&
      wrap.previousElementSibling !== spot.anchor &&
      wrap.parentElement !== spot.host
    ) {
      wrap.remove();
    } else {
      await updateButtonLabel();
      return true;
    }
  }

  const spot = findSubscribeInsertion();
  if (!spot?.anchor) return false;

  const wrap = document.createElement('div');
  wrap.id = WRAP_ID;
  wrap.className = 'tf-root tf-add-folder-wrap ytFlexibleActionsViewModelAction';

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
  spot.anchor.insertAdjacentElement('afterend', wrap);
  await updateButtonLabel();
  return true;
}

export function startChannelPanel() {
  if (!isExtensionAlive()) return;
  ensureSubscribeButton();
  onLibraryChange(() => {
    if (!isExtensionAlive()) return;
    ensureSubscribeButton();
  });

  let tries = 0;
  const timer = setInterval(() => {
    if (!isExtensionAlive()) {
      clearInterval(timer);
      return;
    }
    tries += 1;
    ensureSubscribeButton().then((ok) => {
      if (ok || tries > 40) clearInterval(timer);
    });
  }, 500);
}

export async function refreshChannelPanel() {
  await ensureSubscribeButton();
}

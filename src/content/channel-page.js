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

function looksLikeSubscribeControl(el) {
  if (!el) return false;
  const text = (el.textContent || '').trim().toLowerCase();
  const aria = (el.getAttribute?.('aria-label') || '').toLowerCase();
  const hay = `${text} ${aria}`;
  return (
    hay.includes('subscribe') ||
    hay.includes('subscribed') ||
    hay.includes('подпис') || // Russian subscribe variants
    el.tagName?.toLowerCase().includes('subscribe')
  );
}

/**
 * Find the Subscribe / Subscribed control on modern YouTube channel headers.
 * Returns { anchor, mode } where mode is 'after' | 'append'.
 */
function findSubscribeInsertion() {
  const tagged =
    document.querySelector('yt-subscribe-button-view-model') ||
    document.querySelector('ytd-subscribe-button-renderer') ||
    document.querySelector('#subscribe-button');
  if (tagged) {
    return { anchor: tagged, mode: 'after' };
  }

  // Flexible actions row on redesigned channel page
  const actions =
    document.querySelector('yt-flexible-actions-view-model') ||
    document.querySelector('.ytFlexibleActionsViewModelHost') ||
    document.querySelector('#page-header yt-page-header-view-model') ||
    document.querySelector('#inner-header-container #buttons') ||
    document.querySelector('#channel-header-container #buttons');

  if (actions) {
    const buttons = [
      ...actions.querySelectorAll('button, a, yt-button-view-model, .yt-spec-button-shape-next'),
    ];
    const sub = buttons.find(looksLikeSubscribeControl);
    if (sub) {
      const wrap =
        sub.closest('yt-button-view-model, yt-subscribe-button-view-model, ytd-subscribe-button-renderer') ||
        sub;
      return { anchor: wrap, mode: 'after' };
    }
    return { anchor: actions, mode: 'append' };
  }

  // Fallback: any visible subscribe-looking button in the header area
  const header =
    document.querySelector('#page-header') ||
    document.querySelector('ytd-c4-tabbed-header-renderer') ||
    document.querySelector('#channel-header');
  if (header) {
    const candidate = [...header.querySelectorAll('button, yt-button-view-model')].find(
      looksLikeSubscribeControl
    );
    if (candidate) {
      const wrap =
        candidate.closest('yt-button-view-model, yt-subscribe-button-view-model') ||
        candidate;
      return { anchor: wrap, mode: 'after' };
    }
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
    await updateButtonLabel();
    return true;
  }

  const spot = findSubscribeInsertion();
  if (!spot?.anchor) return false;

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

  if (spot.mode === 'after' && spot.anchor.parentElement) {
    spot.anchor.insertAdjacentElement('afterend', wrap);
  } else {
    spot.anchor.appendChild(wrap);
  }

  await updateButtonLabel();
  return true;
}

export function startChannelPanel() {
  ensureSubscribeButton();
  onLibraryChange(() => {
    ensureSubscribeButton();
  });

  // YouTube builds the subscribe row late — keep retrying briefly on channel pages
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    ensureSubscribeButton().then((ok) => {
      if (ok || tries > 40) clearInterval(timer);
    });
  }, 500);
}

export async function refreshChannelPanel() {
  await ensureSubscribeButton();
}

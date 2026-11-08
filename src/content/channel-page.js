import {
  getLibrary,
  setChannelFolders,
  onLibraryChange,
} from '../lib/storage.js';
import {
  extractChannelFromPage,
  isChannelPage,
  folderHasChannel,
  channelIdentityKeys,
} from '../lib/youtube.js';
import { iconHtml } from '../lib/icons.js';
import { isExtensionAlive, safeSendMessage } from '../lib/extension.js';

const PANEL_ID = 'tf-channel-panel';
const BTN_ID = 'tf-add-folder-btn';
const WRAP_ID = 'tf-add-folder-wrap';

/** @type {{ panel: HTMLElement, anchor: HTMLElement, channelKey: string, onScroll: () => void, onPointer: (e: Event) => void, onKey: (e: KeyboardEvent) => void } | null} */
let openPanelState = null;
let lastChannelKey = '';

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

function channelKey(channel) {
  if (!channel) return '';
  return channelIdentityKeys(channel).join('|') || channel.id || '';
}

/**
 * Signed-in channel header:
 * yt-flexible-actions-view-model
 *   └─ div.ytFlexibleActionsViewModelAction
 *        └─ yt-subscribe-button-view-model
 */
function findSubscribeInsertion() {
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

function positionPanel(panel, anchorBtn) {
  if (!panel || !anchorBtn?.isConnected) {
    removePanel();
    return;
  }
  const rect = anchorBtn.getBoundingClientRect();
  const panelW = panel.offsetWidth || 280;
  const panelH = panel.offsetHeight || 200;
  const gap = 8;
  const margin = 12;

  let top = rect.bottom + gap;
  if (top + panelH > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - gap - panelH);
  }

  let left = rect.left;
  if (left + panelW > window.innerWidth - margin) {
    left = window.innerWidth - panelW - margin;
  }
  if (left < margin) left = margin;

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
  panel.style.transform = 'none';
}

function removePanel() {
  if (openPanelState) {
    window.removeEventListener('scroll', openPanelState.onScroll, true);
    window.removeEventListener('resize', openPanelState.onScroll);
    document.removeEventListener('pointerdown', openPanelState.onPointer, true);
    document.removeEventListener('keydown', openPanelState.onKey, true);
    openPanelState = null;
  }
  document.getElementById(PANEL_ID)?.remove();
}

async function openAssignPanel(anchorBtn) {
  removePanel();
  const channel = extractChannelFromPage();
  if (!channel || !anchorBtn) return;

  // Always re-read library so checks match THIS channel only
  const library = await getLibrary();
  const folders = library.folders || [];
  const membership = new Set(
    folders.filter((f) => folderHasChannel(f, channel)).map((f) => f.id)
  );

  const key = channelKey(channel);
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'tf-root';
  panel.dataset.channelKey = key;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Add to folders');
  panel.innerHTML = `
    <div class="tf-panel-header">
      <div class="tf-panel-heading">
        <h3>Add to folders</h3>
        <div class="tf-channel-meta">${escapeHtml(channel.name)}</div>
      </div>
      <button type="button" class="tf-close" aria-label="Close">${iconHtml('X', 'tf-icon')}</button>
    </div>
    <div class="tf-check-list">
      ${
        folders.length
          ? folders
              .map((folder) => {
                const color = folder.color || '#e11d2e';
                const checked = membership.has(folder.id);
                return `
        <label>
          <input type="checkbox" value="${folder.id}" ${checked ? 'checked' : ''} />
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
    </div>
  `;

  document.documentElement.appendChild(panel);
  positionPanel(panel, anchorBtn);

  const onScroll = () => removePanel();
  const onPointer = (e) => {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (panel.contains(t) || anchorBtn.contains(t) || t === anchorBtn) return;
    removePanel();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') removePanel();
  };

  openPanelState = {
    panel,
    anchor: anchorBtn,
    channelKey: key,
    onScroll,
    onPointer,
    onKey,
  };
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll);
  setTimeout(() => {
    if (openPanelState?.panel === panel) {
      document.addEventListener('pointerdown', onPointer, true);
      document.addEventListener('keydown', onKey, true);
    }
  }, 0);

  panel.querySelector('.tf-close').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    removePanel();
  });
  panel.querySelector('.tf-save').addEventListener('click', async () => {
    const ids = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(
      (el) => el.value
    );
    // Re-read channel at save time in case SPA updated mid-open
    const fresh = extractChannelFromPage() || channel;
    await setChannelFolders(fresh, ids);
    requestSync();
    updateButtonLabel(ids.length);
    removePanel();
  });
}

async function updateButtonLabel(forcedCount) {
  const btn = document.getElementById(BTN_ID);
  if (!btn) return;
  let count = forcedCount;
  if (count == null) {
    const channel = extractChannelFromPage();
    if (!channel) return;
    const library = await getLibrary();
    count = library.folders.filter((f) => folderHasChannel(f, channel)).length;
  }
  btn.innerHTML = `${iconHtml('FolderPlus', 'tf-icon')} <span class="tf-add-folder-label">${
    count > 0 ? `Folders (${count})` : 'Add to folder'
  }</span>`;
}

export async function ensureSubscribeButton() {
  if (!isChannelPage()) {
    document.getElementById(WRAP_ID)?.remove();
    removePanel();
    lastChannelKey = '';
    return false;
  }

  const channel = extractChannelFromPage();
  const key = channelKey(channel);

  // Channel switched (SPA) → always clear the popup
  if (key && key !== lastChannelKey) {
    removePanel();
    lastChannelKey = key;
  }
  if (openPanelState && openPanelState.channelKey !== key) {
    removePanel();
  }

  const existing = document.getElementById(BTN_ID);
  if (existing) {
    const wrap = document.getElementById(WRAP_ID);
    const spot = findSubscribeInsertion();
    const staleChannel = wrap?.dataset?.channelKey && wrap.dataset.channelKey !== key;
    if (
      staleChannel ||
      (wrap &&
        spot?.anchor &&
        wrap.previousElementSibling !== spot.anchor &&
        wrap.parentElement !== spot.host)
    ) {
      wrap.remove();
      removePanel();
    } else {
      if (wrap && key) wrap.dataset.channelKey = key;
      await updateButtonLabel();
      return true;
    }
  }

  const spot = findSubscribeInsertion();
  if (!spot?.anchor) return false;

  const wrap = document.createElement('div');
  wrap.id = WRAP_ID;
  wrap.className = 'tf-root tf-add-folder-wrap ytFlexibleActionsViewModelAction';
  if (key) wrap.dataset.channelKey = key;

  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.className = [
    'tf-add-folder-btn',
    'ytSpecButtonShapeNextHost',
    'ytSpecButtonShapeNextTonal',
    'ytSpecButtonShapeNextMono',
    'ytSpecButtonShapeNextSizeM',
    'ytSpecButtonShapeNextIconLeading',
  ].join(' ');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (openPanelState?.anchor === btn) {
      removePanel();
      return;
    }
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

  document.addEventListener('yt-navigate-start', () => {
    removePanel();
  });
  document.addEventListener('yt-navigate-finish', () => {
    removePanel();
    lastChannelKey = '';
    setTimeout(() => ensureSubscribeButton(), 50);
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

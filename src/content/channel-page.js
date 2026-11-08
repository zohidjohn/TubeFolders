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

/** @type {{ panel: HTMLElement, anchor: HTMLElement, onScroll: () => void, onPointer: (e: Event) => void, onKey: (e: KeyboardEvent) => void } | null} */
let openPanelState = null;

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

function mastheadBottom() {
  const masthead =
    document.querySelector('#masthead-container') ||
    document.querySelector('ytd-masthead') ||
    document.querySelector('#header');
  if (!masthead) return 56;
  const r = masthead.getBoundingClientRect();
  return Math.max(0, r.bottom);
}

function positionPanel(panel, anchorBtn) {
  if (!panel || !anchorBtn?.isConnected) {
    removePanel();
    return;
  }
  const rect = anchorBtn.getBoundingClientRect();
  // Button fully off-screen → close (don't pin panel to the masthead)
  if (rect.bottom < 8 || rect.top > window.innerHeight - 8) {
    removePanel();
    return;
  }

  const panelW = panel.offsetWidth || 280;
  const panelH = panel.offsetHeight || 200;
  const gap = 8;
  const margin = 12;
  const headerY = mastheadBottom();

  // Stay glued to the button — never clamp onto the sticky header
  let top = rect.bottom + gap;
  if (top + panelH > window.innerHeight - margin) {
    top = rect.top - gap - panelH;
  }

  // If the button is under the masthead, keep following it (panel sits behind header via z-index)
  // Only nudge below header when the button itself is still below the header
  if (rect.top >= headerY && top < headerY + 4) {
    top = headerY + 4;
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

  const library = await getLibrary();
  const folders = library.folders || [];
  const membership = new Set(
    folders.filter((f) => (f.channelIds || []).includes(channel.id)).map((f) => f.id)
  );

  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'tf-root';
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
    </div>
  `;

  document.documentElement.appendChild(panel);
  positionPanel(panel, anchorBtn);

  const onScroll = () => positionPanel(panel, anchorBtn);
  const onPointer = (e) => {
    const t = e.target;
    if (!(t instanceof Node)) return;
    if (panel.contains(t) || anchorBtn.contains(t) || t === anchorBtn) return;
    removePanel();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') removePanel();
  };

  openPanelState = { panel, anchor: anchorBtn, onScroll, onPointer, onKey };
  // capture scroll so YouTube's nested scroll containers still update position
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll);
  // next tick so the opening click does not immediately close
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
    await setChannelFolders(channel, ids);
    requestSync();
    const saveBtn = panel.querySelector('.tf-save');
    saveBtn.textContent = 'Saved';
    updateButtonLabel(ids.length);
    setTimeout(() => {
      removePanel();
    }, 500);
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
    count = library.folders.filter((f) =>
      (f.channelIds || []).includes(channel.id)
    ).length;
  }
  btn.innerHTML = `${iconHtml('FolderPlus', 'tf-icon')} <span class="tf-add-folder-label">${
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
  // Same yt-spec tonal classes as the Subscribed button
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

import {
  getLibrary,
  setChannelFolders,
  onLibraryChange,
} from '../lib/storage.js';
import { extractChannelFromPage, isChannelPage } from '../lib/youtube.js';
import { iconHtml } from '../lib/icons.js';

const PANEL_ID = 'tf-channel-panel';

function removePanel() {
  document.getElementById(PANEL_ID)?.remove();
}

function requestSync() {
  try {
    chrome.runtime.sendMessage({ type: 'tf-sync' }, () => void chrome.runtime.lastError);
  } catch {
    /* ignore */
  }
}

async function renderPanel() {
  removePanel();
  if (!isChannelPage()) return;

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
              .map(
                (folder) => `
        <label>
          <input type="checkbox" value="${folder.id}" ${
                  membership.has(folder.id) ? 'checked' : ''
                } />
          ${iconHtml(folder.icon || 'Folder', 'tf-icon')}
          <span>${escapeHtml(folder.name)}</span>
        </label>`
              )
              .join('')
          : `<div class="tf-sidebar-empty">Create a folder in the extension popup first.</div>`
      }
    </div>
    <div class="tf-panel-actions">
      <button type="button" class="tf-save">Save</button>
      <button type="button" class="tf-close">${iconHtml('X', 'tf-icon')}</button>
    </div>
  `;

  panel.querySelector('.tf-close').addEventListener('click', removePanel);
  panel.querySelector('.tf-save').addEventListener('click', async () => {
    const ids = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(
      (el) => el.value
    );
    await setChannelFolders(channel, ids);
    requestSync();
    const saveBtn = panel.querySelector('.tf-save');
    saveBtn.textContent = 'Saved';
    setTimeout(() => {
      saveBtn.textContent = 'Save';
    }, 1200);
  });

  document.documentElement.appendChild(panel);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function startChannelPanel() {
  renderPanel();
  onLibraryChange(() => {
    if (document.getElementById(PANEL_ID)) renderPanel();
  });
}

export { renderPanel as refreshChannelPanel };

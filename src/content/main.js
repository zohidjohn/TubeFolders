import { startSidebar, renderSidebar } from './sidebar.js';
import { startHighlight, highlightSubscriptions } from './highlight.js';
import { startChannelPanel, refreshChannelPanel } from './channel-page.js';
import { isExtensionAlive } from '../lib/extension.js';

const FONT_URL = isExtensionAlive()
  ? chrome.runtime.getURL('assets/fonts/Outfit-Variable.ttf')
  : '';

function ensureFont() {
  if (document.getElementById('tf-font-style')) return;
  const style = document.createElement('style');
  style.id = 'tf-font-style';
  style.textContent = `
    @font-face {
      font-family: 'Outfit';
      src: url('${FONT_URL}') format('truetype');
      font-weight: 100 900;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.documentElement.appendChild(style);
}

function refreshAll() {
  if (!isExtensionAlive()) return;
  ensureFont();
  renderSidebar();
  highlightSubscriptions();
  refreshChannelPanel();
}

function observeSpa() {
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(refreshAll, 300);
  });

  let timer = null;
  const obs = new MutationObserver(() => {
    if (!isExtensionAlive()) {
      obs.disconnect();
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!isExtensionAlive()) return;
      if (!document.getElementById('tf-sidebar-section')) {
        renderSidebar();
      }
      highlightSubscriptions();
      refreshChannelPanel();
    }, 400);
  });

  const start = () => {
    const root =
      document.querySelector('#content, ytd-app, body') || document.documentElement;
    obs.observe(root, { childList: true, subtree: true });
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

if (isExtensionAlive()) {
  ensureFont();
  startSidebar();
  startHighlight();
  startChannelPanel();
  observeSpa();
  setTimeout(refreshAll, 1000);
  setTimeout(refreshAll, 3000);
}

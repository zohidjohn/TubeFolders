/** True while this content-script instance can still talk to the extension. */
export function isExtensionAlive() {
  try {
    return Boolean(chrome?.runtime?.id);
  } catch {
    return false;
  }
}

export async function safeStorageGet(keys) {
  if (!isExtensionAlive()) return {};
  try {
    return await chrome.storage.local.get(keys);
  } catch (err) {
    if (/context invalidated/i.test(String(err?.message || err))) return {};
    throw err;
  }
}

export async function safeStorageSet(values) {
  if (!isExtensionAlive()) return false;
  try {
    await chrome.storage.local.set(values);
    return true;
  } catch (err) {
    if (/context invalidated/i.test(String(err?.message || err))) return false;
    throw err;
  }
}

export function safeSendMessage(message) {
  return new Promise((resolve) => {
    if (!isExtensionAlive()) {
      resolve({ ok: false, reason: 'context_invalidated' });
      return;
    }
    try {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) {
          resolve({
            ok: false,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        resolve(res || { ok: false });
      });
    } catch (err) {
      resolve({
        ok: false,
        error: err?.message || String(err),
      });
    }
  });
}

(() => {
  // src/lib/storage.js
  var LIBRARY_KEY = "library";
  var AUTH_META_KEY = "authMeta";
  var DIRTY_KEY = "libraryDirty";
  function emptyLibrary() {
    return { folders: [], channels: {}, updatedAt: 0 };
  }
  async function getLibrary() {
    const data = await chrome.storage.local.get(LIBRARY_KEY);
    const lib = data[LIBRARY_KEY];
    if (!lib || typeof lib !== "object") return emptyLibrary();
    return {
      folders: Array.isArray(lib.folders) ? lib.folders : [],
      channels: lib.channels && typeof lib.channels === "object" ? lib.channels : {},
      updatedAt: lib.updatedAt || 0
    };
  }
  async function setLibrary(library, { dirty = true } = {}) {
    const next = {
      folders: library.folders || [],
      channels: library.channels || {},
      updatedAt: library.updatedAt || Date.now()
    };
    await chrome.storage.local.set({
      [LIBRARY_KEY]: next,
      [DIRTY_KEY]: dirty
    });
    return next;
  }
  async function getAuthMeta() {
    const data = await chrome.storage.local.get(AUTH_META_KEY);
    return data[AUTH_META_KEY] || null;
  }
  function createId() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
  async function createFolder({ name, icon }) {
    const lib = await getLibrary();
    const folder = {
      id: createId(),
      name: (name || "New folder").trim() || "New folder",
      icon: icon || "Folder",
      channelIds: []
    };
    lib.folders.push(folder);
    await setLibrary(lib);
    return folder;
  }
  async function updateFolder(folderId, patch) {
    const lib = await getLibrary();
    const idx = lib.folders.findIndex((f) => f.id === folderId);
    if (idx === -1) throw new Error("Folder not found");
    lib.folders[idx] = { ...lib.folders[idx], ...patch, id: folderId };
    await setLibrary(lib);
    return lib.folders[idx];
  }
  async function deleteFolder(folderId) {
    const lib = await getLibrary();
    lib.folders = lib.folders.filter((f) => f.id !== folderId);
    await setLibrary(lib);
  }
  async function setChannelFolders(channel, folderIds) {
    const lib = await getLibrary();
    const id = channel.id;
    lib.channels[id] = {
      id,
      name: channel.name || lib.channels[id]?.name || "Channel",
      handle: channel.handle || lib.channels[id]?.handle || "",
      avatarUrl: channel.avatarUrl || lib.channels[id]?.avatarUrl || ""
    };
    const selected = new Set(folderIds);
    for (const folder of lib.folders) {
      const has = folder.channelIds.includes(id);
      if (selected.has(folder.id) && !has) folder.channelIds.push(id);
      if (!selected.has(folder.id) && has) {
        folder.channelIds = folder.channelIds.filter((cid) => cid !== id);
      }
    }
    await setLibrary(lib);
    return lib;
  }
  function getFiledChannelIds(library) {
    const ids = /* @__PURE__ */ new Set();
    for (const folder of library.folders || []) {
      for (const id of folder.channelIds || []) ids.add(id);
    }
    return ids;
  }
  function onLibraryChange(callback) {
    const listener = (changes, area) => {
      if (area === "local" && changes[LIBRARY_KEY]) {
        callback(changes[LIBRARY_KEY].newValue || emptyLibrary());
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  // src/lib/icons.js
  var svg = (paths) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  var ICONS = {
    Folder: svg('<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'),
    Gamepad2: svg('<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>'),
    Music: svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
    Newspaper: svg('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>'),
    GraduationCap: svg('<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'),
    Cpu: svg('<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>'),
    Clapperboard: svg('<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>'),
    Dumbbell: svg('<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>'),
    Utensils: svg('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),
    Plane: svg('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
    Briefcase: svg('<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>'),
    Heart: svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
    Laugh: svg('<circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>'),
    Code2: svg('<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>'),
    Mic: svg('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>'),
    Camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
    Globe: svg('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
    Star: svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
    Zap: svg('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'),
    BookOpen: svg('<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>'),
    Car: svg('<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'),
    Baby: svg('<path d="M10 16c3.5 0 5-.5 5-2.5-.7-.5-1.5-1.5-2-3"/><path d="M14 15.5c.5-1.5 1.5-2.5 3-3.5"/><path d="M9.5 17.5c.3.7.8 1.5 1.5 2"/><circle cx="12" cy="8" r="5"/><path d="M12 13v4"/>'),
    Landmark: svg('<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'),
    Radio: svg('<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>'),
    Wrench: svg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    ChevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
    ChevronRight: svg('<path d="m9 18 6-6-6-6"/>'),
    Plus: svg('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    Trash2: svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>'),
    Pencil: svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>'),
    Download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
    Upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>'),
    LogIn: svg('<path d="m10 17 5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>'),
    LogOut: svg('<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>'),
    Check: svg('<path d="M20 6 9 17l-5-5"/>'),
    X: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    FolderPlus: svg('<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>')
  };
  var FOLDER_ICON_NAMES = [
    "Folder",
    "Gamepad2",
    "Music",
    "Newspaper",
    "GraduationCap",
    "Cpu",
    "Clapperboard",
    "Dumbbell",
    "Utensils",
    "Plane",
    "Briefcase",
    "Heart",
    "Laugh",
    "Code2",
    "Mic",
    "Camera",
    "Globe",
    "Star",
    "Zap",
    "BookOpen",
    "Car",
    "Baby",
    "Landmark",
    "Radio",
    "Wrench"
  ];
  function getIconSvg(name) {
    return ICONS[name] || ICONS.Folder;
  }
  function iconHtml(name, className = "tf-icon") {
    const raw = getIconSvg(name);
    return raw.replace("<svg ", `<svg class="${className}" aria-hidden="true" `);
  }

  // src/content/manager.js
  var OVERLAY_ID = "tf-manager-overlay";
  var selectedIcon = "Folder";
  var unbound = null;
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
    return ch?.name || ch?.handle || ch?.id || "Channel";
  }
  async function renderBody(overlay) {
    const library = await getLibrary();
    const auth = await getAuthMeta();
    const folders = library.folders || [];
    const channels = library.channels || {};
    const body = overlay.querySelector(".tf-manager-body");
    if (!body) return;
    body.innerHTML = `
    <section class="tf-manager-auth">
      ${auth ? `<div class="tf-manager-user">
              ${auth.photoURL ? `<img src="${escapeHtml(auth.photoURL)}" alt="" />` : ""}
              <div>
                <div class="tf-manager-user-name">${escapeHtml(auth.displayName || "Signed in")}</div>
                <div class="tf-manager-user-email">${escapeHtml(auth.email || "")}</div>
              </div>
              <button type="button" class="tf-mgr-btn ghost" data-action="signout">Sign out</button>
            </div>` : `<div class="tf-manager-user">
              <div>
                <div class="tf-manager-user-name">Not signed in</div>
                <div class="tf-manager-user-email">Sign in to sync folders to the cloud</div>
              </div>
              <button type="button" class="tf-mgr-btn" data-action="signin">Sign in with Google</button>
            </div>`}
      <div class="tf-manager-status" data-role="status"></div>
    </section>

    <section class="tf-manager-create">
      <h3>New folder</h3>
      <input class="tf-mgr-input" data-role="folder-name" type="text" maxlength="48" placeholder="Folder name" />
      <div class="tf-mgr-icons" data-role="icon-grid">
        ${FOLDER_ICON_NAMES.map(
      (name) => `
          <button type="button" class="tf-mgr-icon" data-icon="${name}" aria-selected="${name === selectedIcon}" title="${name}">
            ${iconHtml(name, "tf-icon")}
          </button>`
    ).join("")}
      </div>
      <button type="button" class="tf-mgr-btn" data-action="create">Create folder</button>
    </section>

    <section class="tf-manager-folders">
      <h3>Your folders</h3>
      ${folders.length === 0 ? `<p class="tf-manager-empty">No folders yet. Create one above.</p>` : folders.map((folder) => {
      const items = (folder.channelIds || []).map((id) => channels[id]).filter(Boolean);
      return `
              <article class="tf-manager-folder" data-id="${folder.id}">
                <header>
                  ${iconHtml(folder.icon || "Folder", "tf-icon tf-icon-lg")}
                  <strong>${escapeHtml(folder.name)}</strong>
                  <span class="tf-mgr-count">${items.length}</span>
                  <button type="button" class="tf-mgr-btn ghost" data-action="rename" data-id="${folder.id}">Rename</button>
                  <button type="button" class="tf-mgr-btn danger" data-action="delete" data-id="${folder.id}">Delete</button>
                </header>
                <ul>
                  ${items.length ? items.map(
        (ch) => `<li>${escapeHtml(channelLabel(ch))}</li>`
      ).join("") : `<li class="tf-manager-empty">No channels \u2014 open a channel page to add it</li>`}
                </ul>
              </article>`;
    }).join("")}
    </section>
  `;
  }
  function setStatus(overlay, message, isError = false) {
    const el = overlay.querySelector('[data-role="status"]');
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("error", Boolean(isError));
  }
  async function handleAction(overlay, action, target) {
    try {
      if (action === "close") {
        closeManager();
        return;
      }
      if (action === "signin") {
        setStatus(overlay, "Opening Google sign-in\u2026");
        const res = await send("tf-signin");
        if (!res.ok) throw new Error(res.error || "Sign-in failed");
        setStatus(overlay, `Signed in as ${res.user?.displayName || res.user?.email || "user"}`);
        await renderBody(overlay);
        return;
      }
      if (action === "signout") {
        await send("tf-signout");
        setStatus(overlay, "Signed out");
        await renderBody(overlay);
        return;
      }
      if (action === "create") {
        const input = overlay.querySelector('[data-role="folder-name"]');
        const name = input?.value?.trim() || "";
        await createFolder({ name, icon: selectedIcon });
        if (input) input.value = "";
        await send("tf-sync");
        setStatus(overlay, "Folder created");
        await renderBody(overlay);
        return;
      }
      if (action === "rename") {
        const id = target.dataset.id;
        const next = prompt("Folder name");
        if (!next || !next.trim()) return;
        await updateFolder(id, { name: next.trim() });
        await send("tf-sync");
        setStatus(overlay, "Folder renamed");
        await renderBody(overlay);
        return;
      }
      if (action === "delete") {
        const id = target.dataset.id;
        if (!confirm("Delete this folder?")) return;
        await deleteFolder(id);
        await send("tf-sync");
        setStatus(overlay, "Folder deleted");
        await renderBody(overlay);
      }
    } catch (err) {
      setStatus(overlay, err.message || "Something went wrong", true);
    }
  }
  async function openManager() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      overlay.className = "tf-root";
      overlay.innerHTML = `
      <div class="tf-manager-backdrop" data-action="close"></div>
      <div class="tf-manager-panel" role="dialog" aria-label="TubeFolders manager">
        <header class="tf-manager-header">
          <div class="tf-manager-brand">
            <span class="tf-mark"></span>
            <h2>TubeFolders</h2>
          </div>
          <button type="button" class="tf-mgr-btn ghost" data-action="close" aria-label="Close">
            ${iconHtml("X", "tf-icon")}
          </button>
        </header>
        <div class="tf-manager-body"></div>
      </div>
    `;
      overlay.addEventListener("click", async (e) => {
        const iconBtn = e.target.closest("[data-icon]");
        if (iconBtn && overlay.contains(iconBtn)) {
          selectedIcon = iconBtn.dataset.icon;
          overlay.querySelectorAll("[data-icon]").forEach((btn) => {
            btn.setAttribute("aria-selected", btn.dataset.icon === selectedIcon ? "true" : "false");
          });
          return;
        }
        const actionBtn = e.target.closest("[data-action]");
        if (!actionBtn || !overlay.contains(actionBtn)) return;
        await handleAction(overlay, actionBtn.dataset.action, actionBtn);
      });
      document.documentElement.appendChild(overlay);
    }
    overlay.hidden = false;
    document.documentElement.classList.add("tf-manager-open");
    await renderBody(overlay);
    if (!unbound) {
      unbound = onLibraryChange(() => {
        const el = document.getElementById(OVERLAY_ID);
        if (el && !el.hidden) renderBody(el);
      });
    }
  }
  function closeManager() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.hidden = true;
    document.documentElement.classList.remove("tf-manager-open");
  }

  // src/content/sidebar.js
  var SECTION_ID = "tf-sidebar-section";
  function findSubscriptionsAnchor() {
    const entries = [
      ...document.querySelectorAll(
        "ytd-guide-section-renderer, yt-guide-section-renderer"
      )
    ];
    for (const section of entries) {
      const title = (section.querySelector("#guide-section-title, h3, #header, yt-formatted-string")?.textContent || "").trim().toLowerCase();
      if (title.includes("subscription")) return section;
    }
    const subEntry = [...document.querySelectorAll("a#endpoint, a.yt-simple-endpoint")].find(
      (a) => (a.getAttribute("href") || "").includes("/feed/subscriptions")
    );
    if (subEntry) {
      return subEntry.closest("ytd-guide-section-renderer, yt-guide-section-renderer") || subEntry.closest("#sections") || subEntry;
    }
    return document.querySelector("#guide-inner-content, ytd-guide-renderer");
  }
  function channelHref(channel) {
    if (channel.href) return channel.href;
    const id = channel.id || "";
    if (id.startsWith("UC")) return `https://www.youtube.com/channel/${id}`;
    if (id.startsWith("@")) return `https://www.youtube.com/${id}`;
    if (id.startsWith("c/")) return `https://www.youtube.com/${id}`;
    if (id.startsWith("user/")) return `https://www.youtube.com/${id}`;
    return `https://www.youtube.com/${id}`;
  }
  function buildSection(library) {
    const section = document.createElement("div");
    section.id = SECTION_ID;
    section.className = "tf-root";
    const folders = library.folders || [];
    const channels = library.channels || {};
    section.innerHTML = `
    <button type="button" class="tf-sidebar-header tf-sidebar-open" title="Manage TubeFolders">
      <h2 class="tf-sidebar-title"><span class="tf-mark"></span> TubeFolders</h2>
      <span class="tf-sidebar-edit">${iconHtml("Pencil", "tf-icon")}</span>
    </button>
    ${folders.length === 0 ? `<button type="button" class="tf-sidebar-empty tf-sidebar-open">Click to create and manage folders</button>` : folders.map((folder) => {
      const items = (folder.channelIds || []).map((id) => channels[id]).filter(Boolean);
      return `
            <div class="tf-folder" data-folder-id="${folder.id}" data-open="false">
              <button type="button" class="tf-folder-toggle" aria-expanded="false">
                ${iconHtml(folder.icon || "Folder", "tf-icon")}
                <span>${escapeHtml2(folder.name)}</span>
                <span class="tf-chevron">${iconHtml("ChevronRight", "tf-icon")}</span>
              </button>
              <div class="tf-folder-channels">
                ${items.length ? items.map(
        (ch) => `
                  <a class="tf-channel-link" href="${escapeAttr(channelHref(ch))}">
                    ${ch.avatarUrl ? `<img src="${escapeAttr(ch.avatarUrl)}" alt="" width="24" height="24" />` : `<span class="tf-icon">${iconHtml("Folder", "tf-icon")}</span>`}
                    <span>${escapeHtml2(ch.name || ch.handle || ch.id)}</span>
                  </a>`
      ).join("") : `<button type="button" class="tf-sidebar-empty tf-sidebar-open">No channels \u2014 manage folders</button>`}
              </div>
            </div>`;
    }).join("")}
  `;
    section.addEventListener("click", (e) => {
      if (e.target.closest(".tf-sidebar-open")) {
        e.preventDefault();
        openManager();
        return;
      }
      const toggle = e.target.closest(".tf-folder-toggle");
      if (!toggle) return;
      const folder = toggle.closest(".tf-folder");
      const open = folder.getAttribute("data-open") === "true";
      folder.setAttribute("data-open", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      const chevron = toggle.querySelector(".tf-chevron");
      if (chevron) {
        chevron.innerHTML = iconHtml(open ? "ChevronRight" : "ChevronDown", "tf-icon");
      }
    });
    return section;
  }
  function escapeHtml2(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml2(str).replace(/'/g, "&#39;");
  }
  async function renderSidebar() {
    const existing = document.getElementById(SECTION_ID);
    const openFolders = new Set(
      [...existing?.querySelectorAll('.tf-folder[data-open="true"]') || []].map(
        (el) => el.dataset.folderId
      )
    );
    const library = await getLibrary();
    const next = buildSection(library);
    for (const id of openFolders) {
      const folder = next.querySelector(`.tf-folder[data-folder-id="${id}"]`);
      if (folder) {
        folder.setAttribute("data-open", "true");
        const toggle = folder.querySelector(".tf-folder-toggle");
        const chevron = folder.querySelector(".tf-chevron");
        if (toggle) toggle.setAttribute("aria-expanded", "true");
        if (chevron) chevron.innerHTML = iconHtml("ChevronDown", "tf-icon");
      }
    }
    if (existing) {
      existing.replaceWith(next);
      return;
    }
    const anchor = findSubscriptionsAnchor();
    if (!anchor) return;
    if (anchor.matches?.("ytd-guide-section-renderer, yt-guide-section-renderer")) {
      anchor.parentElement?.insertBefore(next, anchor);
    } else if (anchor.parentElement) {
      anchor.parentElement.insertBefore(next, anchor);
    } else {
      anchor.prepend?.(next);
    }
  }
  function startSidebar() {
    renderSidebar();
    onLibraryChange(() => renderSidebar());
  }

  // src/lib/youtube.js
  function parseChannelFromHref(href) {
    if (!href) return null;
    try {
      const url = new URL(href, "https://www.youtube.com");
      const path = url.pathname;
      let m = path.match(/^\/channel\/(UC[\w-]+)/i);
      if (m) return { id: m[1], handle: "", url: url.pathname };
      m = path.match(/^\/@([\w.-]+)/);
      if (m) return { id: `@${m[1]}`, handle: `@${m[1]}`, url: url.pathname };
      m = path.match(/^\/c\/([\w.-]+)/);
      if (m) return { id: `c/${m[1]}`, handle: m[1], url: url.pathname };
      m = path.match(/^\/user\/([\w.-]+)/);
      if (m) return { id: `user/${m[1]}`, handle: m[1], url: url.pathname };
    } catch {
      return null;
    }
    return null;
  }
  function extractChannelFromGuideItem(el) {
    const link = el.querySelector("a#endpoint") || el.querySelector("a.yt-simple-endpoint") || el.closest("a") || el.querySelector("a");
    if (!link) return null;
    const href = link.getAttribute("href") || "";
    const parsed = parseChannelFromHref(href);
    if (!parsed) return null;
    const titleEl = el.querySelector("#guide-entry-title") || el.querySelector(".title") || el.querySelector("yt-formatted-string") || link;
    const name = (titleEl?.textContent || "").trim() || parsed.handle || "Channel";
    const img = el.querySelector("img");
    const avatarUrl = img?.src || img?.getAttribute("src") || "";
    return {
      id: parsed.id,
      name,
      handle: parsed.handle || "",
      avatarUrl,
      href: href.startsWith("http") ? href : `https://www.youtube.com${href}`
    };
  }
  function findUcIdInPage() {
    const candidates = [
      document.querySelector('link[itemprop="url"]')?.href,
      document.querySelector('meta[itemprop="channelId"]')?.content,
      document.querySelector('meta[property="og:url"]')?.content,
      ...[...document.querySelectorAll('a[href*="/channel/UC"]')].map((a) => a.href)
    ].filter(Boolean);
    for (const value of candidates) {
      const m = String(value).match(/\/channel\/(UC[\w-]+)/i) || String(value).match(/^(UC[\w-]+)$/);
      if (m) return m[1];
    }
    const html = document.documentElement?.innerHTML?.slice(0, 5e5) || "";
    const browse = html.match(/"browseId"\s*:\s*"(UC[\w-]+)"/);
    if (browse) return browse[1];
    const channelId = html.match(/"channelId"\s*:\s*"(UC[\w-]+)"/);
    if (channelId) return channelId[1];
    return null;
  }
  function extractChannelFromPage() {
    const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
    const parsed = parseChannelFromHref(canonical) || parseChannelFromHref(location.href);
    if (!parsed) return null;
    const ucId = findUcIdInPage();
    const id = ucId || parsed.id;
    const handle = parsed.handle || (parsed.id.startsWith("@") ? parsed.id : "") || "";
    const name = document.querySelector('meta[property="og:title"]')?.content || document.querySelector("#channel-name yt-formatted-string")?.textContent || document.querySelector("ytd-channel-name yt-formatted-string")?.textContent || document.querySelector("#page-header h1")?.textContent || handle || "Channel";
    const avatarUrl = document.querySelector('meta[property="og:image"]')?.content || document.querySelector("#avatar img")?.src || document.querySelector("yt-page-header-renderer img")?.src || "";
    return {
      id,
      name: name.trim(),
      handle,
      avatarUrl,
      href: ucId ? `https://www.youtube.com/channel/${ucId}` : canonical
    };
  }
  function isChannelPage() {
    const p = location.pathname;
    return /^\/@[\w.-]+/.test(p) || /^\/channel\/UC[\w-]+/i.test(p) || /^\/c\/[\w.-]+/.test(p) || /^\/user\/[\w.-]+/.test(p);
  }

  // src/content/highlight.js
  function guideEntries() {
    return [
      ...document.querySelectorAll(
        "ytd-guide-entry-renderer, yt-guide-entry-renderer"
      )
    ];
  }
  function isInsideTubeFolders(el) {
    return Boolean(el.closest("#tf-sidebar-section"));
  }
  function buildAliasIndex(library) {
    const filed = getFiledChannelIds(library);
    const aliases = new Set(filed);
    for (const [id, meta] of Object.entries(library.channels || {})) {
      if (!filed.has(id)) continue;
      aliases.add(id);
      if (meta?.handle) {
        aliases.add(meta.handle);
        aliases.add(meta.handle.replace(/^@/, ""));
        aliases.add(`@${meta.handle.replace(/^@/, "")}`);
      }
      if (meta?.name) aliases.add(meta.name.toLowerCase());
    }
    return aliases;
  }
  function isChannelFiled(channel, aliases) {
    if (!channel) return false;
    if (aliases.has(channel.id)) return true;
    if (channel.handle && aliases.has(channel.handle)) return true;
    if (channel.handle && aliases.has(channel.handle.replace(/^@/, ""))) return true;
    if (channel.name && aliases.has(channel.name.toLowerCase())) return true;
    return false;
  }
  async function highlightSubscriptions() {
    const library = await getLibrary();
    const aliases = buildAliasIndex(library);
    for (const entry of guideEntries()) {
      if (isInsideTubeFolders(entry)) continue;
      const channel = extractChannelFromGuideItem(entry);
      if (!channel) {
        entry.classList.remove("tf-filed", "tf-unfiled");
        continue;
      }
      const isFiled = isChannelFiled(channel, aliases);
      entry.classList.toggle("tf-filed", isFiled);
      entry.classList.toggle("tf-unfiled", !isFiled);
      entry.dataset.tfChannelId = channel.id;
    }
  }
  function startHighlight() {
    highlightSubscriptions();
    onLibraryChange(() => highlightSubscriptions());
  }

  // src/content/channel-page.js
  var PANEL_ID = "tf-channel-panel";
  function removePanel() {
    document.getElementById(PANEL_ID)?.remove();
  }
  function requestSync() {
    try {
      chrome.runtime.sendMessage({ type: "tf-sync" }, () => void chrome.runtime.lastError);
    } catch {
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
    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "tf-root";
    panel.innerHTML = `
    <h3>Add to folders</h3>
    <div class="tf-channel-meta">${escapeHtml3(channel.name)}</div>
    <div class="tf-check-list">
      ${folders.length ? folders.map(
      (folder) => `
        <label>
          <input type="checkbox" value="${folder.id}" ${membership.has(folder.id) ? "checked" : ""} />
          ${iconHtml(folder.icon || "Folder", "tf-icon")}
          <span>${escapeHtml3(folder.name)}</span>
        </label>`
    ).join("") : `<div class="tf-sidebar-empty">Create a folder in the extension popup first.</div>`}
    </div>
    <div class="tf-panel-actions">
      <button type="button" class="tf-save">Save</button>
      <button type="button" class="tf-close">${iconHtml("X", "tf-icon")}</button>
    </div>
  `;
    panel.querySelector(".tf-close").addEventListener("click", removePanel);
    panel.querySelector(".tf-save").addEventListener("click", async () => {
      const ids = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(
        (el) => el.value
      );
      await setChannelFolders(channel, ids);
      requestSync();
      const saveBtn = panel.querySelector(".tf-save");
      saveBtn.textContent = "Saved";
      setTimeout(() => {
        saveBtn.textContent = "Save";
      }, 1200);
    });
    document.documentElement.appendChild(panel);
  }
  function escapeHtml3(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function startChannelPanel() {
    renderPanel();
    onLibraryChange(() => {
      if (document.getElementById(PANEL_ID)) renderPanel();
    });
  }

  // src/content/main.js
  var FONT_URL = chrome.runtime.getURL("assets/fonts/Outfit-Variable.ttf");
  function ensureFont() {
    if (document.getElementById("tf-font-style")) return;
    const style = document.createElement("style");
    style.id = "tf-font-style";
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
    ensureFont();
    renderSidebar();
    highlightSubscriptions();
    renderPanel();
  }
  function observeSpa() {
    document.addEventListener("yt-navigate-finish", () => {
      setTimeout(refreshAll, 300);
    });
    let timer = null;
    const obs = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!document.getElementById("tf-sidebar-section")) {
          renderSidebar();
        }
        highlightSubscriptions();
      }, 400);
    });
    const start = () => {
      const root = document.querySelector("#content, ytd-app, body") || document.documentElement;
      obs.observe(root, { childList: true, subtree: true });
    };
    if (document.body) start();
    else document.addEventListener("DOMContentLoaded", start, { once: true });
  }
  ensureFont();
  startSidebar();
  startHighlight();
  startChannelPanel();
  observeSpa();
  setTimeout(refreshAll, 1e3);
  setTimeout(refreshAll, 3e3);
})();
//# sourceMappingURL=content.js.map

import { icons } from 'lucide';

function attrsToString(attrs = {}) {
  return Object.entries(attrs)
    .filter(([key]) => key !== 'key')
    .map(([key, value]) => {
      const name = key === 'strokeWidth' ? 'stroke-width' : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${name}="${String(value).replace(/"/g, '&quot;')}"`;
    })
    .join(' ');
}

function nodeToSvg(node) {
  if (!Array.isArray(node)) return '';
  const [tag, attrs, children] = node;
  const childHtml = Array.isArray(children)
    ? children.map(nodeToSvg).join('')
    : '';
  const a = attrsToString(attrs);
  return `<${tag}${a ? ` ${a}` : ''}>${childHtml}</${tag}>`;
}

/** All Lucide icon names (PascalCase). */
export const ALL_ICON_NAMES = Object.keys(icons).sort();

export const FOLDER_ICON_NAMES = ALL_ICON_NAMES;

export const FOLDER_COLORS = [
  '#e11d2e',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#eab308',
  '#64748b',
  '#f5f5f5',
  '#ffffff',
];

export function getIconSvg(name) {
  const iconNode = icons[name] || icons.Folder;
  const inner = Array.isArray(iconNode)
    ? iconNode.map(nodeToSvg).join('')
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

export function iconHtml(name, className = 'tf-icon') {
  const raw = getIconSvg(name);
  return raw.replace('<svg ', `<svg class="${className}" aria-hidden="true" `);
}

export function searchIcons(query, limit = 72) {
  const q = (query || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!q) {
    // Popular defaults first when empty
    const preferred = [
      'Folder',
      'Gamepad2',
      'Music',
      'Newspaper',
      'GraduationCap',
      'Cpu',
      'Clapperboard',
      'Dumbbell',
      'Utensils',
      'Plane',
      'Briefcase',
      'Heart',
      'Code2',
      'Mic',
      'Camera',
      'Globe',
      'Star',
      'Zap',
      'BookOpen',
      'Car',
      'Radio',
      'Wrench',
      'Baby',
      'Landmark',
    ].filter((n) => icons[n]);
    const rest = ALL_ICON_NAMES.filter((n) => !preferred.includes(n));
    return [...preferred, ...rest].slice(0, limit);
  }
  const scored = [];
  for (const name of ALL_ICON_NAMES) {
    const key = name.toLowerCase();
    if (key === q) scored.push({ name, score: 0 });
    else if (key.startsWith(q)) scored.push({ name, score: 1 });
    else if (key.includes(q)) scored.push({ name, score: 2 });
  }
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((s) => s.name);
}

export function renderIconPickerHtml({
  selectedIcon = 'Folder',
  query = '',
  searchAttr = 'data-role="icon-search"',
  gridAttr = 'data-role="icon-grid"',
}) {
  const names = searchIcons(query);
  return `
    <input class="tf-mgr-input tf-icon-search" ${searchAttr} type="search" placeholder="Search Lucide icons…" value="${String(
      query
    ).replace(/"/g, '&quot;')}" />
    <div class="tf-mgr-icons" ${gridAttr}>
      ${names
        .map(
          (name) => `
        <button type="button" class="tf-mgr-icon" data-icon="${name}" aria-selected="${
          name === selectedIcon
        }" title="${name}">
          ${iconHtml(name, 'tf-icon')}
        </button>`
        )
        .join('')}
    </div>
    <div class="tf-icon-selected-label">Selected: <strong>${selectedIcon}</strong></div>
  `;
}

export function renderColorPickerHtml(selectedColor = '#e11d2e') {
  return `
    <div class="tf-color-row" data-role="color-row">
      ${FOLDER_COLORS.map(
        (color) => `
        <button type="button" class="tf-color-swatch" data-color="${color}" aria-selected="${
          color.toLowerCase() === selectedColor.toLowerCase()
        }" style="background:${color}" title="${color}"></button>`
      ).join('')}
      <input type="color" class="tf-color-custom" data-role="color-custom" value="${selectedColor}" title="Custom color" />
    </div>
  `;
}

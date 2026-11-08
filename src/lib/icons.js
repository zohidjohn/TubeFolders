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
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#a3a3a3',
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
  selectedColor = '#e11d2e',
  searchAttr = 'data-role="icon-search"',
  gridAttr = 'data-role="icon-grid"',
  labelAttr = 'data-role="icon-label"',
}) {
  const names = searchIcons(query);
  const q = String(query || '').replace(/"/g, '&quot;');
  return `
    <div class="tf-icon-picker">
      <div class="tf-field-label-row">
        <span class="tf-field-label">Icon</span>
        <span class="tf-icon-selected-label" ${labelAttr}>${selectedIcon}</span>
      </div>
      <input class="tf-mgr-input tf-icon-search" ${searchAttr} type="search" placeholder="Search Lucide icons…" value="${q}" aria-label="Search icons" />
      <div class="tf-mgr-icons" ${gridAttr} role="listbox" aria-label="Icons">
        ${names
          .map(
            (name) => `
          <button type="button" class="tf-mgr-icon" data-icon="${name}" role="option" aria-selected="${
            name === selectedIcon
          }" title="${name}" style="${
            name === selectedIcon ? `color:${selectedColor};border-color:${selectedColor}` : ''
          }">
            ${iconHtml(name, 'tf-icon')}
          </button>`
          )
          .join('')}
      </div>
    </div>
  `;
}

export function renderColorPickerHtml(selectedColor = '#e11d2e', { customAttr = 'data-role="color-custom"' } = {}) {
  const selected = selectedColor.toLowerCase();
  const isPreset = FOLDER_COLORS.some((c) => c.toLowerCase() === selected);
  return `
    <div class="tf-color-row" data-role="color-row" role="listbox" aria-label="Folder color">
      ${FOLDER_COLORS.map(
        (color) => `
        <button type="button" class="tf-color-swatch" data-color="${color}" role="option" aria-label="${color}" aria-selected="${
          color.toLowerCase() === selected
        }" style="background:${color}" title="${color}"></button>`
      ).join('')}
      <label class="tf-color-custom-wrap" title="Custom color">
        <input type="color" class="tf-color-custom" ${customAttr} value="${selectedColor}" aria-label="Custom color" aria-selected="${
          isPreset ? 'false' : 'true'
        }" />
      </label>
    </div>
  `;
}

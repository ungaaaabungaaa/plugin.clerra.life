import './popup.css';
import { loadSettings } from '../lib/settings';
import type { ClerraSettings } from '../lib/types';
import { TAB_ICONS, type InlineIcon } from './tab-icons';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root not found.');
}

const appRoot = app;

let draftSettings: ClerraSettings;

type PopupTabId = 'music' | 'theme' | 'settings';

type PopupTab = {
  id: PopupTabId;
  label: string;
  icon: InlineIcon;
};

let activeTab: PopupTabId = 'music';

const POPUP_TABS: PopupTab[] = [
  {
    id: 'music',
    label: 'Music tab',
    icon: TAB_ICONS.music
  },
  {
    id: 'theme',
    label: 'Theme tab',
    icon: TAB_ICONS.theme
  },
  {
    id: 'settings',
    label: 'Setting tab',
    icon: TAB_ICONS.settings
  }
];

function iconMarkup(icon: InlineIcon): string {
  return `
    <svg
      class="popup-tab__icon"
      viewBox="0 0 ${icon.width} ${icon.height}"
      aria-hidden="true"
      focusable="false"
    >
      ${icon.body}
    </svg>
  `;
}

function render(): void {
  appRoot.innerHTML = `
    <div class="popup-shell">
      <div class="popup-panel">
        <div class="popup-tab-rail" role="tablist" aria-label="Popup tabs">
          ${POPUP_TABS.map((tab) => `
            <button
              type="button"
              class="popup-tab ${tab.id === activeTab ? 'is-active' : ''}"
              data-tab-id="${tab.id}"
              role="tab"
              aria-label="${tab.label}"
              aria-selected="${tab.id === activeTab}"
              title="${tab.label}"
            >
              ${iconMarkup(tab.icon)}
            </button>
          `).join('')}
        </div>

        <div aria-hidden="true" class="popup-pill"></div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-tab-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTab = button.dataset.tabId as PopupTabId | undefined;

      if (!nextTab || nextTab === activeTab) {
        return;
      }

      activeTab = nextTab;
      render();
    });
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!draftSettings) {
    return;
  }

  if (areaName !== 'local') {
    return;
  }

  draftSettings = {
    ...draftSettings,
    ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
  };
  render();
});

void (async () => {
  draftSettings = await loadSettings();
  render();
})();

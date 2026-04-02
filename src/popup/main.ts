import './popup.css';
import { ACCENTS, getAccentById, getThemeById, THEMES } from '../lib/themes';
import { loadSettings, normalizeSettings } from '../lib/settings';
import type { ClerraSettings } from '../lib/types';
import { TAB_ICONS, type InlineIcon } from './tab-icons';
import type { RuntimeResponse, UpdateSettingsResponse, ValidateGeminiApiKeyResponse } from '../lib/messages';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root not found.');
}

const appRoot = app;
const GEMINI_HELP_URL = 'https://ai.google.dev/aistudio';

let draftSettings: ClerraSettings;
let pendingApiKey = '';
let apiKeyError = '';
let validatingApiKey = false;
let settingsSaveVersion = 0;

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

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '•'.repeat(apiKey.length);
  }

  return `${apiKey.slice(0, 4)}${'•'.repeat(Math.max(apiKey.length - 8, 4))}${apiKey.slice(-4)}`;
}

function sendMessage<T>(message: unknown): Promise<RuntimeResponse<T>> {
  return chrome.runtime.sendMessage(message) as Promise<RuntimeResponse<T>>;
}

function currentThemeIndex(): number {
  const index = THEMES.findIndex((theme) => theme.id === draftSettings.themeId);
  return index === -1 ? 0 : index;
}

async function saveDraftSettings(patch: Partial<ClerraSettings>): Promise<void> {
  const nextVersion = settingsSaveVersion + 1;
  settingsSaveVersion = nextVersion;
  draftSettings = { ...draftSettings, ...patch };
  render();

  const response = await sendMessage<UpdateSettingsResponse>({
    type: 'clerra/updateSettings',
    payload: patch
  });

  if (nextVersion !== settingsSaveVersion) {
    return;
  }

  if (!response.ok) {
    apiKeyError = response.error;
    render();
    return;
  }

  draftSettings = response.data.settings;
  apiKeyError = '';
  render();
}

function renderThemeView(): string {
  const selectedTheme = getThemeById(draftSettings.themeId);
  const selectedAccent = getAccentById(draftSettings.accentId);
  const themeIndex = currentThemeIndex();
  const previousTheme = THEMES[(themeIndex - 1 + THEMES.length) % THEMES.length];
  const nextTheme = THEMES[(themeIndex + 1) % THEMES.length];

  return `
    <div class="theme-view">
      <div
        class="theme-screen"
        style="background:${selectedTheme.gradient};--theme-accent:${selectedAccent.color};"
      >
        <div class="theme-screen__grain"></div>
        <div class="theme-swatches" aria-label="Accent colors">
          ${ACCENTS.map((accent) => `
            <button
              type="button"
              class="theme-dot ${accent.id === draftSettings.accentId ? 'is-active' : ''}"
              data-accent-id="${accent.id}"
              title="${accent.name}"
              aria-label="${accent.name}"
              style="--swatch-color:${accent.color}"
            ></button>
          `).join('')}
        </div>
        <div class="theme-nav">
          <button
            type="button"
            class="theme-nav__button"
            data-theme-id="${previousTheme.id}"
            aria-label="Previous gradient"
            title="Previous gradient"
          >‹</button>
          <button
            type="button"
            class="theme-nav__button"
            data-theme-id="${nextTheme.id}"
            aria-label="Next gradient"
            title="Next gradient"
          >›</button>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsView(): string {
  const hasStoredKey = Boolean(draftSettings.geminiApiKey);
  const inputValue = hasStoredKey ? maskApiKey(draftSettings.geminiApiKey) : pendingApiKey;
  const titleMarkup = hasStoredKey ? '' : '<h1 class="settings-title">Add Gemini API Key</h1>';
  const helperMarkup = hasStoredKey
    ? '<button type="button" class="settings-help settings-help--button" id="removeApiKey">Remove key</button>'
    : apiKeyError
      ? `<p class="settings-help settings-help--error">${escapeAttribute(apiKeyError)}</p>`
      : `<a class="settings-help" href="${GEMINI_HELP_URL}" target="_blank" rel="noreferrer">Need Help ?</a>`;

  return `
    <div class="settings-view">
      ${titleMarkup}
      <form class="settings-form" id="settingsKeyForm">
        <label class="settings-input-shell" for="geminiApiKeyInput">
          ${iconMarkup(TAB_ICONS.key)}
          <input
            id="geminiApiKeyInput"
            class="settings-input"
            type="${hasStoredKey ? 'text' : 'password'}"
            value="${escapeAttribute(inputValue)}"
            ${hasStoredKey ? 'readonly disabled' : ''}
            autocomplete="off"
            spellcheck="false"
          />
          ${hasStoredKey ? '' : `
            <button type="submit" class="settings-submit" aria-label="Submit API key">
              ${iconMarkup(TAB_ICONS.arrow)}
            </button>
          `}
        </label>
      </form>
      ${helperMarkup}
    </div>
  `;
}

function renderPanelContent(): string {
  if (activeTab === 'theme') {
    return renderThemeView();
  }

  if (activeTab === 'settings') {
    return renderSettingsView();
  }

  return '';
}

function renderBottomPill(): string {
  return `
    <div class="popup-pill">
      <div class="popup-pill__icon" aria-hidden="true">
        ${iconMarkup(TAB_ICONS.peace)}
      </div>
      <label class="popup-pill__slider" for="popupModeSlider">
        <input
          id="popupModeSlider"
          class="popup-pill__range"
          type="range"
          min="0"
          max="100"
          step="1"
          value="18"
          aria-label="Popup mode slider"
        />
      </label>
      <div class="popup-pill__icon popup-pill__icon--lab" aria-hidden="true">
        ${iconMarkup(TAB_ICONS.lab)}
      </div>
    </div>
  `;
}

function render(): void {
  const selectedAccent = getAccentById(draftSettings?.accentId ?? 'ocean');
  const showPill = activeTab !== 'settings';

  appRoot.innerHTML = `
    <div class="popup-shell">
      <div class="popup-panel" style="--popup-accent:${selectedAccent.color}">
        ${renderPanelContent()}
        ${showPill ? renderBottomPill() : ''}
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
      </div>
    </div>
  `;

  bindEvents();
}

async function validateAndSaveApiKey(input: HTMLInputElement): Promise<void> {
  if (draftSettings.geminiApiKey || validatingApiKey) {
    return;
  }

  const apiKey = input.value.trim();
  pendingApiKey = apiKey;

  if (!apiKey) {
    apiKeyError = '';
    return;
  }

  validatingApiKey = true;
  input.disabled = true;

  const validation = await sendMessage<ValidateGeminiApiKeyResponse>({
    type: 'clerra/validateGeminiApiKey',
    payload: { apiKey }
  });

  if (!validation.ok) {
    validatingApiKey = false;
    input.disabled = false;
    apiKeyError = validation.error;
    render();
    return;
  }

  const response = await sendMessage<UpdateSettingsResponse>({
    type: 'clerra/updateSettings',
    payload: { geminiApiKey: apiKey }
  });

  validatingApiKey = false;

  if (!response.ok) {
    input.disabled = false;
    apiKeyError = response.error;
    render();
    return;
  }

  draftSettings = response.data.settings;
  pendingApiKey = '';
  apiKeyError = '';
  render();
}

async function removeApiKey(): Promise<void> {
  const response = await sendMessage<UpdateSettingsResponse>({
    type: 'clerra/updateSettings',
    payload: { geminiApiKey: '' }
  });

  if (!response.ok) {
    apiKeyError = response.error;
    render();
    return;
  }

  draftSettings = response.data.settings;
  pendingApiKey = '';
  apiKeyError = '';
  render();
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

  document.querySelector<HTMLElement>('.theme-view')?.addEventListener('click', (event) => {
    const accentTarget = (event.target as HTMLElement).closest<HTMLElement>('[data-accent-id]');

    if (accentTarget) {
      const accentId = accentTarget.dataset.accentId;

      if (accentId && accentId !== draftSettings.accentId) {
        void saveDraftSettings({ accentId });
      }

      return;
    }

    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-theme-id]');

    if (!target) {
      return;
    }

    const themeId = target.dataset.themeId;
    if (themeId && themeId !== draftSettings.themeId) {
      void saveDraftSettings({ themeId });
    }
  });

  const apiKeyInput = document.querySelector<HTMLInputElement>('#geminiApiKeyInput');

  if (apiKeyInput && !draftSettings.geminiApiKey) {
    apiKeyInput.addEventListener('input', () => {
      pendingApiKey = apiKeyInput.value;
      if (apiKeyError) {
        apiKeyError = '';
        render();
      }
    });

    apiKeyInput.addEventListener('blur', () => {
      void validateAndSaveApiKey(apiKeyInput);
    });

    document.querySelector<HTMLFormElement>('#settingsKeyForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      void validateAndSaveApiKey(apiKeyInput);
    });
  }

  document.querySelector<HTMLButtonElement>('#removeApiKey')?.addEventListener('click', () => {
    void removeApiKey();
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
    ...normalizeSettings({
      ...draftSettings,
      ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
    })
  };
  render();
});

void (async () => {
  draftSettings = await loadSettings();
  render();
})();

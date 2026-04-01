import './popup.css';
import { loadSettings } from '../lib/settings';
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

function renderSettingsView(): string {
  const hasStoredKey = Boolean(draftSettings.geminiApiKey);
  const inputValue = hasStoredKey ? maskApiKey(draftSettings.geminiApiKey) : pendingApiKey;
  const titleMarkup = hasStoredKey ? '' : '<h1 class="settings-title">Add Your Gemini API Key</h1>';
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
  if (activeTab === 'settings') {
    return renderSettingsView();
  }

  return '<div aria-hidden="true" class="popup-pill"></div>';
}

function render(): void {
  appRoot.innerHTML = `
    <div class="popup-shell">
      <div class="popup-panel">
        ${renderPanelContent()}
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
    ...draftSettings,
    ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
  };
  render();
});

void (async () => {
  draftSettings = await loadSettings();
  render();
})();

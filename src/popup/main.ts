import './popup.css';
import { getThemeById, ACCENTS, THEMES } from '../lib/themes';
import { loadSettings } from '../lib/settings';
import type { ClerraSettings } from '../lib/types';
import type { RuntimeResponse, ToggleOverlayResponse, UpdateSettingsResponse } from '../lib/messages';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root not found.');
}

const appRoot = app;

let draftSettings: ClerraSettings;
let statusMessage = '';

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function themeMarkup(themeId: string): string {
  return THEMES.map((theme) => `
    <button
      type="button"
      class="theme-chip ${theme.id === themeId ? 'is-active' : ''}"
      data-theme-id="${theme.id}"
      title="${theme.name}"
      style="background:${theme.gradient}"
    ></button>
  `).join('');
}

function accentMarkup(accentId: string): string {
  return ACCENTS.map((accent) => `
    <button
      type="button"
      class="accent-chip ${accent.id === accentId ? 'is-active' : ''}"
      data-accent-id="${accent.id}"
      title="${accent.name}"
      style="background:${accent.color}"
    ></button>
  `).join('');
}

function render(): void {
  const theme = getThemeById(draftSettings.themeId);

  appRoot.innerHTML = `
    <div class="bg-[#5ea6cf] p-[14px]">
      <div class="h-[218px] w-[304px] rounded-[28px] bg-[#5ea6cf]">
        <div class="flex h-full items-end justify-center px-[4%] pb-[4.5%]">
          <div
            aria-hidden="true"
            class="h-[21.1%] w-[65%] rounded-full bg-black"
          ></div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

async function sendMessage<T>(message: unknown): Promise<RuntimeResponse<T>> {
  return chrome.runtime.sendMessage(message) as Promise<RuntimeResponse<T>>;
}

async function persistSettings(nextSettings: ClerraSettings): Promise<void> {
  statusMessage = 'Saving…';
  render();
  const response = await sendMessage<UpdateSettingsResponse>({ type: 'clerra/updateSettings', payload: nextSettings });

  if (!response.ok) {
    statusMessage = response.error;
    render();
    return;
  }

  draftSettings = response.data.settings;
  statusMessage = 'Saved.';
  render();
}

function readDraftFromForm(): ClerraSettings {
  const apiKey = (document.querySelector<HTMLInputElement>('#geminiApiKey')?.value ?? '').trim();
  const playlistUrl = (document.querySelector<HTMLTextAreaElement>('#playlistUrl')?.value ?? '').trim();
  const nightMode = document.querySelector<HTMLInputElement>('#nightMode')?.checked ?? false;
  const musicEnabled = document.querySelector<HTMLInputElement>('#musicEnabled')?.checked ?? false;

  return {
    ...draftSettings,
    geminiApiKey: apiKey,
    playlistUrl,
    nightMode,
    musicEnabled
  };
}

function bindEvents(): void {
  document.querySelector<HTMLButtonElement>('#saveSettings')?.addEventListener('click', async () => {
    await persistSettings(readDraftFromForm());
  });

  document.querySelector<HTMLButtonElement>('#openOverlay')?.addEventListener('click', async () => {
    await persistSettings(readDraftFromForm());
    const response = await sendMessage<ToggleOverlayResponse>({ type: 'clerra/toggleOverlay', payload: { forceOpen: true } });
    statusMessage = response.ok ? 'Overlay opened.' : response.error;
    render();
    window.close();
  });

  document.querySelector<HTMLButtonElement>('#musicToggle')?.addEventListener('click', async () => {
    draftSettings = { ...readDraftFromForm(), musicEnabled: !readDraftFromForm().musicEnabled };
    await persistSettings(draftSettings);
  });

  document.querySelector<HTMLButtonElement>('#nightToggle')?.addEventListener('click', async () => {
    draftSettings = { ...readDraftFromForm(), nightMode: !readDraftFromForm().nightMode };
    await persistSettings(draftSettings);
  });

  document.querySelector<HTMLButtonElement>('#themeFocus')?.addEventListener('click', () => {
    document.querySelector<HTMLElement>('#themeSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-theme-id]').forEach((button) => {
    button.addEventListener('click', () => {
      draftSettings = { ...readDraftFromForm(), themeId: button.dataset.themeId ?? draftSettings.themeId };
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-accent-id]').forEach((button) => {
    button.addEventListener('click', () => {
      draftSettings = { ...readDraftFromForm(), accentId: button.dataset.accentId ?? draftSettings.accentId };
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

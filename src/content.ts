import { extractPageContent } from './lib/extract';
import { type ClerraMessage, type ProcessModeResponse, type RuntimeResponse, type ToggleMusicResponse, type ToggleOverlayResponse, type UpdateSettingsResponse } from './lib/messages';
import { renderMarkdown } from './lib/markdown';
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from './lib/settings';
import { snapSliderValue } from './lib/slider';
import { ACCENTS, getAccentById, getThemeById, THEMES } from './lib/themes';
import type { ClerraSettings, PageExtraction, ProcessingMode, TransformMode } from './lib/types';

declare global {
  interface Window {
    __clerraOverlayInstance?: ClerraOverlay;
  }
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

class ClerraOverlay {
  private settings: ClerraSettings = DEFAULT_SETTINGS;
  private visible = false;
  private loading = false;
  private mode: TransformMode = 'original';
  private hasProcessed = false;
  private settingsOpen = false;
  private musicOpen = false;
  private lastError = '';
  private status = '';
  private outputMarkdown = '';
  private extraction: PageExtraction | null = null;

  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly root: HTMLDivElement;
  private readonly card: HTMLDivElement;
  private readonly badge: HTMLSpanElement;
  private readonly title: HTMLHeadingElement;
  private readonly subtitle: HTMLParagraphElement;
  private readonly panel: HTMLDivElement;
  private readonly settingsDrawer: HTMLDivElement;
  private readonly playerDrawer: HTMLDivElement;
  private readonly playerFrame: HTMLIFrameElement;
  private readonly musicButton: HTMLButtonElement;
  private readonly nightButton: HTMLButtonElement;
  private readonly settingsButton: HTMLButtonElement;
  private readonly slider: HTMLInputElement;
  private readonly sliderCaption: HTMLDivElement;

  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'clerra-shadow-host';
    this.shadow = this.host.attachShadow({ mode: 'open' });

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = chrome.runtime.getURL('overlay.css');

    this.root = document.createElement('div');
    this.root.className = 'clerra-root is-hidden';
    this.root.innerHTML = `
      <div class="clerra-backdrop" data-action="close"></div>
      <div class="clerra-shell">
        <div class="clerra-card">
          <div class="clerra-topbar">
            <div class="clerra-meta">
              <div class="clerra-badge">Clerra · <span id="clerraModeBadge">Original</span></div>
              <h2 class="clerra-title" id="clerraTitle">Read the page differently.</h2>
              <p class="clerra-subtitle" id="clerraSubtitle">Slide left to simplify, slide right to deepen.</p>
            </div>
            <button type="button" class="clerra-close" data-action="close" aria-label="Close Clerra">×</button>
          </div>

          <div class="clerra-rail">
            <button type="button" class="clerra-icon-button" id="clerraMusicButton" data-action="toggle-music" title="Toggle music">♪</button>
            <button type="button" class="clerra-icon-button" id="clerraNightButton" data-action="toggle-night" title="Toggle night mode">☾</button>
            <button type="button" class="clerra-icon-button" id="clerraSettingsButton" data-action="toggle-settings" title="Toggle settings">⬢</button>
          </div>

          <div class="clerra-body">
            <section class="clerra-panel" id="clerraPanel"></section>
            <section class="clerra-settings" id="clerraSettings"></section>
            <section class="clerra-player" id="clerraPlayer">
              <iframe class="clerra-player-frame" id="clerraPlayerFrame" title="Clerra player" src="${chrome.runtime.getURL('player.html')}"></iframe>
              <p class="clerra-player-note">If the embed stalls or the page environment gets in the way, use the fallback.</p>
              <div class="clerra-inline-actions">
                <button type="button" class="clerra-action secondary" data-action="open-playlist">Open in YouTube</button>
              </div>
            </section>
          </div>
        </div>

        <div class="clerra-slider-pill">
          <div class="clerra-slider-icon">☮</div>
          <div class="clerra-slider-shell">
            <input class="clerra-range" id="clerraSlider" type="range" min="0" max="100" step="1" value="50" aria-label="Clerra mode slider" />
            <div class="clerra-slider-caption" id="clerraSliderCaption">Original</div>
          </div>
          <div class="clerra-slider-icon">⚗</div>
        </div>
      </div>
    `;

    this.shadow.append(stylesheet, this.root);
    document.documentElement.appendChild(this.host);

    this.card = this.root.querySelector<HTMLDivElement>('.clerra-card')!;
    this.badge = this.root.querySelector<HTMLSpanElement>('#clerraModeBadge')!;
    this.title = this.root.querySelector<HTMLHeadingElement>('#clerraTitle')!;
    this.subtitle = this.root.querySelector<HTMLParagraphElement>('#clerraSubtitle')!;
    this.panel = this.root.querySelector<HTMLDivElement>('#clerraPanel')!;
    this.settingsDrawer = this.root.querySelector<HTMLDivElement>('#clerraSettings')!;
    this.playerDrawer = this.root.querySelector<HTMLDivElement>('#clerraPlayer')!;
    this.playerFrame = this.root.querySelector<HTMLIFrameElement>('#clerraPlayerFrame')!;
    this.musicButton = this.root.querySelector<HTMLButtonElement>('#clerraMusicButton')!;
    this.nightButton = this.root.querySelector<HTMLButtonElement>('#clerraNightButton')!;
    this.settingsButton = this.root.querySelector<HTMLButtonElement>('#clerraSettingsButton')!;
    this.slider = this.root.querySelector<HTMLInputElement>('#clerraSlider')!;
    this.sliderCaption = this.root.querySelector<HTMLDivElement>('#clerraSliderCaption')!;

    this.bindEvents();
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    this.settings = await loadSettings();
    this.musicOpen = this.settings.musicEnabled;
    this.applyTheme();
    this.render();
  }

  private bindEvents(): void {
    this.root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const actionTarget = target.closest<HTMLElement>('[data-action], [data-theme-id], [data-accent-id]');

      if (!actionTarget) {
        return;
      }

      const themeId = actionTarget.dataset.themeId;
      if (themeId) {
        void this.persistSettings({ ...this.readSettingsForm(), themeId });
        return;
      }

      const accentId = actionTarget.dataset.accentId;
      if (accentId) {
        void this.persistSettings({ ...this.readSettingsForm(), accentId });
        return;
      }

      const action = actionTarget.dataset.action;

      switch (action) {
        case 'close':
          this.close();
          break;
        case 'toggle-settings':
          this.settingsOpen = !this.settingsOpen;
          this.render();
          break;
        case 'toggle-night':
          void this.persistSettings({ ...this.settings, nightMode: !this.settings.nightMode });
          break;
        case 'toggle-music':
          void this.toggleMusicDrawer();
          break;
        case 'save-inline-key':
          void this.saveInlineKey();
          break;
        case 'save-settings':
          void this.persistSettings(this.readSettingsForm());
          break;
        case 'open-playlist':
          void this.openPlaylistFallback();
          break;
        default:
          break;
      }
    });

    this.slider.addEventListener('input', () => {
      const snapped = snapSliderValue(Number(this.slider.value));
      this.sliderCaption.textContent = snapped.label;
    });

    this.slider.addEventListener('change', () => {
      const snapped = snapSliderValue(Number(this.slider.value));
      this.slider.value = String(snapped.snappedValue);
      this.sliderCaption.textContent = snapped.label;
      void this.commitMode(snapped.mode);
    });

    this.playerFrame.addEventListener('load', () => {
      if (this.musicOpen) {
        this.postPlayerConfig(true);
      }
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.visible) {
        this.close();
      }
    }, true);

    window.addEventListener('message', (event) => {
      const data = event.data as { type?: string; playlistUrl?: string };
      if (data?.type === 'clerra:player-fallback') {
        void this.openPlaylistFallback(data.playlistUrl);
      }
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') {
        return;
      }

      this.settings = normalizeSettings({
        ...this.settings,
        ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
      });
      this.applyTheme();
      this.render();
      if (this.musicOpen) {
        this.postPlayerConfig(false);
      }
    });

    chrome.runtime.onMessage.addListener((message: ClerraMessage, _sender, sendResponse) => {
      if (message.type !== 'clerra/toggleOverlay') {
        return false;
      }

      const shouldOpen = message.payload?.forceOpen ?? !this.visible;

      if (shouldOpen) {
        this.open();
      } else {
        this.close();
      }

      sendResponse({ ok: true, data: { visible: this.visible } } satisfies RuntimeResponse<ToggleOverlayResponse>);
      return true;
    });
  }

  private open(): void {
    this.visible = true;
    this.lastError = '';
    this.status = '';
    this.musicOpen = this.settings.musicEnabled;
    this.applyTheme();
    this.render();
    if (this.musicOpen) {
      this.postPlayerConfig(true);
    }
  }

  private close(): void {
    this.visible = false;
    this.settingsOpen = false;
    this.musicOpen = false;
    this.render();
  }

  private applyTheme(): void {
    const theme = getThemeById(this.settings.themeId);
    const accent = getAccentById(this.settings.accentId);
    this.root.style.setProperty('--clerra-theme-gradient', theme.gradient);
    this.root.style.setProperty('--clerra-accent-color', accent.color);
  }

  private render(): void {
    const sliderState = snapSliderValue(this.mode === 'simplify' ? 0 : this.mode === 'deep' ? 100 : 50);
    const collapseToSlider = this.visible && this.mode === 'original' && this.hasProcessed && !this.settingsOpen && !this.musicOpen;

    this.root.classList.toggle('is-hidden', !this.visible);
    this.root.classList.toggle('is-open', this.visible);
    this.root.classList.toggle('is-night', this.settings.nightMode);
    this.root.classList.toggle('is-original', collapseToSlider);
    this.musicButton.classList.toggle('is-active', this.musicOpen);
    this.nightButton.classList.toggle('is-active', this.settings.nightMode);
    this.settingsButton.classList.toggle('is-active', this.settingsOpen);

    this.badge.textContent = sliderState.label;
    this.slider.value = String(sliderState.snappedValue);
    this.sliderCaption.textContent = sliderState.label;
    this.title.textContent = this.mode === 'deep' ? 'Expand the page.' : this.mode === 'simplify' ? 'Cut through the noise.' : 'Read the page differently.';
    this.subtitle.textContent = this.loading
      ? 'Working through the current page.'
      : this.extraction
        ? `${new URL(this.extraction.url).hostname} · ${this.extraction.strategy} extraction · ${this.extraction.charCount.toLocaleString()} chars`
        : 'Slide left to simplify, slide right to deepen.';

    this.panel.classList.toggle('is-empty', this.mode === 'original' && !this.hasProcessed && !this.loading && Boolean(this.settings.geminiApiKey));
    this.panel.innerHTML = this.renderPanelMarkup();
    this.settingsDrawer.classList.toggle('is-open', this.settingsOpen);
    this.playerDrawer.classList.toggle('is-open', this.musicOpen);
    this.settingsDrawer.innerHTML = this.renderSettingsMarkup();
  }

  private renderPanelMarkup(): string {
    if (!this.settings.geminiApiKey) {
      return `
        <div class="clerra-state-card">
          <h3>Add your Gemini key.</h3>
          <p>Clerra stays local until you ask it to transform the page. The key is stored in <code>chrome.storage.local</code> for this MVP.</p>
          <input class="clerra-input" id="clerraInlineKey" type="password" placeholder="AIza..." />
          <div class="clerra-actions">
            <button type="button" class="clerra-action primary" data-action="save-inline-key">Save key</button>
            <button type="button" class="clerra-action secondary" data-action="toggle-settings">More settings</button>
          </div>
        </div>
      `;
    }

    if (this.loading) {
      return `
        <div class="clerra-state-card">
          <h3>Thinking…</h3>
          <p>Gemini is processing the extracted page content. The slider only calls the model when you release it, because token budgets are not imaginary.</p>
        </div>
      `;
    }

    if (this.lastError) {
      return `
        <div class="clerra-state-card">
          <h3>Something broke.</h3>
          <p>${escapeAttribute(this.lastError)}</p>
          <div class="clerra-actions">
            <button type="button" class="clerra-action secondary" data-action="toggle-settings">Check settings</button>
          </div>
        </div>
      `;
    }

    if (this.mode === 'original' && !this.hasProcessed) {
      return `
        <div class="clerra-state-card">
          <h3>Original page is intact.</h3>
          <p>Left simplifies the readable content, right expands it. Middle gives the page back without pretending the overlay never existed.</p>
          <p class="clerra-footnote">Extraction stays page-only. Deep mode adds context inferred from the current page, not fake browsing.</p>
        </div>
      `;
    }

    if (this.mode === 'original') {
      return `
        <div class="clerra-state-card">
          <h3>Original page restored.</h3>
          <p>The transformed layer is out of the way. Move the slider again when you want Clerra back on top.</p>
        </div>
      `;
    }

    if (!this.outputMarkdown) {
      return `
        <div class="clerra-state-card">
          <h3>No transformed content yet.</h3>
          <p>Move the slider to simplify or deepen this page.</p>
        </div>
      `;
    }

    return `${renderMarkdown(this.outputMarkdown)}<p class="clerra-footnote">Generated from the current page only.</p>`;
  }

  private renderSettingsMarkup(): string {
    return `
      <div class="clerra-form-grid">
        <label class="clerra-form-label">
          <span>Gemini API Key</span>
          <input class="clerra-input" id="clerraSettingsApiKey" type="password" value="${escapeAttribute(this.settings.geminiApiKey)}" placeholder="AIza..." />
        </label>

        <label class="clerra-form-label">
          <span>Playlist URL</span>
          <textarea class="clerra-textarea" id="clerraSettingsPlaylist" placeholder="https://www.youtube.com/playlist?list=...">${escapeAttribute(this.settings.playlistUrl)}</textarea>
        </label>

        <div class="clerra-form-label">
          <span>Themes</span>
          <div class="clerra-theme-grid">
            ${THEMES.map((theme) => `
              <button
                type="button"
                class="clerra-swatch ${theme.id === this.settings.themeId ? 'is-active' : ''}"
                data-theme-id="${theme.id}"
                title="${theme.name}"
                style="background:${theme.gradient}"
              ></button>
            `).join('')}
          </div>
        </div>

        <div class="clerra-form-label">
          <span>Accent</span>
          <div class="clerra-accent-grid">
            ${ACCENTS.map((accent) => `
              <button
                type="button"
                class="clerra-accent ${accent.id === this.settings.accentId ? 'is-active' : ''}"
                data-accent-id="${accent.id}"
                title="${accent.name}"
                style="background:${accent.color}"
              ></button>
            `).join('')}
          </div>
        </div>

        <div class="clerra-toggle-row">
          <span>Night focus</span>
          <input class="clerra-toggle" id="clerraSettingsNight" type="checkbox" ${this.settings.nightMode ? 'checked' : ''} />
        </div>

        <div class="clerra-toggle-row">
          <span>Music enabled</span>
          <input class="clerra-toggle" id="clerraSettingsMusic" type="checkbox" ${this.settings.musicEnabled ? 'checked' : ''} />
        </div>

        <div class="clerra-actions">
          <button type="button" class="clerra-action primary" data-action="save-settings">Save settings</button>
        </div>
      </div>
    `;
  }

  private readSettingsForm(): ClerraSettings {
    const apiKey = (this.root.querySelector<HTMLInputElement>('#clerraSettingsApiKey')?.value ?? this.settings.geminiApiKey).trim();
    const playlistUrl = (this.root.querySelector<HTMLTextAreaElement>('#clerraSettingsPlaylist')?.value ?? this.settings.playlistUrl).trim();
    const nightMode = this.root.querySelector<HTMLInputElement>('#clerraSettingsNight')?.checked ?? this.settings.nightMode;
    const musicEnabled = this.root.querySelector<HTMLInputElement>('#clerraSettingsMusic')?.checked ?? this.settings.musicEnabled;

    return {
      ...this.settings,
      geminiApiKey: apiKey,
      playlistUrl,
      nightMode,
      musicEnabled
    };
  }

  private async saveInlineKey(): Promise<void> {
    const apiKey = (this.root.querySelector<HTMLInputElement>('#clerraInlineKey')?.value ?? '').trim();
    if (!apiKey) {
      this.lastError = 'Enter a Gemini API key first.';
      this.render();
      return;
    }

    await this.persistSettings({ ...this.settings, geminiApiKey: apiKey });
    this.settingsOpen = false;
    this.lastError = '';
    this.render();
  }

  private async persistSettings(nextSettings: ClerraSettings): Promise<void> {
    const response = await chrome.runtime.sendMessage({ type: 'clerra/updateSettings', payload: nextSettings }) as RuntimeResponse<UpdateSettingsResponse>;

    if (!response.ok) {
      this.lastError = response.error;
      this.render();
      return;
    }

    this.settings = response.data.settings;
    this.applyTheme();
    this.lastError = '';
    this.render();
    if (this.musicOpen) {
      this.postPlayerConfig(false);
    }
  }

  private async commitMode(nextMode: TransformMode): Promise<void> {
    this.mode = nextMode;
    this.lastError = '';

    if (nextMode === 'original') {
      this.loading = false;
      this.render();
      return;
    }

    if (!this.settings.geminiApiKey) {
      this.render();
      return;
    }

    this.loading = true;
    this.render();

    try {
      const page = this.getExtraction();
      if (page.charCount < 120) {
        throw new Error('This page does not expose enough readable text to transform.');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'clerra/processMode',
        payload: {
          mode: nextMode,
          page
        }
      }) as RuntimeResponse<ProcessModeResponse>;

      if (!response.ok) {
        throw new Error(response.error);
      }

      this.outputMarkdown = response.data.markdown;
      this.hasProcessed = true;
      this.lastError = '';
      this.status = response.data.cacheHit ? 'Cached' : 'Fresh';
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unable to process this page.';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private getExtraction(): PageExtraction {
    if (!this.extraction || this.extraction.url !== window.location.href) {
      this.extraction = extractPageContent(document);
    }

    return this.extraction;
  }

  private async toggleMusicDrawer(): Promise<void> {
    const nextOpen = !this.musicOpen;
    const response = await chrome.runtime.sendMessage({
      type: 'clerra/toggleMusic',
      payload: {
        enabled: nextOpen,
        playlistUrl: this.settings.playlistUrl
      }
    }) as RuntimeResponse<ToggleMusicResponse>;

    if (!response.ok) {
      this.lastError = response.error;
      this.render();
      return;
    }

    this.musicOpen = nextOpen;
    this.settings = { ...this.settings, musicEnabled: response.data.musicEnabled };
    this.lastError = '';
    this.render();
    if (this.musicOpen) {
      this.postPlayerConfig(true);
    }
  }

  private postPlayerConfig(autoplay: boolean): void {
    this.playerFrame.contentWindow?.postMessage({
      type: 'clerra:player-config',
      playlistUrl: this.settings.playlistUrl,
      autoplay
    }, '*');
  }

  private async openPlaylistFallback(playlistUrl?: string): Promise<void> {
    const response = await chrome.runtime.sendMessage({
      type: 'clerra/toggleMusic',
      payload: {
        openExternal: true,
        playlistUrl: playlistUrl || this.settings.playlistUrl
      }
    }) as RuntimeResponse<ToggleMusicResponse>;

    if (!response.ok) {
      this.lastError = response.error;
      this.render();
    }
  }
}

if (!window.__clerraOverlayInstance) {
  window.__clerraOverlayInstance = new ClerraOverlay();
}

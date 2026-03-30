import { buildCacheKey } from './lib/cache';
import { type ClerraMessage, type ProcessModeMessage, type ProcessModeResponse, type RuntimeResponse, type ToggleMusicResponse, type ToggleOverlayResponse, type UpdateSettingsResponse } from './lib/messages';
import { buildPrompt, GEMINI_MODEL } from './lib/prompts';
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings, saveSettings, SETTINGS_KEYS } from './lib/settings';
import type { PageExtraction, ProcessedContent } from './lib/types';

function success<T>(data: T): RuntimeResponse<T> {
  return { ok: true, data };
}

function failure<T>(error: unknown): RuntimeResponse<T> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}

async function ensureDefaultSettings(): Promise<void> {
  const stored = await chrome.storage.local.get(SETTINGS_KEYS);
  const merged = normalizeSettings({ ...DEFAULT_SETTINGS, ...stored });
  await chrome.storage.local.set(merged);
}

async function sendToActiveTab(message: ClerraMessage): Promise<RuntimeResponse<ToggleOverlayResponse>> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!activeTab?.id) {
    throw new Error('No active tab available.');
  }

  const response = (await chrome.tabs.sendMessage(activeTab.id, message)) as RuntimeResponse<ToggleOverlayResponse> | undefined;
  return response ?? success({ visible: false });
}

function parseApiError(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) {
    return 'Gemini request failed.';
  }

  const maybeError = payload as { error?: { message?: string } };
  return maybeError.error?.message ?? 'Gemini request failed.';
}

async function callGemini(page: PageExtraction, apiKey: string, mode: ProcessModeMessage['payload']['mode']): Promise<ProcessedContent> {
  const prompt = buildPrompt(mode, page);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: mode === 'simplify' ? 0.35 : 0.7,
          maxOutputTokens: mode === 'simplify' ? 900 : 1400
        }
      })
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  const markdown = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('').trim();

  if (!markdown) {
    throw new Error('Gemini returned an empty response.');
  }

  return {
    markdown,
    mode,
    cacheHit: false,
    model: GEMINI_MODEL
  };
}

async function processMode(message: ProcessModeMessage, tabId: number): Promise<ProcessModeResponse> {
  const settings = await loadSettings();

  if (!settings.geminiApiKey) {
    throw new Error('Add a Gemini API key before processing this page.');
  }

  const cacheKey = buildCacheKey({
    tabId,
    pageUrl: message.payload.page.url,
    contentHash: message.payload.page.hash,
    mode: message.payload.mode
  });

  const cached = await chrome.storage.session.get(cacheKey);
  const cachedResponse = cached[cacheKey] as ProcessModeResponse | undefined;

  if (cachedResponse) {
    return { ...cachedResponse, cacheHit: true };
  }

  const processed = await callGemini(message.payload.page, settings.geminiApiKey, message.payload.mode);
  await chrome.storage.session.set({ [cacheKey]: processed });
  return processed;
}

async function toggleMusic(enabled: boolean | undefined, openExternal: boolean | undefined, playlistUrl: string | undefined): Promise<ToggleMusicResponse> {
  let nextEnabled = enabled;

  if (typeof nextEnabled === 'boolean') {
    await saveSettings({ musicEnabled: nextEnabled });
  }

  if (openExternal) {
    const settings = await loadSettings();
    const targetUrl = playlistUrl || settings.playlistUrl;
    await chrome.tabs.create({ url: targetUrl });
    if (typeof nextEnabled !== 'boolean') {
      nextEnabled = settings.musicEnabled;
    }
  }

  if (typeof nextEnabled !== 'boolean') {
    const settings = await loadSettings();
    nextEnabled = settings.musicEnabled;
  }

  return { musicEnabled: nextEnabled };
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaultSettings();
});

chrome.runtime.onMessage.addListener((message: ClerraMessage, sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === 'clerra/toggleOverlay') {
        const response = sender.tab?.id
          ? success<ToggleOverlayResponse>({ visible: true })
          : await sendToActiveTab(message);
        sendResponse(response);
        return;
      }

      if (message.type === 'clerra/updateSettings') {
        const settings = await saveSettings(message.payload);
        sendResponse(success<UpdateSettingsResponse>({ settings }));
        return;
      }

      if (message.type === 'clerra/processMode') {
        if (!sender.tab?.id) {
          throw new Error('Processing requests must come from a tab.');
        }

        const processed = await processMode(message, sender.tab.id);
        sendResponse(success<ProcessModeResponse>(processed));
        return;
      }

      if (message.type === 'clerra/toggleMusic') {
        const music = await toggleMusic(message.payload.enabled, message.payload.openExternal, message.payload.playlistUrl);
        sendResponse(success<ToggleMusicResponse>(music));
        return;
      }

      sendResponse(failure('Unsupported message.'));
    } catch (error) {
      sendResponse(failure(error));
    }
  })();

  return true;
});

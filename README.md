# Clerra

Clerra is a Chrome MV3 extension that overlays an AI-shaped reading layer on top of the current page.

## Features

- Gemini-powered `simplify` and `deep` page transforms
- Middle slider state restores the untouched page
- Popup + in-page onboarding for API key and theme settings
- Readability-first content extraction with fallbacks
- Embedded YouTube playlist player with open-in-tab fallback
- Session cache keyed by tab, URL, extracted content hash, and mode

## Local setup

1. Install dependencies.
2. Run `npm run build`.
3. Open `chrome://extensions`.
4. Enable Developer Mode.
5. Load unpacked from `dist`.

## Validation

- `npm run typecheck`
- `npm run test`
- `npm run build`

## Notes

- Gemini API keys are stored in `chrome.storage.local` for MVP simplicity.
- The extension is Chrome-first and expects Chromium MV3 APIs.
- Deep mode only expands the current page; it does not browse the web.

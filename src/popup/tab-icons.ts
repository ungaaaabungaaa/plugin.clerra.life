export type InlineIcon = {
  body: string;
  width: number;
  height: number;
};

// Icon bodies sourced from Iconify:
// mage:music-fill, ic:baseline-dark-mode, icon-park-solid:setting-one, mdi:key
export const TAB_ICONS = {
  music: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M20.82 6.49v1a3 3 0 0 1-.32 1.34a3 3 0 0 1-.87 1.07a3.1 3.1 0 0 1-1.25.57q-.301.06-.61.06q-.391 0-.77-.09l-4.24-1.2v8.22a4.79 4.79 0 1 1-1.5-3.47V2.46a.6.6 0 0 1 0-.2v-.08a.76.76 0 0 1 .54-.44h.44l6.3 1.79a3 3 0 0 1 2.22 2.93z"/>'
  },
  theme: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26a5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1"/>'
  },
  settings: {
    width: 48,
    height: 48,
    body: '<defs><mask id="popup-settings-mask"><g fill="none" stroke-linejoin="round" stroke-width="4"><path fill="#fff" stroke="#fff" d="m34 41l10-17L34 7H14L4 24l10 17z"/><path fill="#000" stroke="#000" d="M24 29a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z"/></g></mask></defs><path fill="currentColor" d="M0 0h48v48H0z" mask="url(#popup-settings-mask)"/>'
  },
  key: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M7 14c-1.1 0-2-.9-2-2s.9-2 2-2s2 .9 2 2s-.9 2-2 2m5.6-4c-.8-2.3-3-4-5.6-4c-3.3 0-6 2.7-6 6s2.7 6 6 6c2.6 0 4.8-1.7 5.6-4H16v4h4v-4h3v-4z"/>'
  },
  arrow: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M12.7 17.3a1 1 0 0 1-1.4-1.4l2.6-2.6H5a1 1 0 1 1 0-2h8.9l-2.6-2.6a1 1 0 0 1 1.4-1.4l4.3 4.3a1 1 0 0 1 0 1.4z"/>'
  }
} satisfies Record<string, InlineIcon>;

export type InlineIcon = {
  body: string;
  width: number;
  height: number;
};

// Icon bodies sourced from Iconify:
// mage:music-fill, ic:baseline-dark-mode, icon-park-solid:setting-one, mdi:key,
// mdi:peace, entypo:lab-flask, mdi:chevron-left, mdi:chevron-right, mdi:play, mdi:pause
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
  },
  previous: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"/>'
  },
  next: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6z"/>'
  },
  play: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82"/>'
  },
  pause: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/>'
  },
  peace: {
    width: 24,
    height: 24,
    body: '<path fill="currentColor" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 12.41v5.52a8 8 0 0 1-3.9-1.62zm2 0l3.9 3.9a8 8 0 0 1-3.9 1.62zM4 12c0-4.03 3-7.43 7-7.93v7.52L5.69 16.9A7.9 7.9 0 0 1 4 12m14.31 4.9L13 11.59V4.07c4 .5 7 3.9 7 7.93c0 1.78-.59 3.5-1.69 4.9"/>'
  },
  lab: {
    width: 20,
    height: 20,
    body: '<path fill="currentColor" fill-rule="evenodd" d="M16.432 15C14.387 9.893 12 8.547 12 6V3h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5H8v3c0 2.547-2.387 3.893-4.432 9c-.651 1.625-2.323 4 6.432 4s7.083-2.375 6.432-4m-1.617 1.751c-.702.21-2.099.449-4.815.449s-4.113-.239-4.815-.449c-.249-.074-.346-.363-.258-.628c.22-.67.635-1.828 1.411-3.121c1.896-3.159 3.863.497 5.5.497s1.188-1.561 1.824-.497a15.4 15.4 0 0 1 1.411 3.121c.088.265-.009.553-.258.628" clip-rule="evenodd"/>'
  }
} satisfies Record<string, InlineIcon>;

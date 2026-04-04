import { buildPlaylistEmbedUrl } from '../lib/player';

const frame = document.querySelector<HTMLIFrameElement>('#playerFrame');
const stateLabel = document.querySelector<HTMLDivElement>('#playerState');
const fallbackButton = document.querySelector<HTMLButtonElement>('#fallbackButton');

if (!frame || !stateLabel || !fallbackButton) {
  throw new Error('Player frame failed to initialize.');
}

const playerFrame = frame;
const playerStateLabel = stateLabel;
const fallbackAction = fallbackButton;

let playlistUrl = 'https://www.youtube.com/playlist?list=PLDisKgcnAC4Q2r6o-2Zf6amO5Ma9wJl3v';

function updatePlayer(urlValue: string, autoplay: boolean): void {
  playlistUrl = urlValue;
  playerFrame.src = buildPlaylistEmbedUrl(urlValue, autoplay);
  playerStateLabel.textContent = autoplay ? 'Trying the in-panel player.' : 'Player loaded.';
  window.parent.postMessage({ type: 'clerra:player-ready' }, '*');
}

window.addEventListener('message', (event) => {
  const data = event.data as { type?: string; playlistUrl?: string; autoplay?: boolean };

  if (data?.type !== 'clerra:player-config') {
    return;
  }

  updatePlayer(data.playlistUrl || playlistUrl, Boolean(data.autoplay));
});

fallbackAction.addEventListener('click', () => {
  window.parent.postMessage({ type: 'clerra:player-fallback', playlistUrl }, '*');
});

updatePlayer(playlistUrl, false);

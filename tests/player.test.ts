import { describe, expect, it } from 'vitest';
import { buildPlaylistEmbedUrl, extractPlaylistId } from '../src/lib/player';

describe('player helpers', () => {
  it('extracts the playlist id from a youtube playlist url', () => {
    expect(extractPlaylistId('https://www.youtube.com/playlist?list=PL12345&si=test')).toBe('PL12345');
  });

  it('returns null for invalid playlist urls', () => {
    expect(extractPlaylistId('not-a-url')).toBeNull();
  });

  it('builds a quiet embed url by default', () => {
    expect(buildPlaylistEmbedUrl('https://www.youtube.com/playlist?list=PL12345', false)).toBe(
      'https://www.youtube-nocookie.com/embed/videoseries?rel=0&modestbranding=1&autoplay=0&list=PL12345'
    );
  });
});

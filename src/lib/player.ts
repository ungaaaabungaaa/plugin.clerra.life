export function extractPlaylistId(urlValue: string): string | null {
  try {
    const parsed = new URL(urlValue);
    return parsed.searchParams.get('list');
  } catch {
    return null;
  }
}

export function buildPlaylistEmbedUrl(urlValue: string, autoplay: boolean): string {
  const playlistId = extractPlaylistId(urlValue);
  const baseUrl = 'https://www.youtube-nocookie.com/embed/videoseries';
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    autoplay: autoplay ? '1' : '0'
  });

  if (playlistId) {
    params.set('list', playlistId);
  }

  return `${baseUrl}?${params.toString()}`;
}

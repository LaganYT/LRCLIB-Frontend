/**
 * Converts synced lyrics array to LRC format
 */
export function convertToLRCFormat(syncedLyrics: Array<{ 
  time: { minutes: number; seconds: number; ms: number }; 
  text: string 
}>): string {
  return syncedLyrics
    .map(lyric => {
      const timestamp = `[${lyric.time.minutes.toString().padStart(2, '0')}:${lyric.time.seconds.toString().padStart(2, '0')}.${lyric.time.ms.toString().padStart(3, '0')}]`;
      return `${timestamp}${lyric.text}`;
    })
    .join('\n');
}

/**
 * Builds a Musixmatch search URL
 */
export function buildMusixmatchSearchUrl(song: string, artist: string): string {
  const query = encodeURIComponent(`${song} ${artist}`);
  return `https://www.musixmatch.com/search?query=${query}`;
}

/**
 * Extracts song and artist information from a Musixmatch URL
 */
export function extractSongInfoFromUrl(url: string): { song?: string; artist?: string } {
  const urlMatch = url.match(/musixmatch\.com\/lyrics\/([^\/]+)\/([^\/]+)/);
  
  if (!urlMatch) {
    return {};
  }

  const [, artist, song] = urlMatch;
  return {
    artist: decodeURIComponent(artist.replace(/-/g, ' ')),
    song: decodeURIComponent(song.replace(/-/g, ' '))
  };
}

/**
 * Validates if a string contains valid lyrics content
 */
export function isValidLyrics(lyrics: string): boolean {
  return Boolean(lyrics && lyrics.trim().length > 0 && lyrics !== "Lyrics not found.");
}

/**
 * Formats a timestamp for display
 */
export function formatTimestamp(minutes: number, seconds: number, ms: number): string {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

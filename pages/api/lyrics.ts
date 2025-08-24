import type { NextApiRequest, NextApiResponse } from 'next';
import { LyricsClient } from '@mjba/lyrics';
import lyricsFinder from 'lyrics-finder';

interface LyricsResult {
  platform: string;
  lyrics: string;
  syncedLyrics?: string;
  url?: string;
  error?: string;
  songInfo?: {
    title?: string;
    artist?: string;
  };
}

interface ApiResponse {
  success: boolean;
  results: LyricsResult[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, results: [], error: 'Method not allowed' });
  }

  const { song, artist } = req.body;

  if (!song || !artist) {
    return res.status(400).json({ 
      success: false, 
      results: [], 
      error: 'Song and artist are required' 
    });
  }

  const results: LyricsResult[] = [];

  try {
    // Try multiple sources in parallel
    const promises = [
      fetchMusixmatchLyrics(song, artist),
      fetchGoogleLyrics(song, artist)
    ];

    const responses = await Promise.allSettled(promises);
    
    responses.forEach((response, index) => {
      const platforms = ['Musixmatch', 'Google (via lyrics-finder)'];
      if (response.status === 'fulfilled' && response.value) {
        results.push(response.value);
      } else {
        results.push({
          platform: platforms[index],
          lyrics: '',
          error: 'Failed to fetch lyrics'
        });
      }
    });

    const successfulResults = results.filter(r => r.lyrics && !r.error);
    
    res.status(200).json({
      success: successfulResults.length > 0,
      results: successfulResults.length > 0 ? successfulResults : results
    });

  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({
      success: false,
      results: [],
      error: 'Failed to fetch lyrics from any platform'
    });
  }
}

async function fetchMusixmatchLyrics(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Disable caching for serverless environment
    const client = new LyricsClient({
      enableCache: false
    });
    const searchQuery = `${song} ${artist}`;

    // Try to get both regular and synced lyrics
    const [regularResult, syncedResult] = await Promise.allSettled([
      client.searchAndGetLyrics(searchQuery),
      client.searchAndGetSyncedLyrics(searchQuery)
    ]);

    let lyrics = '';
    let syncedLyrics = '';
    let songInfo = {};

    // Process regular lyrics result
    if (regularResult.status === 'fulfilled' && regularResult.value.success && regularResult.value.lyrics) {
      lyrics = regularResult.value.lyrics;
      songInfo = {
        title: regularResult.value.songInfo?.title,
        artist: regularResult.value.songInfo?.artist
      };
    }

    // Process synced lyrics result
    if (syncedResult.status === 'fulfilled' && syncedResult.value.success) {
      if (syncedResult.value.hasTimestamps && syncedResult.value.syncedLyrics) {
        // Convert synced lyrics to LRC format
        syncedLyrics = syncedResult.value.syncedLyrics
          .map(lyric => {
            const timestamp = `[${lyric.time.minutes.toString().padStart(2, '0')}:${lyric.time.seconds.toString().padStart(2, '0')}.${lyric.time.ms.toString().padStart(3, '0')}]`;
            return `${timestamp}${lyric.text}`;
          })
          .join('\n');
      }
      
      // Update song info if not already set
      if (!songInfo.title) {
        songInfo = {
          title: syncedResult.value.songInfo?.title,
          artist: syncedResult.value.songInfo?.artist
        };
      }
    }

    if (lyrics || syncedLyrics) {
      return {
        platform: 'Musixmatch (via @mjba/lyrics)',
        lyrics,
        syncedLyrics: syncedLyrics || undefined,
        songInfo,
        url: `https://www.musixmatch.com/search/${encodeURIComponent(song)}%20${encodeURIComponent(artist)}`
      };
    }

    return null;
  } catch (error) {
    console.error('Musixmatch fetch error:', error);
    return null;
  }
}

async function fetchGoogleLyrics(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Use lyrics-finder to search Google
    const lyrics = await lyricsFinder(artist, song);
    
    if (lyrics && lyrics !== "Lyrics not found." && lyrics.length > 100) {
      return {
        platform: 'Google (via lyrics-finder)',
        lyrics: lyrics,
        songInfo: {
          title: song,
          artist: artist
        },
        url: `https://www.google.com/search?q=${encodeURIComponent(`${song} ${artist} lyrics`)}`
      };
    }

    return null;
  } catch (error) {
    console.error('Google lyrics fetch error:', error);
    return null;
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { LyricsClient } from '@mjba/lyrics';

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
    // Disable caching entirely for serverless environments
    const client = new LyricsClient({
      enableCache: false // Disable cache to avoid filesystem issues in serverless
    });
    const searchQuery = `${song} ${artist}`;

    // Try to get both regular and synced lyrics
    const [regularResult, syncedResult] = await Promise.allSettled([
      client.searchAndGetLyrics(searchQuery),
      client.searchAndGetSyncedLyrics(searchQuery)
    ]);

    // Process regular lyrics result
    if (regularResult.status === 'fulfilled' && regularResult.value.success && regularResult.value.lyrics) {
      results.push({
        platform: 'Musixmatch (via @mjba/lyrics)',
        lyrics: regularResult.value.lyrics,
        songInfo: {
          title: regularResult.value.songInfo?.title,
          artist: regularResult.value.songInfo?.artist
        },
        url: `https://www.musixmatch.com/search/${encodeURIComponent(song)}%20${encodeURIComponent(artist)}`
      });
    } else if (regularResult.status === 'rejected') {
      results.push({
        platform: 'Musixmatch (via @mjba/lyrics)',
        lyrics: '',
        error: 'Failed to fetch regular lyrics'
      });
    }

    // Process synced lyrics result
    if (syncedResult.status === 'fulfilled' && syncedResult.value.success) {
      if (syncedResult.value.hasTimestamps && syncedResult.value.syncedLyrics) {
        // Convert synced lyrics to LRC format
        const lrcLyrics = syncedResult.value.syncedLyrics
          .map(lyric => {
            const timestamp = `[${lyric.time.minutes.toString().padStart(2, '0')}:${lyric.time.seconds.toString().padStart(2, '0')}.${lyric.time.ms.toString().padStart(3, '0')}]`;
            return `${timestamp}${lyric.text}`;
          })
          .join('\n');

        results.push({
          platform: 'Musixmatch (Synced)',
          lyrics: syncedResult.value.lyrics || '',
          syncedLyrics: lrcLyrics,
          songInfo: {
            title: syncedResult.value.songInfo?.title,
            artist: syncedResult.value.songInfo?.artist
          },
          url: `https://www.musixmatch.com/search/${encodeURIComponent(song)}%20${encodeURIComponent(artist)}`
        });
      } else if (syncedResult.value.lyrics) {
        // Fallback to regular lyrics if synced not available
        results.push({
          platform: 'Musixmatch (Fallback)',
          lyrics: syncedResult.value.lyrics,
          songInfo: {
            title: syncedResult.value.songInfo?.title,
            artist: syncedResult.value.songInfo?.artist
          },
          url: `https://www.musixmatch.com/search/${encodeURIComponent(song)}%20${encodeURIComponent(artist)}`
        });
      }
    } else if (syncedResult.status === 'rejected') {
      results.push({
        platform: 'Musixmatch (Synced)',
        lyrics: '',
        error: 'Failed to fetch synced lyrics'
      });
    }

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
      error: 'Failed to fetch lyrics from Musixmatch'
    });
  }
}
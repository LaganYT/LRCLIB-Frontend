import type { NextApiRequest, NextApiResponse } from 'next';
import { LyricsClient } from '@mjba/lyrics';

interface ExtractResponse {
  success: boolean;
  lyrics?: string;
  syncedLyrics?: string;
  songInfo?: {
    title?: string;
    artist?: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtractResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'URL is required' 
    });
  }

  try {
    // Extract song and artist from Musixmatch URL
    const urlMatch = url.match(/musixmatch\.com\/lyrics\/([^\/]+)\/([^\/]+)/);
    
    if (!urlMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Musixmatch URL format'
      });
    }

    const [, artist, song] = urlMatch;
    const decodedArtist = decodeURIComponent(artist.replace(/-/g, ' '));
    const decodedSong = decodeURIComponent(song.replace(/-/g, ' '));

    // Disable caching for serverless environment
    const client = new LyricsClient();

    // Try to get both regular and synced lyrics
    const [regularResult, syncedResult] = await Promise.allSettled([
      client.searchAndGetLyrics(`${decodedSong} ${decodedArtist}`),
      client.searchAndGetSyncedLyrics(`${decodedSong} ${decodedArtist}`)
    ]);

    let lyrics = '';
    let syncedLyrics = '';
    let songInfo: { title?: string; artist?: string } = {};

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
      res.status(200).json({
        success: true,
        lyrics,
        syncedLyrics: syncedLyrics || undefined,
        songInfo
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No lyrics found for this URL'
      });
    }

  } catch (error) {
    console.error('Error extracting lyrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract lyrics from URL'
    });
  }
}

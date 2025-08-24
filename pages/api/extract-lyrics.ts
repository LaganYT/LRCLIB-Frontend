import type { NextApiRequest, NextApiResponse } from 'next';
import { LyricsClient } from '@mjba/lyrics';
import { convertToLRCFormat, extractSongInfoFromUrl } from '../../utils/lyrics';

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
    const { song, artist } = extractSongInfoFromUrl(url);
    if (!song || !artist) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Musixmatch URL format'
      });
    }

    const result = await fetchLyricsFromMusixmatch(song, artist);
    
    if (result.lyrics || result.syncedLyrics) {
      res.status(200).json({
        success: true,
        ...result
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

/**
 * Fetches lyrics from Musixmatch using the extracted song and artist information
 */
async function fetchLyricsFromMusixmatch(song: string, artist: string): Promise<{
  lyrics: string;
  syncedLyrics: string;
  songInfo: { title?: string; artist?: string };
}> {
  const client = new LyricsClient();
  const searchQuery = `${song} ${artist}`;

  // Fetch both regular and synced lyrics in parallel
  const [regularResult, syncedResult] = await Promise.allSettled([
    client.searchAndGetLyrics(searchQuery),
    client.searchAndGetSyncedLyrics(searchQuery)
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
      syncedLyrics = convertToLRCFormat(syncedResult.value.syncedLyrics);
    }
    
    // Update song info if not already set
    if (!songInfo.title) {
      songInfo = {
        title: syncedResult.value.songInfo?.title,
        artist: syncedResult.value.songInfo?.artist
      };
    }
  }

  return { lyrics, syncedLyrics, songInfo };
}

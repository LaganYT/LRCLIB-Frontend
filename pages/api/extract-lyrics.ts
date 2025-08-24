import type { NextApiRequest, NextApiResponse } from 'next';
import { lyricsClient, LyricsResponse, SongInfo } from '@mjba/lyrics';
import { convertToLRCFormat, extractSongInfoFromUrl } from '../../utils/lyrics';

interface ExtractResponse {
  success: boolean;
  lyrics?: string;
  syncedLyrics?: string;
  songInfo?: SongInfo;
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
 * Following the package documentation patterns
 */
async function fetchLyricsFromMusixmatch(song: string, artist: string): Promise<{
  lyrics: string;
  syncedLyrics: string;
  songInfo: SongInfo | undefined;
}> {
  const searchQuery = `${song} ${artist}`;
  
  // Use the default lyricsClient instance as recommended in docs
  const result: LyricsResponse = await lyricsClient.searchAndGetSyncedLyrics(searchQuery);
  
  let lyrics = '';
  let syncedLyrics = '';
  let songInfo: SongInfo | undefined;

  if (result.success) {
    // Get song info
    if (result.songInfo) {
      songInfo = result.songInfo;
    }

    // Handle synced lyrics with timestamps
    if (result.hasTimestamps && result.syncedLyrics) {
      syncedLyrics = convertToLRCFormat(result.syncedLyrics);
      // Also set regular lyrics from synced lyrics for compatibility
      lyrics = result.syncedLyrics.map(lyric => lyric.text).join('\n');
    } else if (result.lyrics) {
      // Fallback to regular lyrics if no synced lyrics available
      lyrics = result.lyrics;
    }
  }

  return { lyrics, syncedLyrics, songInfo };
}

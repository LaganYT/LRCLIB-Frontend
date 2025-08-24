import type { NextApiRequest, NextApiResponse } from 'next';
import { lyricsClient, LyricsResponse, SongInfo } from '@mjba/lyrics';
import { LyricsResult, LyricsApiResponse } from '../../types';
import { convertToLRCFormat, buildMusixmatchSearchUrl } from '../../utils/lyrics';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LyricsApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      results: [], 
      error: 'Method not allowed' 
    });
  }

  const { song, artist } = req.body;

  if (!song || !artist) {
    return res.status(400).json({ 
      success: false, 
      results: [], 
      error: 'Song and artist are required' 
    });
  }

  try {
    const musixmatchResult = await fetchMusixmatchLyrics(song, artist);
    const results: LyricsResult[] = [];
    
    if (musixmatchResult) {
      results.push(musixmatchResult);
    } else {
      results.push({
        platform: 'Musixmatch',
        lyrics: '',
        error: 'No lyrics found'
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
      error: 'Failed to fetch lyrics'
    });
  }
}

/**
 * Fetches lyrics from Musixmatch using the @mjba/lyrics package
 * Following the package documentation patterns
 */
async function fetchMusixmatchLyrics(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    const searchQuery = `${song} ${artist}`;
    
    // Use the default lyricsClient instance as recommended in docs
    const result: LyricsResponse = await lyricsClient.searchAndGetSyncedLyrics(searchQuery);
    
    if (result.success) {
      let lyrics = '';
      let syncedLyrics = '';
      let songInfo: SongInfo | undefined;

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

      if (lyrics || syncedLyrics) {
        return {
          platform: 'Musixmatch (via @mjba/lyrics)',
          lyrics,
          syncedLyrics: syncedLyrics || undefined,
          songInfo,
          url: buildMusixmatchSearchUrl(song, artist)
        };
      }
    } else {
      console.warn('Lyrics not found:', result.error);
    }

    return null;
  } catch (error) {
    console.error('Musixmatch fetch error:', error);
    return null;
  }
}



import type { NextApiRequest, NextApiResponse } from 'next';
import { LyricsClient } from '@mjba/lyrics';
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
 */
async function fetchMusixmatchLyrics(song: string, artist: string): Promise<LyricsResult | null> {
  try {
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

    if (lyrics || syncedLyrics) {
      return {
        platform: 'Musixmatch (via @mjba/lyrics)',
        lyrics,
        syncedLyrics: syncedLyrics || undefined,
        songInfo,
        url: buildMusixmatchSearchUrl(song, artist)
      };
    }

    return null;
  } catch (error) {
    console.error('Musixmatch fetch error:', error);
    return null;
  }
}



import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getLyrics } from '@southctrl/musixmatch-lyrics';

interface LyricsResult {
  platform: string;
  lyrics: string;
  url?: string;
  error?: string;
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
    // Try multiple platforms in parallel
    const promises = [
      fetchGeniusLyrics(song, artist),
      fetchLyricsCom(song, artist),
      fetchMusixmatch(song, artist),
      fetchAZLyrics(song, artist),
      fetchLyricsOvh(song, artist)
    ];

    const responses = await Promise.allSettled(promises);
    
    responses.forEach((response, index) => {
      const platforms = ['Genius', 'Lyrics.com', 'Musixmatch', 'AZLyrics', 'Lyrics.ovh'];
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

async function fetchGeniusLyrics(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Search for the song on Genius
    const searchQuery = `${song} ${artist}`.replace(/\s+/g, '%20');
    const searchUrl = `https://genius.com/api/search/multi?q=${searchQuery}`;
    
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const hits = searchResponse.data?.response?.hits || [];
    const songHit = hits.find((hit: { type: string; result?: { url: string } }) => 
      hit.type === 'song' && 
      hit.result && 
      hit.result.url
    );

    if (!songHit) return null;

    const songUrl = songHit.result.url;
    
    // Fetch the song page
    const pageResponse = await axios.get(songUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const html = pageResponse.data;
    
    // Extract lyrics using regex patterns
    const lyricsPatterns = [
      /<div[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*lyrics[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
    ];

    let lyrics = '';
    for (const pattern of lyricsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        lyrics = match[1]
          .replace(/<[^>]*>/g, '\n')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        break;
      }
    }

    if (lyrics.length > 100) {
      return {
        platform: 'Genius',
        lyrics: lyrics,
        url: songUrl
      };
    }

    return null;
  } catch (error) {
    console.error('Genius fetch error:', error);
    return null;
  }
}

async function fetchLyricsCom(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    const searchQuery = `${song} ${artist}`.replace(/\s+/g, '+');
    const searchUrl = `https://www.lyrics.com/lyrics/${searchQuery}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const html = response.data;
    
    // Extract lyrics from lyrics.com
    const lyricsPattern = /<div[^>]*id="lyric-body-text"[^>]*>([\s\S]*?)<\/div>/gi;
    const match = html.match(lyricsPattern);
    
    if (match && match[1]) {
      const lyrics = match[1]
        .replace(/<[^>]*>/g, '\n')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (lyrics.length > 100) {
        return {
          platform: 'Lyrics.com',
          lyrics: lyrics,
          url: searchUrl
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Lyrics.com fetch error:', error);
    return null;
  }
}

async function fetchMusixmatch(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Use the @southctrl/musixmatch-lyrics package
    const lyrics = await getLyrics(song, artist);
    
    if (lyrics && lyrics.length > 100) {
      return {
        platform: 'Musixmatch',
        lyrics: lyrics,
        url: `https://www.musixmatch.com/search/${encodeURIComponent(song)}%20${encodeURIComponent(artist)}`
      };
    }

    return null;
  } catch (error) {
    console.error('Musixmatch fetch error:', error);
    return null;
  }
}

async function fetchAZLyrics(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    const searchQuery = `${song} ${artist}`.replace(/\s+/g, '+');
    const searchUrl = `https://search.azlyrics.com/search.php?q=${searchQuery}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const html = response.data;
    
    // Extract lyrics from AZLyrics
    const lyricsPattern = /<div[^>]*class="[^"]*ringtone[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const match = html.match(lyricsPattern);
    
    if (match && match[1]) {
      const lyrics = match[1]
        .replace(/<[^>]*>/g, '\n')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (lyrics.length > 100) {
        return {
          platform: 'AZLyrics',
          lyrics: lyrics,
          url: searchUrl
        };
      }
    }

    return null;
  } catch (error) {
    console.error('AZLyrics fetch error:', error);
    return null;
  }
}

async function fetchLyricsOvh(song: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Clean and encode the search parameters
    const cleanSong = song.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const cleanArtist = artist.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    
    // lyrics.ovh uses a simple API endpoint
    const searchUrl = `https://lyrics.ovh/search/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanSong)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000
    });

    // lyrics.ovh returns JSON with lyrics in the 'lyrics' field
    if (response.data && response.data.lyrics) {
      const lyrics = response.data.lyrics
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .trim();

      if (lyrics.length > 100 && lyrics !== 'Sorry, we don\'t have lyrics for this song yet.') {
        return {
          platform: 'Lyrics.ovh',
          lyrics: lyrics,
          url: searchUrl
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Lyrics.ovh fetch error:', error);
    return null;
  }
}

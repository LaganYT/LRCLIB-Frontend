// Spotify API Types
export interface SpotifyArtist {
  name: string;
  id: string;
}

export interface SpotifyAlbum {
  name: string;
  id: string;
  images?: { url: string; height: number; width: number }[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit?: boolean;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

// LRCLib API Types
export interface LRCLibSearchResult {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  syncedLyrics?: string;
  plainLyrics?: string;
}

export interface LRCLibSong {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  syncedLyrics?: string;
  plainLyrics?: string;
}

export interface LRCLibChallengeResponse {
  prefix: string;
  target: string;
}

export interface LRCLibPublishPayload {
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export interface LRCLibPublishResponse {
  message: string;
  data?: any;
}

// Lyrics API Types
export interface LyricsResult {
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

export interface LyricsApiResponse {
  success: boolean;
  results: LyricsResult[];
  error?: string;
}

// Component Props Types
export interface AppProps {
  Component: React.ComponentType<any>;
  pageProps: any;
}

export interface SearchResultsProps {
  query: string;
}

// State Types
export interface SelectedSong {
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: any;
}

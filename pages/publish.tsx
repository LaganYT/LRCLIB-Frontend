"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { SpotifyTrack, SpotifySearchResponse, SelectedSong, LRCLibSong, LRCLibSearchResult } from '../types';
import Loading from '../components/Loading';

const CLIENT_ID = '28a7d1b1ca074829b305916a96032709';
const CLIENT_SECRET = 'fa4e00f57aa443b685e7909a4e5148b6';

interface LyricLine {
  text: string;
  timeMs?: number;
}

export default function Publish() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);

  const [plainLyrics, setPlainLyrics] = useState<string>('');
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [audioDurationSec, setAudioDurationSec] = useState<number | null>(null);
  const [lrcImport, setLrcImport] = useState<string>('');
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const lineRefs = useRef<Array<HTMLLIElement | null>>([]);
  const linesContainerRef = useRef<HTMLUListElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [publishLoading, setPublishLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [publishingStep, setPublishingStep] = useState<string>('');
  const [compareOpen, setCompareOpen] = useState<boolean>(false);
  const [existingSong, setExistingSong] = useState<LRCLibSong | null>(null);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>): void => setSearchQuery(e.target.value);

  useEffect(() => {
    const fetchAccessToken = async (): Promise<void> => {
      try {
        const tokenResponse = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({ grant_type: 'client_credentials' }),
          {
            headers: {
              Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        setAccessToken(tokenResponse.data.access_token);
        setError('');
      } catch (err) {
        setError('Failed to generate access token. Please check your client ID and secret.');
      }
    };
    fetchAccessToken();
  }, []);

  // Handle URL parameters for pre-filled data
  useEffect(() => {
    if (router.isReady) {
      const { trackName, artistName, plainLyrics: urlPlainLyrics, syncedLyrics: urlSyncedLyrics } = router.query;
      
      if (trackName && artistName) {
        setSelectedSong({
          trackName: Array.isArray(trackName) ? trackName[0] : trackName,
          artistName: Array.isArray(artistName) ? artistName[0] : artistName,
          albumName: '',
          duration: 0
        });
      }
      
      if (urlPlainLyrics) {
        const lyrics = Array.isArray(urlPlainLyrics) ? urlPlainLyrics[0] : urlPlainLyrics;
        setPlainLyrics(decodeURIComponent(lyrics));
      }
      
      if (urlSyncedLyrics) {
        const syncedLyrics = Array.isArray(urlSyncedLyrics) ? urlSyncedLyrics[0] : urlSyncedLyrics;
        setLrcImport(decodeURIComponent(syncedLyrics));
      }
    }
  }, [router.isReady, router.query]);

  const searchSpotify = async (): Promise<void> => {
    if (!accessToken) {
      setError('Access token is missing. Please try again.');
      return;
    }
    try {
      setSearchLoading(true);
      setError('');
      const { data } = await axios.get<SpotifySearchResponse>('https://api.spotify.com/v1/search', {
        params: { q: searchQuery, type: 'track', limit: 10 },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSearchResults(data.tracks.items);
    } catch (err) {
      setError('Failed to search Spotify. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSong = (song: SpotifyTrack): void => {
    setSelectedSong({
      trackName: song.name,
      artistName: song.artists.map((artist) => artist.name).join(', '),
      albumName: song.album.name,
      duration: Math.round(song.duration_ms / 1000),
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  useEffect(() => {
    const lines = plainLyrics.split(/\r?\n/);
    setLyricLines((prev) => {
      const next: LyricLine[] = lines.map((text, i) => ({ text, timeMs: prev[i]?.timeMs }));
      return next;
    });
    setCurrentLineIndex(0);
  }, [plainLyrics]);

  const onAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setSuccess('');
      setError('');
      // reset times when changing audio
      setCurrentLineIndex(0);
      setCurrentTimeMs(0);
      setIsPlaying(false);
    }
  };

  const onLoadedMetadata = (): void => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      if (!isNaN(duration)) setAudioDurationSec(Math.round(duration));
    }
  };

  const onTimeUpdate = (): void => {
    if (audioRef.current) setCurrentTimeMs(audioRef.current.currentTime * 1000);
  };

  // Build a sorted list of timed lines to map current time -> active line
  const timedLineMap = useMemo(() => {
    return lyricLines
      .map((l, i) => ({ index: i, timeMs: l.timeMs }))
      .filter((x) => x.timeMs != null)
      .sort((a, b) => (a.timeMs as number) - (b.timeMs as number));
  }, [lyricLines]);

  // While playing, update the highlighted active line based on current time
  useEffect(() => {
    if (!isPlaying) return;
    if (timedLineMap.length === 0) {
      setActiveLineIndex(-1);
      return;
    }
    let active = -1;
    for (let i = 0; i < timedLineMap.length; i++) {
      if (currentTimeMs >= (timedLineMap[i].timeMs as number)) {
        active = timedLineMap[i].index;
      } else {
        break;
      }
    }
    setActiveLineIndex(active);
  }, [currentTimeMs, isPlaying, timedLineMap]);

  // Auto-scroll active line into view inside the lyrics container only
  useEffect(() => {
    if (activeLineIndex < 0) return;
    const container = linesContainerRef.current;
    const activeEl = lineRefs.current[activeLineIndex];
    if (!container || !activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const offsetWithinContainer = activeRect.top - containerRect.top;
    const targetScrollTop =
      container.scrollTop + offsetWithinContainer - container.clientHeight / 2 + activeEl.clientHeight / 2;

    container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
  }, [activeLineIndex]);

  const togglePlayPause = (): void => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const jumpTo = (ms: number): void => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, ms / 1000);
  };

  const captureTimestampForCurrentLine = (): void => {
    if (!audioRef.current) return;
    if (currentLineIndex >= lyricLines.length) return;
    const nowMs = Math.floor(audioRef.current.currentTime * 1000);
    setLyricLines((prev) => {
      const next = [...prev];
      next[currentLineIndex] = { ...next[currentLineIndex], timeMs: nowMs };
      return next;
    });
    setCurrentLineIndex((idx) => Math.min(idx + 1, lyricLines.length));
  };

  const undoLastTimestamp = (): void => {
    if (currentLineIndex <= 0) return;
    const prevIndex = currentLineIndex - 1;
    setLyricLines((prev) => {
      const next = [...prev];
      next[prevIndex] = { ...next[prevIndex], timeMs: undefined };
      return next;
    });
    setCurrentLineIndex(prevIndex);
    if (lyricLines[prevIndex]?.timeMs != null) jumpTo(lyricLines[prevIndex].timeMs!);
  };

  const clearAllTimestamps = (): void => {
    setLyricLines((prev) => prev.map((l) => ({ ...l, timeMs: undefined })));
    setCurrentLineIndex(0);
    jumpTo(0);
  };

  const formatMs = (ms?: number): string => {
    if (ms == null) return '';
    const totalMs = Math.max(0, Math.floor(ms));
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const hundredths = Math.floor((totalMs % 1000) / 10)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}.${hundredths}`;
  };

  const parseTimestamp = (value: string): number | undefined => {
    const m = value.match(/^(\d{1,2}):(\d{2})\.(\d{2})$/);
    if (!m) return undefined;
    const minutes = parseInt(m[1], 10);
    const seconds = parseInt(m[2], 10);
    const hundredths = parseInt(m[3], 10);
    if (seconds >= 60) return undefined;
    return minutes * 60 * 1000 + seconds * 1000 + hundredths * 10;
  };

  const setLineTimestamp = (index: number, value: string): void => {
    const ms = parseTimestamp(value);
    setLyricLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], timeMs: ms };
      return next;
    });
  };

  const adjustLineTimestamp = (index: number, deltaMs: number): void => {
    setLyricLines((prev) => {
      const next = [...prev];
      const baseWhenUndefined = Math.floor(currentTimeMs);
      const current = next[index]?.timeMs ?? baseWhenUndefined;
      const updated = Math.max(0, current + deltaMs);
      next[index] = { ...next[index], timeMs: updated };
      return next;
    });
  };

  const onTimestampKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number): void => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? 100 : -100; // 0.1s increments
      const current = lyricLines[index]?.timeMs ?? Math.floor(currentTimeMs);
      const updated = Math.max(0, current + delta);
      adjustLineTimestamp(index, delta);
      jumpTo(updated);
    }
  };

  const bumpCurrentLineTimestamp = (deltaMs: number): void => {
    if (currentLineIndex < 0 || currentLineIndex >= lyricLines.length) return;
    const current = lyricLines[currentLineIndex]?.timeMs ?? Math.floor(currentTimeMs);
    const updated = Math.max(0, current + deltaMs);
    setLyricLines((prev) => {
      const next = [...prev];
      next[currentLineIndex] = { ...next[currentLineIndex], timeMs: updated };
      return next;
    });
    jumpTo(updated);
  };

  // Do not include LRC header tags when publishing to LRCLIB
  const stripLrcHeaders = (lrc: string): string => {
    return lrc
      .split('\n')
      .filter((line) => !/^\s*\[(ti|ar|al|length)\s*:/i.test(line))
      .join('\n');
  };

  const parseLrcToMs = (stamp: string): number | undefined => {
    // Accept mm:ss or mm:ss.xx
    const m = stamp.match(/^(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?$/);
    if (!m) return undefined;
    const minutes = parseInt(m[1], 10);
    const seconds = parseInt(m[2], 10);
    const hundredths = m[3] ? parseInt(m[3].padEnd(2, '0'), 10) : 0;
    if (seconds >= 60) return undefined;
    return minutes * 60 * 1000 + seconds * 1000 + hundredths * 10;
  };

  const importLrc = (): void => {
    const lines = lrcImport.split(/\r?\n/);
    const imported: LyricLine[] = [];
    let headerTitle: string | undefined;
    let headerArtist: string | undefined;
    let headerAlbum: string | undefined;
    let headerLengthMs: number | undefined;

    for (const raw of lines) {
      const trimmed = raw.trim();
      const headerMatch = trimmed.match(/^\[(ti|ar|al|length)\s*:(.*)]$/i);
      if (headerMatch) {
        const tag = headerMatch[1].toLowerCase();
        const value = headerMatch[2].trim();
        if (tag === 'ti') headerTitle = value;
        else if (tag === 'ar') headerArtist = value;
        else if (tag === 'al') headerAlbum = value;
        else if (tag === 'length') {
          const ms = parseLrcToMs(value);
          if (ms != null) headerLengthMs = ms;
        }
        continue;
      }

      // Extract all timestamps, then remaining text
      const tsRegex = /\[(\d{1,2}:\d{2}(?:\.\d{1,2})?)\]/g;
      let timestamps: number[] = [];
      let lastIdx = 0;
      let m: RegExpExecArray | null;
      while ((m = tsRegex.exec(raw)) !== null) {
        const ms = parseLrcToMs(m[1]);
        if (ms != null) timestamps.push(ms);
        lastIdx = tsRegex.lastIndex;
      }
      const text = raw.slice(lastIdx);
      if (timestamps.length === 0) {
        // No timestamp on this line; keep the line as-is (even if blank)
        imported.push({ text });
      } else {
        for (const t of timestamps) {
          imported.push({ text, timeMs: t });
        }
      }
    }

    if (imported.length === 0) {
      setError('No LRC lines detected to import.');
      return;
    }

    setLyricLines(imported);
    setPlainLyrics(imported.map((l) => l.text).join('\n'));
    setCurrentLineIndex(0);

    if (!selectedSong && (headerTitle || headerArtist || headerAlbum)) {
      setSelectedSong({
        trackName: headerTitle || 'Unknown Title',
        artistName: headerArtist || 'Unknown Artist',
        albumName: headerAlbum || 'Unknown Album',
        duration: Math.round((headerLengthMs ?? 0) / 1000) || 0,
      });
    }
    if (headerLengthMs != null) setAudioDurationSec(Math.round(headerLengthMs / 1000));
    setSuccess('Imported LRC successfully. You can refine timestamps or publish.');
    setError('');
  };

  const generatedLrc = useMemo(() => {
    const header: string[] = [];
    if (selectedSong?.trackName) header.push(`[ti:${selectedSong.trackName}]`);
    if (selectedSong?.artistName) header.push(`[ar:${selectedSong.artistName}]`);
    if (selectedSong?.albumName) header.push(`[al:${selectedSong.albumName}]`);
    const len = audioDurationSec ?? selectedSong?.duration ?? null;
    if (len != null) {
      const minutes = Math.floor(len / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (len % 60).toString().padStart(2, '0');
      header.push(`[length:${minutes}:${seconds}.00]`);
    }

    const body = lyricLines
      // keep even empty or space-only lines
      .map((l) => {
        const ts = formatMs(l.timeMs ?? 0);
        const spacer = l.text.startsWith(' ') ? '' : ' ';
        return `[${ts}]${spacer}${l.text}`;
      });

    return [...header, ...body].join('\n');
  }, [lyricLines, selectedSong, audioDurationSec]);

  // LRC body for publishing: only include lines that actually have a timestamp
  const generatedLrcBody = useMemo(() => {
    const sorted = lyricLines
      .filter((l) => l.timeMs != null)
      .slice()
      .sort((a, b) => (a.timeMs as number) - (b.timeMs as number));
    return sorted
      .map((l) => {
        const spacer = l.text.startsWith(' ') ? '' : ' ';
        return `[${formatMs(l.timeMs)}]${spacer}${l.text}`;
      })
      .join('\n');
  }, [lyricLines]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();

      // Global shortcuts; skip when user is typing in inputs/textarea
      const isTyping = tag === 'input' || tag === 'textarea';

      if ((e.code === 'Space' || e.code === 'Enter') && !isTyping) {
        e.preventDefault();
        captureTimestampForCurrentLine();
        return;
      }
      if (e.code === 'Backspace' && !isTyping) {
        e.preventDefault();
        undoLastTimestamp();
        return;
      }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !isTyping) {
        e.preventDefault();
        const delta = e.key === 'ArrowUp' ? 100 : -100; // 0.1s
        bumpCurrentLineTimestamp(delta);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [captureTimestampForCurrentLine, undoLastTimestamp, bumpCurrentLineTimestamp, currentLineIndex, currentTimeMs, lyricLines.length]);

  const publishLyrics = async (overrides?: { plain?: string; synced?: string }): Promise<void> => {
    const apiEndpoint = '/api/publish';
    const duration = audioDurationSec ?? selectedSong?.duration ?? 0;
    if (!duration) {
      setError('Duration is missing. Please upload an audio file or select a song.');
      return;
    }
    if (!selectedSong) {
      setError('Please select a song from the search results.');
      return;
    }

    setPublishingStep('Preparing payload');
    const payload: Record<string, any> = {
      trackName: selectedSong.trackName,
      artistName: selectedSong.artistName,
      albumName: selectedSong.albumName,
      duration,
    };
    const chosenPlain = overrides?.plain ?? plainLyrics;
    const chosenSynced = overrides?.synced ?? generatedLrcBody;
    if (chosenPlain && chosenPlain.trim() !== '') payload.plainLyrics = chosenPlain.trim();
    if (chosenSynced && chosenSynced.trim() !== '') payload.syncedLyrics = chosenSynced.trim();

    try {
      setPublishLoading(true);
      setError('');
      setPublishingStep('Sending request to LRCLib API');
      const response = await axios.post(apiEndpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      setPublishingStep('Processing response');
      if (response.status === 201) {
        setPublishingStep('Completed successfully');
        setSuccess('Lyrics published successfully!');
      } else {
        throw new Error('Unexpected response status.');
      }
    } catch (err: any) {
      setPublishingStep('Failed');
      if (err.response) {
        setError(err.response.data?.message || 'An error occurred.');
      } else {
        setError('Failed to publish lyrics. Please try again.');
      }
    } finally {
      setPublishLoading(false);
      setTimeout(() => setPublishingStep(''), 500);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!plainLyrics) {
      setError('Enter plain lyrics before syncing.');
      return;
    }
    setError('');
    setSuccess('');
    // Pre-publish check for existing entry in LRCLIB
    if (!selectedSong) {
      await publishLyrics();
      return;
    }
    setCompareLoading(true);
    try {
      const query = `${selectedSong.trackName} ${selectedSong.artistName}`;
      const searchResp = await axios.get<LRCLibSearchResult[]>(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
      const results = searchResp.data || [];
      const match = results.find((r) =>
        r.name?.toLowerCase() === selectedSong.trackName.toLowerCase() &&
        r.artistName?.toLowerCase() === selectedSong.artistName.toLowerCase()
      ) || results[0];
      if (match) {
        const detailResp = await axios.get<LRCLibSong>(`https://lrclib.net/api/get/${match.id}`);
        setExistingSong(detailResp.data);
        setCompareOpen(true);
        return;
      }
    } catch (e) {
      // If check fails, proceed with publish
    } finally {
      setCompareLoading(false);
    }
    await publishLyrics();
  };

  return (
    <div className="container">
      <h1>Publish Lyrics</h1>
      <p>Search for a song on Spotify to autofill details.</p>
      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchQueryChange}
          onKeyDown={(e) => { if (e.key === 'Enter') searchSpotify(); }}
          placeholder="Search for a song"
          className="input"
        />
        <button 
          onClick={searchSpotify} 
          className={`button ${searchLoading ? 'loading' : ''}`}
          disabled={searchLoading || !searchQuery.trim()}
        >
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchLoading && (
        <div className="search-results">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="loading-skeleton" style={{ height: '40px', marginBottom: '10px' }} />
          ))}
        </div>
      )}
      
      {!searchLoading && searchResults.length > 0 && (
        <div className="spotify-results">
          <div className="spotify-row header">
            <div className="col index">#</div>
            <div className="col title">Title</div>
            <div className="col album">Album</div>
          </div>
          {searchResults.map((song, idx) => {
            const img = song.album.images && song.album.images.length > 0 ? song.album.images[song.album.images.length - 1].url : undefined;
            const artists = song.artists.map((a) => a.name).join(', ');
            return (
              <div key={song.id} className="spotify-row item" onClick={() => selectSong(song)}>
                <div className="col index">{idx + 1}</div>
                <div className="col title">
                  <img src={img} alt="cover" className="cover" />
                  <div className="meta">
                    <div className="track">
                      {song.name}
                      {song.explicit ? <span className="explicit">E</span> : null}
                    </div>
                    <div className="artists">{artists}</div>
                  </div>
                </div>
                <div className="col album">{song.album.name}</div>
              </div>
            );
          })}
          <style jsx>{`
            .search-bar { width: 100%; display: flex; gap: 10px; }
            .search-bar .input { flex: 1; }
            .spotify-results { margin-top: 12px; }
            .spotify-row { display: grid; grid-template-columns: 40px 1fr 300px; align-items: center; padding: 10px 8px; border-bottom: 1px solid var(--border-color); cursor: pointer; }
            .spotify-row.header { font-weight: 600; opacity: 0.8; cursor: default; }
            .spotify-row.item:hover { background: rgba(255,255,255,0.04); }
            .col.index { text-align: right; padding-right: 8px; color: var(--text-color); opacity: 0.8; }
            .col.title { display: flex; align-items: center; gap: 12px; }
            .cover { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; background: #222; }
            .meta { display: flex; flex-direction: column; }
            .track { display: flex; align-items: center; gap: 6px; font-weight: 600; }
            .explicit { display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; border: 1px solid var(--border-color); border-radius: 2px; width: 16px; height: 16px; }
            .artists { font-size: 0.9rem; opacity: 0.8; }
            .col.album { color: var(--text-color); opacity: 0.9; }
            @media (max-width: 768px) {
              .spotify-row { grid-template-columns: 30px 1fr; }
              .col.album { display: none; }
            }
          `}</style>
        </div>
      )}

      {selectedSong && (
        <div className="song-details">
          <p><strong>Track:</strong> {selectedSong.trackName}</p>
          <p><strong>Artist:</strong> {selectedSong.artistName}</p>
          <p><strong>Album:</strong> {selectedSong.albumName}</p>
          <p><strong>Duration:</strong> {(audioDurationSec ?? selectedSong.duration) } seconds</p>
        </div>
      )}

      <div className="editor">
        <div className="editor-left">
          <h3>1) Upload audio</h3>
          <input type="file" accept="audio/*" onChange={onAudioFileChange} />
          {audioUrl && (
            <div className="audio-controls">
              <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
              />
              <div className="transport">
                <button onClick={() => jumpTo(Math.max(0, currentTimeMs - 5000))} className="button">-5s</button>
                <button onClick={() => jumpTo(currentTimeMs + 5000)} className="button">+5s</button>
                <span>Now: {formatMs(currentTimeMs)}</span>
              </div>
            </div>
          )}

          <h3>2) Paste plain lyrics</h3>
          <textarea
            value={plainLyrics}
            onChange={(e) => setPlainLyrics(e.target.value)}
            placeholder="Enter plain lyrics, one line per lyric"
            className="textarea"
            rows={12}
          />

          <h3>or Import LRC</h3>
          <textarea
            value={lrcImport}
            onChange={(e) => setLrcImport(e.target.value)}
            placeholder="Paste LRC here to populate timestamps and lines"
            className="textarea"
            rows={10}
          />
          <button onClick={importLrc} className="button">Import LRC</button>
        </div>

        <div className="editor-right">
          <h3>3) Sync lines (tap-to-time)</h3>
          <div className="sync-toolbar">
            <button onClick={captureTimestampForCurrentLine} className="button">Tap timestamp (Space/Enter)</button>
            <button onClick={undoLastTimestamp} className="button">Undo (Backspace)</button>
            <button onClick={clearAllTimestamps} className="button">Clear all</button>
          </div>
          <ul className="lines" ref={linesContainerRef}>
            {lyricLines.map((line, idx) => (
              <li
                key={idx}
                ref={(el) => { lineRefs.current[idx] = el; }}
                className={`line ${idx === activeLineIndex ? 'active' : ''} ${idx === currentLineIndex ? 'cue' : ''}`}
                onClick={() => {
                  setCurrentLineIndex(idx);
                  const t = lyricLines[idx]?.timeMs;
                  if (t != null) jumpTo(t);
                }}
              >
                <input
                  className="timestamp-input"
                  value={formatMs(line.timeMs)}
                  onChange={(e) => setLineTimestamp(idx, e.target.value)}
                  onKeyDown={(e) => onTimestampKeyDown(e, idx)}
                  placeholder="mm:ss.xx"
                />
                <span className="line-text">{line.text}</span>
              </li>
            ))}
          </ul>

          <h3>4) Generated LRC</h3>
          <textarea value={generatedLrc} readOnly className="textarea" rows={12} />
        </div>
      </div>

      <button 
        onClick={handleSubmit} 
        className={`button ${publishLoading ? 'loading' : ''}`}
        disabled={publishLoading || !plainLyrics.trim()}
      >
        {publishLoading ? 'Publishing...' : 'Publish'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      
      {publishLoading && (
        <Loading 
          type="overlay" 
          text={publishingStep || 'Publishing lyrics to LRCLib...'} 
          showProgress={true}
        />
      )}

      {compareOpen && existingSong && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <span className="close-button" onClick={() => { setCompareOpen(false); setExistingSong(null); }}>&times;</span>
            <h2>Song already exists on LRCLIB</h2>
            <p>Compare and choose which lyrics to publish.</p>
            <div className="compare-grid">
              <div className="compare-col">
                <h3>{(generatedLrcBody && generatedLrcBody.trim() !== '') ? 'Your Synced' : 'Your Plain'}</h3>
                <pre className="lyrics" style={{ whiteSpace: 'pre-wrap' }}>{(generatedLrcBody && generatedLrcBody.trim() !== '') ? generatedLrcBody : (plainLyrics || '— None —')}</pre>
              </div>
              <div className="compare-col">
                <h3>{(existingSong.syncedLyrics && existingSong.syncedLyrics.trim() !== '') ? 'Existing Synced' : 'Existing Plain'}</h3>
                <pre className="lyrics" style={{ whiteSpace: 'pre-wrap' }}>{(existingSong.syncedLyrics && existingSong.syncedLyrics.trim() !== '') ? existingSong.syncedLyrics : (existingSong.plainLyrics || '— None —')}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="button" onClick={async () => { setCompareOpen(false); await publishLyrics({ plain: (generatedLrcBody && generatedLrcBody.trim() !== '') ? '' : plainLyrics, synced: generatedLrcBody }); }}>Use My Lyrics</button>
              <button className="button" onClick={async () => { setCompareOpen(false); await publishLyrics({ plain: (existingSong.syncedLyrics && existingSong.syncedLyrics.trim() !== '') ? '' : (existingSong.plainLyrics || ''), synced: existingSong.syncedLyrics || '' }); }}>Use Existing</button>
              <button className="button" onClick={() => { setCompareOpen(false); setExistingSong(null); }}>Cancel</button>
            </div>
            <style jsx>{`
              .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
              .lyrics { max-height: 260px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; background: rgba(255,255,255,0.04); }
              @media (max-width: 900px) { .compare-grid { grid-template-columns: 1fr; } }
            `}</style>
          </div>
        </div>
      )}

      {compareLoading && (
        <Loading type="overlay" text="Checking LRCLIB for existing song..." showProgress={true} />
      )}
    </div>
  );
}

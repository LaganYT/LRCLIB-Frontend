"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaSearch, FaMusic, FaExternalLinkAlt, FaCopy, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { LRCLibSearchResult, LRCLibSong } from '../types';
import Loading from '../components/Loading';
import EnhancedLyricsFinder from '../components/EnhancedLyricsFinder';

interface LyricsResult {
  platform: string;
  lyrics: string;
  url?: string;
  error?: string;
}

export default function FindLyrics() {
  const router = useRouter();
  const [songName, setSongName] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'local' | 'external'>('idle');
  const [localResults, setLocalResults] = useState<LRCLibSearchResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<LRCLibSong | null>(null);
  const [songLoading, setSongLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'synced' | 'plain'>('synced');
  const [externalResults, setExternalResults] = useState<LyricsResult[]>([]);
  const [showExternalResults, setShowExternalResults] = useState<boolean>(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (): Promise<void> => {
    if (!songName.trim() || !artistName.trim()) {
      setError('Please provide both song name and artist');
      return;
    }

    setIsSearching(true);
    setError(null);
    setLocalResults([]);
    setExternalResults([]);
    setShowExternalResults(false);
    setSearchPhase('local');

    try {
      // First, search the local LRCLib database
      const searchQuery = `${songName} ${artistName}`;
      const localResponse = await axios.get<LRCLibSearchResult[]>(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (localResponse.data && localResponse.data.length > 0) {
        setLocalResults(localResponse.data);
        setSearchPhase('idle');
        setIsSearching(false);
        return;
      }

      // If no local results, search external platforms
      setSearchPhase('external');
      await searchExternalPlatforms();

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for lyrics. Please try again.');
      setSearchPhase('external');
      await searchExternalPlatforms();
    } finally {
      setIsSearching(false);
    }
  };

  const searchExternalPlatforms = async (): Promise<void> => {
    try {
      const response = await fetch('/api/lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          song: songName.trim(),
          artist: artistName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExternalResults(data.results);
        setShowExternalResults(true);
      } else {
        setError(data.error || 'No lyrics found from any platform');
        setExternalResults(data.results || []);
        setShowExternalResults(true);
      }
    } catch (err) {
      setError('Failed to fetch lyrics from external platforms');
      setShowExternalResults(true);
    }
  };

  const handleSongClick = async (id: string): Promise<void> => {
    try {
      setSongLoading(true);
      setError('');
      const response = await axios.get<LRCLibSong>(`https://lrclib.net/api/get/${id}`);
      setSelectedSong(response.data);
    } catch (err) {
      setError('Failed to fetch song details.');
    } finally {
      setSongLoading(false);
    }
  };

  const closeModal = (): void => {
    setSelectedSong(null);
    setActiveTab('synced');
  };

  const copyLyrics = async (lyrics: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(lyrics);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error('Failed to copy lyrics:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Find Lyrics</h1>
        <p>Search for lyrics in our database and external platforms</p>
      </div>

      <div className="search-section">
        <div className="search-inputs">
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Song name..."
            className="input"
            disabled={isSearching}
          />
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Artist name..."
            className="input"
            disabled={isSearching}
          />
          <button 
            onClick={handleSearch}
            disabled={isSearching || !songName.trim() || !artistName.trim()}
            className="button search-button"
          >
            <FaSearch className="icon" />
            {isSearching ? (
              <>
                <Loading type="dots" size="small" />
                <span>
                  {searchPhase === 'local' ? 'Searching Database...' : 'Searching External Platforms...'}
                </span>
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Local Results */}
      {localResults.length > 0 && (
        <div className="results-section">
          <h2>Found in LRCLib Database</h2>
          <ul className="results-list">
            {localResults.map((result) => (
              <li key={result.id} className="result-item">
                <div onClick={() => handleSongClick(result.id)} style={{ flex: 1, cursor: 'pointer' }}>
                  <strong>{result.name}</strong> by {result.artistName}
                  <br />
                  <em>Album: {result.albumName}</em>
                </div>
                <div className="result-actions">
                  {result.syncedLyrics && <span className="synced-tag">Synced</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enhanced Lyrics Finder */}
      {showExternalResults && (
        <div className="results-section">
          <h2>Enhanced Lyrics Search</h2>
          <EnhancedLyricsFinder 
            songName={songName}
            artistName={artistName}
          />
        </div>
      )}

      {/* Song Detail Modal */}
      {songLoading && (
        <div className="modal">
          <div className="modal-content">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loading type="dots" size="large" />
              <p style={{ marginTop: '20px' }}>Loading song details...</p>
            </div>
          </div>
        </div>
      )}
      
      {selectedSong && !songLoading && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={closeModal}>&times;</span>
            <h2>{selectedSong.trackName} by {selectedSong.artistName}</h2>
            <div className="tabs">
              <button
                className={`tab-button ${activeTab === 'synced' ? 'active' : ''}`}
                onClick={() => setActiveTab('synced')}
              >
                Synced Lyrics
              </button>
              <button
                className={`tab-button ${activeTab === 'plain' ? 'active' : ''}`}
                onClick={() => setActiveTab('plain')}
              >
                Plain Lyrics
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'synced' ? (
                <pre className="lyrics">{selectedSong.syncedLyrics || 'No synced lyrics available.'}</pre>
              ) : (
                <pre className="lyrics">{selectedSong.plainLyrics || 'No plain lyrics available.'}</pre>
              )}
            </div>
            <button className="close-modal-button" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          color: var(--primary-color);
          margin-bottom: 10px;
        }

        .page-header p {
          color: var(--text-color);
          opacity: 0.8;
        }

        .search-section {
          background-color: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .search-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 15px;
          align-items: end;
        }

        .search-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
          transition: all 0.3s ease;
        }

        .search-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
        }

        .search-button .icon {
          font-size: 16px;
        }

        .error-message {
          margin: 20px 0;
          padding: 15px;
          background-color: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 8px;
          color: #ff6b6b;
        }

        .results-section {
          margin: 20px 0;
          animation: slideDown 0.3s ease;
        }

        .results-section h2 {
          color: var(--primary-color);
          margin-bottom: 15px;
          font-size: 1.3rem;
        }

        .no-results {
          text-align: center;
          color: var(--text-color);
          opacity: 0.7;
          font-style: italic;
          padding: 20px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .lyrics-card {
          background-color: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          animation: fadeInUp 0.4s ease;
        }

        .lyrics-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .lyrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: rgba(30, 144, 255, 0.1);
          border-bottom: 1px solid var(--border-color);
        }

        .lyrics-header h4 {
          margin: 0;
          color: var(--primary-color);
          font-weight: 600;
        }

        .lyrics-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .lyrics-content {
          padding: 15px;
          max-height: 300px;
          overflow-y: auto;
        }

        .lyrics-text {
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-color);
          margin: 0;
          background-color: rgba(0, 0, 0, 0.1);
          padding: 10px;
          border-radius: 4px;
        }

        .lyrics-error {
          color: #ff6b6b;
          font-style: italic;
          margin: 0;
        }

        .no-lyrics {
          color: var(--text-color);
          opacity: 0.7;
          font-style: italic;
          margin: 0;
        }

        .result-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .search-inputs {
            grid-template-columns: 1fr;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }

          .lyrics-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .lyrics-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .result-actions {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}

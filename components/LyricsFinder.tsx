import React, { useState } from 'react';
import { FaMusic, FaExternalLinkAlt, FaCopy, FaCheck, FaTimes, FaLink, FaArrowRight } from 'react-icons/fa';
import { useRouter } from 'next/router';
import Loading from './Loading';
import { LyricsResult } from '../types';
import type { SongInfo } from '@mjba/lyrics';

interface EnhancedLyricsFinderProps {
  songName: string;
  artistName: string;
  onLyricsAccepted?: (lyrics: string, syncedLyrics?: string, songInfo?: SongInfo) => void;
}

export default function EnhancedLyricsFinder({ songName, artistName, onLyricsAccepted }: EnhancedLyricsFinderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LyricsResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedLyrics, setExtractedLyrics] = useState<LyricsResult | null>(null);

  const findLyrics = async () => {
    if (!songName.trim() || !artistName.trim()) {
      setError('Please provide both song name and artist');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setShowResults(false);
    setExtractedLyrics(null);

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
        setResults(data.results);
        setShowResults(true);
      } else {
        setError(data.error || 'No lyrics found');
        setResults(data.results || []);
        setShowResults(true);
      }
    } catch (err) {
      setError('Failed to fetch lyrics. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const acceptLyrics = (result: LyricsResult) => {
    if (onLyricsAccepted) {
      onLyricsAccepted(result.lyrics, result.syncedLyrics, result.songInfo);
    } else {
      // Navigate to publish page with pre-filled data
      const params = new URLSearchParams({
        trackName: result.songInfo?.title || songName,
        artistName: result.songInfo?.artist || artistName,
        plainLyrics: result.lyrics,
        syncedLyrics: result.syncedLyrics || ''
      });
      router.push(`/publish?${params.toString()}`);
    }
  };

  const denyLyrics = () => {
    setShowUrlInput(true);
  };

  const extractFromUrl = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a Musixmatch URL');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch('/api/extract-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlInput.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExtractedLyrics({
          platform: 'Musixmatch (Extracted)',
          lyrics: data.lyrics || '',
          syncedLyrics: data.syncedLyrics,
          songInfo: data.songInfo,
          url: urlInput.trim()
        });
        setShowUrlInput(false);
      } else {
        setError(data.error || 'Failed to extract lyrics from URL');
      }
    } catch (err) {
      setError('Failed to extract lyrics from URL');
    } finally {
      setIsExtracting(false);
    }
  };

  const openMusixmatchSearch = () => {
    const searchQuery = `${songName} ${artistName}`.replace(/\s+/g, '%20');
    window.open(`https://www.musixmatch.com/search?query=${searchQuery}`, '_blank');
  };

  return (
    <div className="enhanced-lyrics-finder">
      <button
        onClick={findLyrics}
        disabled={isLoading || !songName.trim() || !artistName.trim()}
        className="button lyrics-finder-button"
      >
        <FaMusic className="icon" />
        {isLoading ? (
          <>
            <Loading type="dots" size="small" />
            <span>Finding Lyrics...</span>
          </>
        ) : (
          'Find Lyrics'
        )}
      </button>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showResults && (
        <div className="lyrics-results">
          <h3>Lyrics Results</h3>
          {results.length === 0 ? (
            <div className="no-results">
              <p>No lyrics found from Musixmatch.</p>
              <div className="external-search-section">
                <p>Try searching on Musixmatch directly:</p>
                <button 
                  onClick={openMusixmatchSearch}
                  className="button external-search-button"
                >
                  <FaExternalLinkAlt />
                  Search on Musixmatch
                </button>
                <p className="instruction-text">
                  After finding the lyrics, copy the URL and paste it below to extract them.
                </p>
                <button 
                  onClick={() => setShowUrlInput(true)}
                  className="button url-input-button"
                >
                  <FaLink />
                  Paste Musixmatch URL
                </button>
              </div>
            </div>
          ) : (
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="lyrics-card">
                  <div className="lyrics-header">
                    <h4>{result.platform}</h4>
                    <div className="lyrics-actions">
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-button"
                          title="View on platform"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      )}
                      {result.lyrics && (
                        <button
                          onClick={() => copyLyrics(result.lyrics, result.platform)}
                          className="action-button"
                          title="Copy lyrics"
                        >
                          {copiedPlatform === result.platform ? <FaCheck /> : <FaCopy />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="lyrics-content">
                    {result.error ? (
                      <p className="lyrics-error">{result.error}</p>
                    ) : result.lyrics ? (
                      <pre className="lyrics-text">{result.lyrics}</pre>
                    ) : (
                      <p className="no-lyrics">No lyrics available</p>
                    )}
                  </div>
                  <div className="lyrics-actions-bottom">
                    <button
                      onClick={() => acceptLyrics(result)}
                      className="accept-button"
                      disabled={!result.lyrics}
                    >
                      <FaCheck />
                      Accept & Publish
                    </button>
                    <button
                      onClick={denyLyrics}
                      className="deny-button"
                    >
                      <FaTimes />
                      Deny & Search External
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showUrlInput && (
        <div className="url-input-section">
          <h3>Extract Lyrics from Musixmatch URL</h3>
          <div className="url-input-container">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste Musixmatch URL here (e.g., https://www.musixmatch.com/lyrics/artist/song)"
              className="url-input"
              disabled={isExtracting}
            />
            <button
              onClick={extractFromUrl}
              disabled={isExtracting || !urlInput.trim()}
              className="extract-button"
            >
              {isExtracting ? (
                <>
                  <Loading type="dots" size="small" />
                  Extracting...
                </>
              ) : (
                <>
                  <FaArrowRight />
                  Extract Lyrics
                </>
              )}
            </button>
          </div>
          <button
            onClick={() => setShowUrlInput(false)}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      )}

      {extractedLyrics && (
        <div className="extracted-lyrics-section">
          <h3>Extracted Lyrics</h3>
          <div className="lyrics-card">
            <div className="lyrics-header">
              <h4>{extractedLyrics.platform}</h4>
              <div className="lyrics-actions">
                <button
                  onClick={() => copyLyrics(extractedLyrics.lyrics, extractedLyrics.platform)}
                  className="action-button"
                  title="Copy lyrics"
                >
                  {copiedPlatform === extractedLyrics.platform ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
            </div>
            <div className="lyrics-content">
              <pre className="lyrics-text">{extractedLyrics.lyrics}</pre>
              {extractedLyrics.syncedLyrics && (
                <div className="synced-lyrics-section">
                  <h5>Synced Lyrics (LRC Format)</h5>
                  <pre className="synced-lyrics-text">{extractedLyrics.syncedLyrics}</pre>
                </div>
              )}
            </div>
            <div className="lyrics-actions-bottom">
              <button
                onClick={() => acceptLyrics(extractedLyrics)}
                className="accept-button"
              >
                <FaCheck />
                Accept & Publish
              </button>
              <button
                onClick={() => {
                  setExtractedLyrics(null);
                  setShowUrlInput(true);
                }}
                className="deny-button"
              >
                <FaTimes />
                Try Different URL
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-lyrics-finder {
          margin: 20px 0;
        }

        .lyrics-finder-button {
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

        .lyrics-finder-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(30, 144, 255, 0.4);
        }

        .lyrics-finder-button .icon {
          font-size: 16px;
        }

        .error-message {
          margin-top: 10px;
          padding: 10px;
          background-color: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          border-radius: 4px;
          color: #ff6b6b;
        }

        .lyrics-results {
          margin-top: 20px;
          animation: slideDown 0.3s ease;
        }

        .lyrics-results h3 {
          color: var(--primary-color);
          margin-bottom: 15px;
          font-size: 1.2rem;
        }

        .no-results {
          text-align: center;
          color: var(--text-color);
          opacity: 0.7;
          font-style: italic;
        }

        .external-search-section {
          margin-top: 20px;
          padding: 20px;
          background-color: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .external-search-button, .url-input-button {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 10px 0;
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .external-search-button:hover, .url-input-button:hover {
          background: linear-gradient(135deg, #ee5a24, #ff6b6b);
          transform: translateY(-1px);
        }

        .instruction-text {
          margin: 15px 0;
          font-size: 0.9rem;
          opacity: 0.8;
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

        .synced-lyrics-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color);
        }

        .synced-lyrics-section h5 {
          color: var(--primary-color);
          margin-bottom: 10px;
        }

        .synced-lyrics-text {
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: var(--text-color);
          margin: 0;
          background-color: rgba(30, 144, 255, 0.1);
          padding: 10px;
          border-radius: 4px;
          border-left: 3px solid var(--primary-color);
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

        .lyrics-actions-bottom {
          display: flex;
          gap: 10px;
          padding: 15px;
          border-top: 1px solid var(--border-color);
          background-color: rgba(0, 0, 0, 0.05);
        }

        .accept-button, .deny-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 15px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .accept-button {
          background: linear-gradient(135deg, #28a745, #20c997);
          color: white;
        }

        .accept-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #20c997, #28a745);
          transform: translateY(-1px);
        }

        .accept-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .deny-button {
          background: linear-gradient(135deg, #dc3545, #fd7e14);
          color: white;
        }

        .deny-button:hover {
          background: linear-gradient(135deg, #fd7e14, #dc3545);
          transform: translateY(-1px);
        }

        .url-input-section {
          margin-top: 20px;
          padding: 20px;
          background-color: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          animation: slideDown 0.3s ease;
        }

        .url-input-section h3 {
          color: var(--primary-color);
          margin-bottom: 15px;
        }

        .url-input-container {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .url-input {
          flex: 1;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: transparent;
          color: var(--text-color);
          font-size: 14px;
        }

        .url-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .extract-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .extract-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
        }

        .extract-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-button {
          background: none;
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button:hover {
          background-color: var(--border-color);
        }

        .extracted-lyrics-section {
          margin-top: 20px;
          animation: slideDown 0.3s ease;
        }

        .extracted-lyrics-section h3 {
          color: var(--primary-color);
          margin-bottom: 15px;
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

          .lyrics-actions-bottom {
            flex-direction: column;
          }

          .url-input-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

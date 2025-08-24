import React, { useState } from 'react';
import { FaMusic, FaExternalLinkAlt, FaCopy, FaCheck } from 'react-icons/fa';
import Loading from './Loading';

interface LyricsResult {
  platform: string;
  lyrics: string;
  url?: string;
  error?: string;
}

interface LyricsFinderProps {
  songName: string;
  artistName: string;
  onLyricsFound?: (lyrics: string) => void;
}

export default function LyricsFinder({ songName, artistName, onLyricsFound }: LyricsFinderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LyricsResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findLyrics = async () => {
    if (!songName.trim() || !artistName.trim()) {
      setError('Please provide both song name and artist');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setShowResults(false);

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

  const useLyrics = (lyrics: string) => {
    if (onLyricsFound) {
      onLyricsFound(lyrics);
    }
  };

  return (
    <div className="lyrics-finder">
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
            <p className="no-results">No lyrics found from any platform.</p>
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
                        <>
                          <button
                            onClick={() => copyLyrics(result.lyrics, result.platform)}
                            className="action-button"
                            title="Copy lyrics"
                          >
                            {copiedPlatform === result.platform ? <FaCheck /> : <FaCopy />}
                          </button>
                          <button
                            onClick={() => useLyrics(result.lyrics)}
                            className="action-button use-button"
                            title="Use these lyrics"
                          >
                            Use
                          </button>
                        </>
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .lyrics-finder {
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

        .action-button.use-button {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
          font-weight: 600;
        }

        .action-button.use-button:hover {
          background-color: var(--secondary-color);
          border-color: var(--secondary-color);
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
        }
      `}</style>
    </div>
  );
}

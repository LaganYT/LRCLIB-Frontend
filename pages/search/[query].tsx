"use client";

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaMusic } from 'react-icons/fa';
import { LRCLibSearchResult, LRCLibSong } from '../../types';
import Loading from '../../components/Loading';

export default function SearchResults() {
  const router = useRouter();
  const { query } = router.query;
  const [results, setResults] = useState<LRCLibSearchResult[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [songLoading, setSongLoading] = useState<boolean>(false);
  const [selectedSong, setSelectedSong] = useState<LRCLibSong | null>(null);
  const [activeTab, setActiveTab] = useState<'synced' | 'plain'>('synced');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (query && typeof query === 'string') {
      setSearchQuery(query);
    }
  }, [query]);

  useEffect(() => {
    if (searchQuery) {
      fetchResults(searchQuery);
    }
  }, [searchQuery]);

  const fetchResults = async (searchQuery: string): Promise<void> => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.get<LRCLibSearchResult[]>(`https://lrclib.net/api/search?q=${searchQuery}`);
      setResults(response.data || []);
    } catch (err) {
      setError('Failed to fetch search results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (): void => {
    if (searchQuery.trim()) {
      router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
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



  return (
    <div className="container">
      <div className="search-bar">
        <FaSearch className="icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for lyrics..."
          className="input"
        />
        <button onClick={handleSearch} className="button">Search</button>
      </div>
      <div className="search-header">
        <h1>Search Results for "{query}"</h1>
      </div>
      

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Loading type="dots" size="large" />
          <p style={{ marginTop: '20px' }}>Searching for lyrics...</p>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <ul className="results-list">
        {results.length > 0 ? (
          results.map((result) => (
            <li key={result.id} className="result-item" onClick={() => handleSongClick(result.id)}>
              <div>
                <strong>{result.name}</strong> by {result.artistName}
                <br />
                <em>Album: {result.albumName}</em>
              </div>
              {result.syncedLyrics && <span className="synced-tag">Synced</span>}
            </li>
          ))
        ) : (
          !loading && results.length === 0 && (
            <div>
              <p>No results found.</p>
              <button className="button" onClick={() => router.push('/publish')}>
                Publish Lyrics
              </button>
            </div>
          )
        )}
      </ul>
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

        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .find-lyrics-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-color);
          text-decoration: none;
          padding: 8px 16px;
          border: 1px solid var(--primary-color);
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .find-lyrics-link:hover {
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .search-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

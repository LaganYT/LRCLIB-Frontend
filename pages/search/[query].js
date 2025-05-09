"use client";

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SearchResults() {
  const router = useRouter();
  const { query } = router.query;
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [activeTab, setActiveTab] = useState('synced'); // 'synced' or 'plain'
  const [searchQuery, setSearchQuery] = useState(query || '');

  useEffect(() => {
    if (query) {
      fetchResults(query);
    }
  }, [query]);

  const fetchResults = async (searchQuery) => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.get(`https://lrclib.net/api/search?q=${searchQuery}`);
      setResults(response.data || []);
    } catch (err) {
      setError('Failed to fetch search results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSongClick = async (id) => {
    try {
      const response = await axios.get(`https://lrclib.net/api/get/${id}`);
      setSelectedSong(response.data);
    } catch (err) {
      setError('Failed to fetch song details.');
    }
  };

  const closeModal = () => {
    setSelectedSong(null);
    setActiveTab('synced');
  };

  return (
    <div className="container">
      <div className="navbar">
        <button onClick={() => router.push('/')} className="button">Home</button>
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for lyrics..."
            className="input"
          />
          <button onClick={handleSearch} className="search-button">🔍</button>
        </div>
      </div>
      <h1>Search Results for "{query}"</h1>
      {loading && <p>Loading...</p>}
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
          !loading && <p>No results found.</p>
        )}
      </ul>
      {selectedSong && (
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
    </div>
  );
}

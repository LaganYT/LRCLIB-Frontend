import { useState } from 'react';
import axios from 'axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const handleSearch = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.get(`https://lrclib.net/api/search?q=${query}`);
      setResults(response.data || []); // Ensure results is an array
    } catch (err) {
      setError('Failed to fetch search results.');
      setResults([]); // Reset results on error
    } finally {
      setLoading(false);
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
  };

  return (
    <div className="container">
      <h1>Search Lyrics</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter search query"
        className="input"
      />
      <button onClick={handleSearch} className="button" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
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
            <h3>Plain Lyrics</h3>
            <pre>{selectedSong.plainLyrics}</pre>
            <h3>Synced Lyrics</h3>
            <pre>{selectedSong.syncedLyrics || 'No synced lyrics available.'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

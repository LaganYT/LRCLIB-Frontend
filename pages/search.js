import { useState } from 'react';
import axios from 'axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.get(`https://lrclib.net/api/search?query=${query}`);
      setResults(response.data.results || []); // Ensure results is an array
    } catch (err) {
      setError('Failed to fetch search results.');
      setResults([]); // Reset results on error
    } finally {
      setLoading(false);
    }
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
      <ul>
        {results.length > 0 ? (
          results.map((result) => (
            <li key={result.id}>{result.title} by {result.artist}</li>
          ))
        ) : (
          !loading && <p>No results found.</p>
        )}
      </ul>
    </div>
  );
}

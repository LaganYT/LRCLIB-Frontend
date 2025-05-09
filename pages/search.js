import { useState } from 'react';
import axios from 'axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      setError('');
      const response = await axios.get(`https://lrclib.net/api/search?query=${query}`);
      setResults(response.data.results);
    } catch (err) {
      setError('Failed to fetch search results.');
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
      <button onClick={handleSearch} className="button">Search</button>
      {error && <p className="error">{error}</p>}
      <ul>
        {results.map((result) => (
          <li key={result.id}>{result.title} by {result.artist}</li>
        ))}
      </ul>
    </div>
  );
}

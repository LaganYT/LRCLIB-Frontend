import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Search() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="search-container">
      <h1 className="search-title">Search Lyrics</h1>
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query"
          className="input"
        />
        <button onClick={handleSearch} className="search-button">🔍</button>
      </div>
    </div>
  );
}

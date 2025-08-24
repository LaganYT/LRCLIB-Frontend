"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';
import { FaSearch, FaMicrophone, FaCog } from 'react-icons/fa';
import Loading from '../../components/Loading';

export default function Search() {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSearch = async (): Promise<void> => {
    if (query.trim()) {
      setIsLoading(true);
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/search/${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleButtonClick = (): void => {
    handleSearch();
  };

  return (
    <div className="search-container">
      <h1 className="search-title">Search Lyrics</h1>
      <div className="search-bar">
        <FaSearch className="icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter search query"
          className="input"
          disabled={isLoading}
        />
        <button 
          onClick={handleButtonClick}
          disabled={isLoading || !query.trim()}
          className="button"
          style={{ marginLeft: '10px' }}
        >
          {isLoading ? <Loading type="dots" size="small" /> : 'Search'}
        </button>
      </div>
    </div>
  );
}

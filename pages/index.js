import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [theme, setTheme] = useState('dark');
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="home-container">
      <div className="logo">
        <h1>LRCLIB-Frontend</h1>
      </div>
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for lyrics..."
          className="input"
        />
        <button onClick={handleSearch} className="search-button">🔍</button>
      </div>
      <div className="links">
        <a href="https://lrclib.net/">Original Site</a>
        <a href="https://lrclib.net/docs">API Documentation</a>
        <a href="https://lrclib.net/db-dumps">Database Dumps</a>
        <a href="https://github.com/tranxuanthang/lrclib?tab=readme-ov-file#donation">Donation to creator</a>
      </div>
      <div className="theme-toggle">
        <button onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </div>
  );
}

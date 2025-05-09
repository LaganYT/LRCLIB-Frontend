import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [theme, setTheme] = useState('dark');

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

  return (
    <div className="home-container">
      <div className="logo">
        <h1>LRCLIB-Frontend</h1>
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for lyrics..."
          className="input"
        />
        <button className="search-button">🔍</button>
      </div>
      <div className="links">
        <Link href="https://lrclib.net/">Original Site</Link>
        <Link href="https://lrclib.net/docs">API Documentation</Link>
        <Link href="https://lrclib.net/db-dumps">Database Dumps</Link>
        <Link href="https://github.com/tranxuanthang/lrclib?tab=readme-ov-file#donation">Donation to creator</Link>
      </div>
      <div className="theme-toggle">
        <button onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </div>
  );
}

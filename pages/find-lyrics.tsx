"use client";

import { useState } from 'react';
import { useRouter } from 'next/router';
import LyricsFinder from '../components/LyricsFinder';

export default function FindLyrics() {
  const router = useRouter();
  const [songName, setSongName] = useState<string>('');
  const [artistName, setArtistName] = useState<string>('');

  return (
    <div className="container">
      <div className="page-header">
        <h1>Find Lyrics</h1>
        <p>Search for lyrics in our database and external platforms</p>
      </div>

      <div className="search-section">
        <div className="search-inputs">
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="Song name..."
            className="input"
          />
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artist name..."
            className="input"
          />
        </div>
      </div>

      <div className="results-section">
        <h2>Enhanced Lyrics Search</h2>
        <LyricsFinder 
          songName={songName}
          artistName={artistName}
        />
      </div>

      <style jsx>{`
        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          color: var(--primary-color);
          margin-bottom: 10px;
        }

        .page-header p {
          color: var(--text-color);
          opacity: 0.8;
        }

        .search-section {
          background-color: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .search-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          align-items: end;
        }

        .results-section {
          margin: 20px 0;
          animation: slideDown 0.3s ease;
        }

        .results-section h2 {
          color: var(--primary-color);
          margin-bottom: 15px;
          font-size: 1.3rem;
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

        @media (max-width: 768px) {
          .search-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

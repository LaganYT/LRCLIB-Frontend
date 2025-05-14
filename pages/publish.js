"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const CLIENT_ID = '28a7d1b1ca074829b305916a96032709'; // Replace with your Spotify Client ID
const CLIENT_SECRET = 'fa4e00f57aa443b685e7909a4e5148b6'; // Replace with your Spotify Client Secret

export default function Publish() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [plainLyrics, setPlainLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleSearchQueryChange = (e) => setSearchQuery(e.target.value);

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const tokenResponse = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({ grant_type: 'client_credentials' }),
          {
            headers: {
              Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
        setAccessToken(tokenResponse.data.access_token);
        setError('');
      } catch (err) {
        setError('Failed to generate access token. Please check your client ID and secret.');
      }
    };

    fetchAccessToken();
  }, []); // Run once when the component mounts

  const searchSpotify = async () => {
    if (!accessToken) {
      setError('Access token is missing. Please try again.');
      return;
    }
    try {
      const { data } = await axios.get(`https://api.spotify.com/v1/search`, {
        params: { q: searchQuery, type: 'track', limit: 10 },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setSearchResults(data.tracks.items);
    } catch (err) {
      setError('Failed to search Spotify. Please try again.');
    }
  };

  const selectSong = (song) => {
    setSelectedSong({
      trackName: song.name,
      artistName: song.artists.map((artist) => artist.name).join(', '),
      albumName: song.album.name,
      duration: Math.round(song.duration_ms / 1000),
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const obtainPublishToken = async () => {
    try {
      const { data } = await axios.post('https://lrclib.net/api/request-challenge');
      const { prefix, target } = data;

      let nonce = 0;
      while (true) {
        const hash = CryptoJS.SHA256(`${prefix}:${nonce}`).toString(CryptoJS.enc.Hex); // Fixed hash format
        if (hash <= target) break;
        nonce++;
      }

      return `${prefix}:${nonce}`;
    } catch (err) {
      throw new Error('Failed to obtain publish token.');
    }
  };

  const publishLyrics = async (publishToken) => {
    const apiEndpoint = 'https://lrclib.net/api/publish';

    const payload = {
      trackName: selectedSong.trackName,
      artistName: selectedSong.artistName,
      albumName: selectedSong.albumName,
      duration: selectedSong.duration,
      plainLyrics,
      syncedLyrics: syncedLyrics || null, // Ensure syncedLyrics is optional
    };

    try {
      const response = await axios.post(apiEndpoint, payload, {
        headers: {
          'X-Publish-Token': publishToken,
          'x-user-agent': 'LRCLIB-Frontend v1.0.0 (https://github.com/LaganYT/LRCLIB-Frontend)',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.status === 201) {
        setSuccess('Lyrics published successfully!');
      } else {
        throw new Error('Unexpected response status.');
      }
    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        setError(data.message || 'An error occurred.');
      } else {
        setError('Failed to publish lyrics. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedSong) {
      setError('Please select a song from the search results.');
      return;
    }

    if (!plainLyrics && !syncedLyrics) {
      setError('At least one of plain lyrics or synced lyrics must be provided.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const publishToken = await obtainPublishToken();
      await publishLyrics(publishToken);
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Publish Lyrics</h1>
      <p>Search for a song on Spotify to autofill details.</p>
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchQueryChange}
        placeholder="Search for a song"
        className="input"
      />
      <button onClick={searchSpotify} className="button">
        Search
      </button>
      {searchResults.length > 0 && (
        <ul className="search-results">
          {searchResults.map((song) => (
            <li key={song.id} onClick={() => selectSong(song)}>
              {song.name} - {song.artists.map((artist) => artist.name).join(', ')}
            </li>
          ))}
        </ul>
      )}
      {selectedSong && (
        <div className="song-details">
          <p><strong>Track:</strong> {selectedSong.trackName}</p>
          <p><strong>Artist:</strong> {selectedSong.artistName}</p>
          <p><strong>Album:</strong> {selectedSong.albumName}</p>
          <p><strong>Duration:</strong> {selectedSong.duration} seconds</p>
        </div>
      )}
      <textarea
        value={plainLyrics}
        onChange={(e) => setPlainLyrics(e.target.value)}
        placeholder="Enter plain lyrics here"
        className="textarea"
        rows="10"
      />
      <textarea
        value={syncedLyrics}
        onChange={(e) => setSyncedLyrics(e.target.value)}
        placeholder="Enter synced lyrics here"
        className="textarea"
        rows="10"
      />
      <button onClick={handleSubmit} className="button" disabled={loading}>
        {loading ? 'Publishing...' : 'Publish'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}
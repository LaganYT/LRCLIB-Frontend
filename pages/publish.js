import { useState } from 'react';
import axios from 'axios';
import crypto from 'crypto';

export default function Publish() {
  const [trackName, setTrackName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [duration, setDuration] = useState('');
  const [plainLyrics, setPlainLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState('');
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTrackNameChange = (e) => setTrackName(e.target.value);
  const handleArtistNameChange = (e) => setArtistName(e.target.value);
  const handleAlbumNameChange = (e) => setAlbumName(e.target.value);
  const handlePlainLyricsChange = (e) => setPlainLyrics(e.target.value);
  const handleSyncedLyricsChange = (e) => setSyncedLyrics(e.target.value);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudio(file);
      const audioElement = document.getElementById('audio');
      const objectUrl = URL.createObjectURL(file);
      audioElement.src = objectUrl;
      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration);
      });
    }
  };

  const obtainPublishToken = async () => {
    try {
      const { data } = await axios.post('https://lrclib.net/api/request-challenge');
      const { prefix, target } = data;

      let nonce = 0;
      while (true) {
        const hash = crypto.createHash('sha256').update(prefix + nonce).digest('hex');
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
      trackName,
      albumName,
      artistName,
      duration: Math.round(duration),
      plainLyrics,
      syncedLyrics,
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
        if (status === 400 || status === 503 || status === 500) {
          setError(`${data.error}: ${data.message}`);
        } else {
          setError('Unknown error occurred.');
        }
      } else {
        setError('Failed to publish lyrics. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!trackName || !artistName || !albumName || !duration) {
      setError('All fields except lyrics are required.');
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
      <p>Fill in the details below to publish your lyrics.</p>
      <input
        type="text"
        value={trackName}
        onChange={handleTrackNameChange}
        placeholder="Track Name"
        className="input"
      />
      <input
        type="text"
        value={artistName}
        onChange={handleArtistNameChange}
        placeholder="Artist Name"
        className="input"
      />
      <input
        type="text"
        value={albumName}
        onChange={handleAlbumNameChange}
        placeholder="Album Name"
        className="input"
      />
      <textarea
        value={plainLyrics}
        onChange={handlePlainLyricsChange}
        placeholder="Enter plain lyrics here"
        className="textarea"
        rows="10"
      />
      <textarea
        value={syncedLyrics}
        onChange={handleSyncedLyricsChange}
        placeholder="Enter synced lyrics here"
        className="textarea"
        rows="10"
      />
      <input type="file" accept="audio/*" onChange={handleAudioChange} className="input" />
      <audio id="audio" controls className="audio"></audio>
      <button onClick={handleSubmit} className="button" disabled={loading}>
        {loading ? 'Publishing...' : 'Publish'}
      </button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}
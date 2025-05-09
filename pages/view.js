import { useState } from 'react';
import axios from 'axios';

export default function View() {
  const [id, setId] = useState('');
  const [lyrics, setLyrics] = useState(null);
  const [error, setError] = useState('');

  const handleView = async () => {
    try {
      setError('');
      const response = await axios.get(`https://lrclib.net/api/lyrics/${id}`);
      setLyrics(response.data);
    } catch (err) {
      setError('Failed to fetch lyrics.');
    }
  };

  return (
    <div className="container">
      <h1>View Lyrics</h1>
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="Enter lyrics ID"
        className="input"
      />
      <button onClick={handleView} className="button">View</button>
      {error && <p className="error">{error}</p>}
      {lyrics && (
        <div>
          <h2>{lyrics.title} by {lyrics.artist}</h2>
          <pre>{lyrics.content}</pre>
        </div>
      )}
    </div>
  );
}

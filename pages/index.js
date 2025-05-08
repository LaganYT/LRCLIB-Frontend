import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [trackName, setTrackName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [duration, setDuration] = useState('');
  const [plainLyrics, setPlainLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState('');
  const [audio, setAudio] = useState(null);
  const [syncData, setSyncData] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);

  const handleTrackNameChange = (e) => {
    setTrackName(e.target.value);
  };

  const handleArtistNameChange = (e) => {
    setArtistName(e.target.value);
  };

  const handleAlbumNameChange = (e) => {
    setAlbumName(e.target.value);
  };

  const handlePlainLyricsChange = (e) => {
    setPlainLyrics(e.target.value);
    setSyncedLyrics(e.target.value);
  };

  const handleSyncedLyricsChange = (e) => {
    setSyncedLyrics(e.target.value);
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    setAudio(file);

    const audioElement = new Audio(URL.createObjectURL(file));
    audioElement.addEventListener('loadedmetadata', () => {
      setDuration(audioElement.duration);
    });
  };

  const handleSyncLine = (line, time) => {
    setSyncData([...syncData, { line, time }]);
  };

  const handleSync = () => {
    const audioElement = document.getElementById('audio');
    const currentTime = audioElement.currentTime;
    handleSyncLine(currentLine, currentTime);
    setCurrentLine(currentLine + 1);
  };

  const obtainPublishToken = async () => {
    const challengeResponse = await axios.post('https://lrclib.net/api/request-challenge');
    const { prefix, target } = challengeResponse.data;

    // Solve the proof-of-work challenge (this is a simplified example)
    let nonce = 0;
    while (true) {
      const hash = crypto.createHash('sha256').update(prefix + nonce).digest('hex');
      if (hash.startsWith(target)) {
        break;
      }
      nonce++;
    }

    return `${prefix}:${nonce}`;
  };

  const handleSubmit = async () => {
    if (!audio) {
      alert('Please upload an audio file.');
      return;
    }

    const publishToken = await obtainPublishToken();

    const response = await axios.post('https://lrclib.net/api/publish', {
      trackName,
      artistName,
      albumName,
      duration,
      plainLyrics,
      syncedLyrics,
      syncData,
    }, {
      headers: {
        'X-Publish-Token': publishToken,
      },
    });

    console.log(response.data);
  };

  return (
    <div className="container">
      <h1>Publish Lyrics to LRCLib.net</h1>
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
      <audio id="audio" controls className="audio">
        <source src={audio ? URL.createObjectURL(audio) : ''} type="audio/mpeg" />
      </audio>
      <button onClick={handleSync} className="button">Sync Line</button>
      <button onClick={handleSubmit} className="button">Publish</button>
    </div>
  );
}

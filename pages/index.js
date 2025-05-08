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

  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  const handlePlainLyricsChange = (e) => {
    setPlainLyrics(e.target.value);
  };

  const handleSyncedLyricsChange = (e) => {
    setSyncedLyrics(e.target.value);
  };

  const handleAudioChange = (e) => {
    setAudio(e.target.files[0]);
  };

  const handleSync = () => {
    const audioElement = document.getElementById('audio');
    const currentTime = audioElement.currentTime;
    setSyncData([...syncData, { line: currentLine, time: currentTime }]);
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
    const publishToken = await obtainPublishToken();

    const response = await axios.post('https://lrclib.net/api/publish', {
      trackName,
      artistName,
      albumName,
      duration,
      plainLyrics,
      syncedLyrics,
    }, {
      headers: {
        'X-Publish-Token': publishToken,
      },
    });

    console.log(response.data);
  };

  return (
    <div>
      <h1>Publish Lyrics to LRCLib.net</h1>
      <input
        type="text"
        value={trackName}
        onChange={handleTrackNameChange}
        placeholder="Track Name"
      />
      <input
        type="text"
        value={artistName}
        onChange={handleArtistNameChange}
        placeholder="Artist Name"
      />
      <input
        type="text"
        value={albumName}
        onChange={handleAlbumNameChange}
        placeholder="Album Name"
      />
      <input
        type="number"
        value={duration}
        onChange={handleDurationChange}
        placeholder="Duration (seconds)"
      />
      <textarea
        value={plainLyrics}
        onChange={handlePlainLyricsChange}
        placeholder="Enter plain lyrics here"
      />
      <textarea
        value={syncedLyrics}
        onChange={handleSyncedLyricsChange}
        placeholder="Enter synced lyrics here"
      />
      <input type="file" accept="audio/*" onChange={handleAudioChange} />
      <audio id="audio" controls>
        <source src={audio ? URL.createObjectURL(audio) : ''} type="audio/mpeg" />
      </audio>
      <button onClick={handleSync}>Sync Line</button>
      <button onClick={handleSubmit}>Publish</button>
    </div>
  );
}

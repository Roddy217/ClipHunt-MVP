import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState } from 'react';
import './App.css';

function Home({ ownedClips, setOwnedClips }) {
  const [clips, setClips] = useState([
    { id: 1, title: "Funny Cat", url: "https://www.pexels.com/video/cat-playing-with-toy-855282/" },
    { id: 2, title: "Epic Skate", url: "https://www.pexels.com/video/skateboarder-doing-a-trick-854302/" },
  ]);
  const handleHunt = () => {
    // Pick a random clip
    const randomClip = clips[Math.floor(Math.random() * clips.length)];
    // Check if clip is already in ownedClips
    const alreadyOwned = ownedClips.some(clip => clip.id === randomClip.id);
    if (!alreadyOwned) {
      setOwnedClips([...ownedClips, randomClip]);
    }
  };
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>ClipHunt</h1>
      <p>Hunt clips, trade with friends, and win rewards!</p>
      <button onClick={handleHunt}>Start Hunting</button>
      <h2>Clip Feed</h2>
      <div className="clip-feed">
        {clips.map(clip => (
          <div key={clip.id} className="clip-item">
            <p>{clip.title} - <a href={clip.url} target="_blank" rel="noopener noreferrer">Watch</a></p>
          </div>
        ))}
      </div>
      <Link to="/library">Go to Library</Link>
    </div>
  );
}

function Library({ ownedClips }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>My Library</h1>
      {ownedClips.length === 0 ? (
        <p>No clips hunted yet!</p>
      ) : (
        <div className="library-feed">
          {ownedClips.map(clip => (
            <div key={clip.id} className="library-item">
              <p>{clip.title}</p>
            </div>
          ))}
        </div>
      )}
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function App() {
  const [ownedClips, setOwnedClips] = useState([]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home ownedClips={ownedClips} setOwnedClips={setOwnedClips} />} />
        <Route path="/library" element={<Library ownedClips={ownedClips} />} />
      </Routes>
    </Router>
  );
}

export default App;
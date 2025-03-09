import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState } from 'react'; // Add this!
import './App.css';

function Home({ ownedClips, setOwnedClips }) { // Pass props
  const [clips, setClips] = useState([
    { id: 1, title: "Funny Cat", url: "https://www.pexels.com/video/cat-playing-with-toy-855282/" },
    { id: 2, title: "Epic Skate", url: "https://www.pexels.com/video/skateboarder-doing-a-trick-854302/" },
  ]);
  const handleHunt = () => {
    const randomClip = clips[Math.floor(Math.random() * clips.length)];
    setOwnedClips([...ownedClips, randomClip]);
  };
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>ClipHunt</h1>
      <p>Hunt clips, trade with friends, and win rewards!</p>
      <button className="hunt-button" onClick={handleHunt}>Start Hunting</button>
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

function Library({ ownedClips }) { // Receive props
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>My Library</h1>
      {ownedClips.length === 0 ? (
        <p>No clips hunted yet!</p>
      ) : (
        ownedClips.map(clip => (
          <div key={clip.id} style={{ margin: '10px' }}>
            <p>{clip.title}</p>
          </div>
        ))
      )}
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function App() {
  const [ownedClips, setOwnedClips] = useState([]); // Lift state to App
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
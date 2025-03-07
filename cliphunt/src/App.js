import logo from './logo.svg';
import './App.css';

import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function Home() {
  const clips = [
    { id: 1, title: "Funny Cat", url: "https://www.pexels.com/video/123" },
    { id: 2, title: "Epic Skate", url: "https://www.pexels.com/video/456" },
  ];
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>ClipHunt</h1>
      <p>Hunt clips, trade with friends, and win rewards!</p>
      <button style={{ padding: '10px 20px', fontSize: '16px' }}>
        Start Hunting
      </button>
      <h2>Clip Feed</h2>
      {clips.map(clip => (
        <div key={clip.id} style={{ margin: '10px' }}>
          <p>{clip.title} - <a href={clip.url} target="_blank">Watch</a></p>
        </div>
      ))}
      <Link to="/library">Go to Library</Link>
    </div>
  );
}

function Library() {
  const ownedClips = [
    { id: 1, title: "Funny Cat" },
    { id: 3, title: "Dance Move" },
  ];
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>My Library</h1>
      {ownedClips.map(clip => (
        <div key={clip.id} style={{ margin: '10px' }}>
          <p>{clip.title}</p>
        </div>
      ))}
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </Router>
  );
}

export default App;
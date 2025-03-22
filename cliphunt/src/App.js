import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './App.css';

// Initialize Stripe with your Publishable Key
const stripePromise = loadStripe('pk_test_51R36ot5Cp3FKy9pXvMULLqndqDyUzGP42VrvtY249XJndkp3V6LBDXLKuFZVtkxPwPKK1CCoGL9prPY33izsv1l500e0CIZUX9');

function filterClips(clips, category) {
  return category === 'All' ? clips : clips.filter(clip => clip.category === category);
}

function countClipsByCategory(clips) {
  return clips.reduce((acc, clip) => {
    acc[clip.category] = (acc[clip.category] || 0) + 1;
    return acc;
  }, {});
}

function Home({ ownedClips, setOwnedClips, clips }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredClips = filterClips(clips, selectedCategory);
  const clipCounts = countClipsByCategory(clips);
  const [huntNotification, setHuntNotification] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleHunt = () => {
    const randomClip = clips[Math.floor(Math.random() * clips.length)];
    const alreadyOwned = ownedClips.some(clip => clip.id === randomClip.id);
    if (!alreadyOwned) {
      setOwnedClips([...ownedClips, randomClip]);
      setHuntNotification(`Added ${randomClip.title} to your library!`);
      setTimeout(() => setHuntNotification(''), 2000);
    } else {
      setHuntNotification('Clip already owned!');
      setTimeout(() => setHuntNotification(''), 2000);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', position: 'relative' }}>
      <div className="hamburger-menu">
        <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger-button">
          ☰
        </button>
        {menuOpen && (
          <div className="menu-items">
            <div className="link-spacing"><Link to="/library" onClick={() => setMenuOpen(false)}>Go to Library</Link></div>
            <div className="link-spacing"><Link to="/waitlist" onClick={() => setMenuOpen(false)}>Join the Waitlist</Link></div>
            <div className="link-spacing"><Link to="/donate" onClick={() => setMenuOpen(false)}>Support ClipHunt</Link></div>
            <div className="link-spacing"><Link to="/profile" onClick={() => setMenuOpen(false)}>View Profile</Link></div>
          </div>
        )}
      </div>
      <div className="header">
        <h1>ClipHunt</h1>
        <p>Hunt clips, trade with friends, and win rewards!</p>
      </div>
      <button onClick={handleHunt}>Start Hunting</button>
      {huntNotification && <p style={{ color: 'green', marginTop: '10px' }}>{huntNotification}</p>}
      <h2>Clip Feed</h2>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={{ marginBottom: '20px', padding: '5px' }}
      >
        <option value="All">All Categories</option>
        <option value="Funny">Funny ({clipCounts.Funny || 0})</option>
        <option value="Sports">Sports ({clipCounts.Sports || 0})</option>
      </select>
      <div className="clip-feed">
        {filteredClips.map(clip => (
          <div key={clip.id} className="clip-item">
            <p>{clip.title} - <a href={clip.url} target="_blank" rel="noopener noreferrer">Watch</a></p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Library({ ownedClips, setOwnedClips, clips, clipCoins, setClipCoins }) {
  const [notification, setNotification] = useState({ show: false, message: '', isTrade: false });
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [showNotificationOverlay, setShowNotificationOverlay] = useState(false);

  const addNotificationToHistory = useCallback((message, isTrade) => {
    setNotificationHistory(prev => {
      const newHistory = [{ message, isTrade, timestamp: Date.now() }, ...prev].slice(0, 10);
      return newHistory;
    });
  }, []);

  const clearNotificationHistory = () => {
    setNotificationHistory([]);
  };

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const checkCompletedSets = useCallback(() => {
    const sets = {};
    ownedClips.forEach(clip => {
      sets[clip.setId] = (sets[clip.setId] || 0) + 1;
    });
    const allSets = [...new Set(clips.map(c => c.setId))];
    return allSets.filter(setId => 
      sets[setId] === clips.filter(c => c.setId === setId).length
    );
  }, [clips, ownedClips]);

  const handleSetCompletion = useCallback(() => {
    const completed = checkCompletedSets();
    if (completed.length > 0) {
      const coinsEarned = completed.length * 50; // 50 ClipCoins per set
      setClipCoins(prev => prev + coinsEarned);
      setNotification({ show: true, message: `Earned ${coinsEarned} ClipCoins for completing sets!`, isTrade: false });
      addNotificationToHistory(`Earned ${coinsEarned} ClipCoins for completing sets!`, false);
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    }
  }, [setClipCoins, setNotification, addNotificationToHistory]);

  const handleRemove = useCallback((id) => {
    const clipToRemove = ownedClips.find(clip => clip.id === id);
    if (clipToRemove) {
      setOwnedClips(ownedClips.filter(clip => clip.id !== id));
      const message = `Removed ${clipToRemove.title} from your library!`;
      setNotification({ show: true, message, isTrade: false });
      addNotificationToHistory(message, false);
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    }
  }, [ownedClips, setOwnedClips, setNotification, addNotificationToHistory]);

  const handleTrade = useCallback((id) => {
    const clipToTrade = ownedClips.find(clip => clip.id === id);
    if (!clipToTrade) return;
    const remainingClips = ownedClips.filter(clip => clip.id !== id);
    const availableClips = clips.filter(clip => !ownedClips.some(owned => owned.id === clip.id));
    if (availableClips.length === 0) {
      alert("No new clips available to trade!");
      return;
    }
    const randomClip = availableClips[Math.floor(Math.random() * availableClips.length)];
    setOwnedClips([...remainingClips, randomClip]);
    const message = `Traded ${clipToTrade.title} for ${randomClip.title}!`;
    setNotification({ show: true, message, isTrade: true });
    addNotificationToHistory(message, true);
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
  }, [ownedClips, clips, setOwnedClips, setNotification, addNotificationToHistory]);

  useEffect(() => {
    handleSetCompletion();
  }, [ownedClips, handleSetCompletion]);

  const completedSets = checkCompletedSets();

  return (
    <div style={{ textAlign: 'center', padding: '20px', position: 'relative' }}>
      <h1>My Library</h1>
      <h3>ClipCoins: {clipCoins}</h3>
      <div
        className="notification-icon"
        onClick={() => setShowNotificationOverlay(!showNotificationOverlay)}
      >
        🔔
      </div>
      {ownedClips.length === 0 ? (
        <p>No clips hunted yet!</p>
      ) : (
        <div className="library-feed">
          {ownedClips.map(clip => (
            <div key={clip.id} className="library-item">
              <p>{clip.title}</p>
              <button onClick={() => handleRemove(clip.id)}>Remove</button>
              <button onClick={() => handleTrade(clip.id)}>Trade</button>
            </div>
          ))}
        </div>
      )}
      {completedSets.length > 0 && (
        <div>
          <h2>Completed Sets</h2>
          {completedSets.map(setId => (
            <p key={setId}>Completed: {setId}!</p>
          ))}
        </div>
      )}
      <Link to="/" className="back-to-home">Back to Home</Link>
      {notification.show && (
        <div
          className={`notification-popup ${notification.isTrade ? 'notification-trade' : 'notification-remove'}`}
        >
          {notification.message}
        </div>
      )}
      {showNotificationOverlay && (
        <div className="notification-overlay">
          <h3>Notifications</h3>
          <button
            onClick={() => setShowNotificationOverlay(false)}
            className="close-button"
          >
            ✕
          </button>
          <button
            onClick={clearNotificationHistory}
            style={{ margin: '10px 0', backgroundColor: '#e74c3c' }}
          >
            Clear All
          </button>
          {notificationHistory.length === 0 ? (
            <p>No notifications yet.</p>
          ) : (
            notificationHistory.map((notif, index) => (
              <div
                key={index}
                className={`notification-item ${index % 2 === 0 ? 'even' : 'odd'}`}
              >
                <span>{notif.message}</span>
                <span className="notification-timestamp">{timeAgo(notif.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Waitlist({ waitlist, setWaitlist }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !email) {
      setMessage('Please enter both a username and email.');
      return;
    }
    const formattedUsername = `$${username}`;
    const alreadyTaken = waitlist.some(entry => entry.username === formattedUsername);
    if (alreadyTaken) {
      setMessage(`Sorry, ${formattedUsername} is already taken.`);
      return;
    }
    setWaitlist([...waitlist, { username: formattedUsername, email }]);
    setMessage(`Success! You've reserved ${formattedUsername}.`);
    setUsername('');
    setEmail('');
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Join the ClipHunt Waitlist</h1>
      <p>Reserve your $username and get early access!</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>$</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <button type="submit" className="join-waitlist-button">Join Waitlist</button>
      </form>
      {message && <p>{message}</p>}
      <Link to="/" className="back-to-home">Back to Home</Link>
    </div>
  );
}

function Donate() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Support ClipHunt</h1>
      <p>Donations will be available soon! Stay tuned.</p>
      <Link to="/" className="back-to-home">Back to Home</Link>
    </div>
  );
}

function Success() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Thank You!</h1>
      <Link to="/" className="back-to-home">Back to Home</Link>
    </div>
  );
}

function Cancel() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Cancelled</h1>
      <Link to="/" className="back-to-home">Back to Home</Link>
    </div>
  );
}

function Profile({ ownedClips, waitlist }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>My Profile</h1>
      <h2>Total Waitlist Users: {waitlist.length}</h2>
      <h2>Hunted Clips</h2>
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
      <h2>Waitlist Status</h2>
      {waitlist.length === 0 ? (
        <p>Not on the waitlist yet!</p>
      ) : (
        <div>
          {waitlist.map((entry, index) => (
            <p key={index}>Username: {entry.username}, Email: {entry.email}</p>
          ))}
        </div>
      )}
      <Link to="/" className="back-to-home">Back to Home</Link>
    </div>
  );
}

function App() {
  const [ownedClips, setOwnedClips] = useState(() => {
    const savedClips = localStorage.getItem('ownedClips');
    return savedClips ? JSON.parse(savedClips) : [];
  });
  const [waitlist, setWaitlist] = useState(() => {
    const savedWaitlist = localStorage.getItem('waitlist');
    return savedWaitlist ? JSON.parse(savedWaitlist) : [];
  });
  const [clipCoins, setClipCoins] = useState(() => {
    const savedCoins = localStorage.getItem('clipCoins');
    return savedCoins ? parseInt(savedCoins, 10) : 0;
  });
  const [clips] = useState([
    { id: 1, title: "Funny Cat Pt1", url: "https://www.pexels.com/video/cat-playing-with-toy-855282/", category: "Funny", setId: "cat-story" },
    { id: 2, title: "Funny Cat Pt2", url: "https://www.pexels.com/video/a-small-dog-running-around-10598107/", category: "Funny", setId: "cat-story" },
    { id: 3, title: "Epic Skate Pt1", url: "https://www.pexels.com/video/skateboarder-doing-a-trick-854302/", category: "Sports", setId: "skate-trick" },
    { id: 4, title: "Epic Skate Pt2", url: "https://www.pexels.com/video/a-man-surfing-857148/", category: "Sports", setId: "skate-trick" },
  ]);

  useEffect(() => {
    localStorage.setItem('ownedClips', JSON.stringify(ownedClips));
  }, [ownedClips]);

  useEffect(() => {
    localStorage.setItem('waitlist', JSON.stringify(waitlist));
  }, [waitlist]);

  useEffect(() => {
    localStorage.setItem('clipCoins', clipCoins.toString());
  }, [clipCoins]);

  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/" element={<Home ownedClips={ownedClips} setOwnedClips={setOwnedClips} clips={clips} />} />
          <Route path="/library" element={<Library ownedClips={ownedClips} setOwnedClips={setOwnedClips} clips={clips} clipCoins={clipCoins} setClipCoins={setClipCoins} />} />
          <Route path="/waitlist" element={<Waitlist waitlist={waitlist} setWaitlist={setWaitlist} />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/profile" element={<Profile ownedClips={ownedClips} waitlist={waitlist} />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
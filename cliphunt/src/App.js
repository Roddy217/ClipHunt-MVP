import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './App.css';

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

function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="hamburger-menu">
      <button onClick={() => setMenuOpen(!menuOpen)} className="hamburger-button">☰</button>
      {menuOpen && (
        <div className="menu-items">
          <div className="link-spacing"><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></div>
          <div className="link-spacing"><Link to="/library" onClick={() => setMenuOpen(false)}>Library</Link></div>
          <div className="link-spacing"><Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link></div>
          <div className="link-spacing"><Link to="/prizes" onClick={() => setMenuOpen(false)}>Prize Store</Link></div>
          <div className="link-spacing"><Link to="/waitlist" onClick={() => setMenuOpen(false)}>Waitlist</Link></div>
          <div className="link-spacing"><Link to="/donate" onClick={() => setMenuOpen(false)}>Donate</Link></div>
        </div>
      )}
    </div>
  );
}

function StickyFooter() {
  return (
    <div className="sticky-footer">
      <Link to="/" className="footer-link">🏠 Home</Link>
      <Link to="/library" className="footer-link">📚 Library</Link>
      <Link to="/profile" className="footer-link">👤 Profile</Link>
      <Link to="/prizes" className="footer-link">🏆 Prizes</Link>
    </div>
  );
}

function Home({ ownedClips, setOwnedClips, clips, archivedCollections }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableClips, setAvailableClips] = useState(clips);
  const filteredClips = filterClips(availableClips, selectedCategory);
  const clipCounts = countClipsByCategory(availableClips);
  const [huntNotification, setHuntNotification] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setAvailableClips(prev => {
        const toggle = Math.random() > 0.5;
        return toggle ? clips.filter(() => Math.random() > 0.2) : clips;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [clips]);

  const handleHunt = () => {
    const huntableClips = availableClips.filter(clip => !archivedCollections.includes(clip.setId));
    if (huntableClips.length === 0) {
      setHuntNotification('No new clips available to hunt!');
      setTimeout(() => setHuntNotification(''), 2000);
      return;
    }
    const randomClip = huntableClips[Math.floor(Math.random() * huntableClips.length)];
    const alreadyOwned = ownedClips.some(clip => clip.id === randomClip.id);
    if (!alreadyOwned) {
      setOwnedClips([...ownedClips, randomClip]);
      setHuntNotification(`Added ${randomClip.title} (${randomClip.value} coins) to your library!`);
      setTimeout(() => setHuntNotification(''), 2000);
    } else {
      setHuntNotification('Clip already owned!');
      setTimeout(() => setHuntNotification(''), 2000);
    }
  };

  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <div className="header">
            <h1>ClipHunt</h1>
            <p>Hunt clips, trade with friends, and win rewards!</p>
          </div>
          <button onClick={handleHunt}>Start Hunting</button>
          {huntNotification && <p style={{ color: 'green', marginTop: '10px' }}>{huntNotification}</p>}
          <h2>Clip Feed</h2>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="category-select">
            <option value="All">All Categories ({clipCounts.All || availableClips.length})</option>
            <option value="Funny">Funny ({clipCounts.Funny || 0})</option>
            <option value="Sports">Sports ({clipCounts.Sports || 0})</option>
            <option value="Music">Music ({clipCounts.Music || 0})</option>
            <option value="Gaming">Gaming ({clipCounts.Gaming || 0})</option>
          </select>
        </div>
        <div className="clip-feed">
          {filteredClips.map(clip => (
            <div key={clip.id} className="clip-item">
              <p>{clip.title} - {clip.value} coins - <a href={clip.url} target="_blank" rel="noopener noreferrer">Watch</a></p>
            </div>
          ))}
        </div>
      </div>
      <StickyFooter />
    </div>
  );
}

function Library({ ownedClips, setOwnedClips, clips, clipCoins, setClipCoins, archivedCollections }) {
  const [notification, setNotification] = useState({ show: false, message: '', isTrade: false });
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [showNotificationOverlay, setShowNotificationOverlay] = useState(false);

  const addNotificationToHistory = useCallback((message, isTrade) => {
    setNotificationHistory(prev => [{ message, isTrade, timestamp: Date.now() }, ...prev].slice(0, 10));
  }, []);

  const clearNotificationHistory = () => setNotificationHistory([]);

  const timeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const checkCompletedSets = useCallback(() => {
    const sets = {};
    ownedClips.forEach(clip => {
      sets[clip.setId] = (sets[clip.setId] || 0) + 1;
    });
    const allSets = [...new Set(clips.map(c => c.setId))];
    return allSets.filter(setId => sets[setId] === clips.filter(c => c.setId === setId).length);
  }, [clips, ownedClips]);

  const handleSetCompletion = useCallback(() => {
    const completed = checkCompletedSets();
    if (completed.length > 0) {
      const coinsEarned = completed.length * 50;
      setClipCoins(prev => prev + coinsEarned);
      setNotification({ show: true, message: `Earned ${coinsEarned} ClipCoins for completing sets!`, isTrade: false });
      addNotificationToHistory(`Earned ${coinsEarned} ClipCoins for completing sets!`, false);
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    }
  }, [setClipCoins, setNotification, addNotificationToHistory, checkCompletedSets]);

  const handleRemove = useCallback((id) => {
    const clipToRemove = ownedClips.find(clip => clip.id === id);
    if (clipToRemove && !archivedCollections.includes(clipToRemove.setId)) {
      setOwnedClips(ownedClips.filter(clip => clip.id !== id));
      setNotification({ show: true, message: `Removed ${clipToRemove.title} (${clipToRemove.value} coins)!`, isTrade: false });
      addNotificationToHistory(`Removed ${clipToRemove.title} (${clipToRemove.value} coins)`, false);
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    } else if (clipToRemove) {
      setNotification({ show: true, message: `Cannot remove ${clipToRemove.title} - it's in an archived collection!`, isTrade: false });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    }
  }, [ownedClips, setOwnedClips, setNotification, addNotificationToHistory, archivedCollections]);

  const handleTrade = useCallback((id) => {
    const clipToTrade = ownedClips.find(clip => clip.id === id);
    if (clipToTrade && !archivedCollections.includes(clipToTrade.setId)) {
      const remainingClips = ownedClips.filter(clip => clip.id !== id);
      const availableClips = clips.filter(clip => !ownedClips.some(owned => owned.id === clip.id) && !archivedCollections.includes(clip.setId));
      if (availableClips.length === 0) {
        alert("No new clips available to trade!");
        return;
      }
      const randomClip = availableClips[Math.floor(Math.random() * availableClips.length)];
      setOwnedClips([...remainingClips, randomClip]);
      setNotification({ show: true, message: `Traded ${clipToTrade.title} (${clipToTrade.value} coins) for ${randomClip.title} (${randomClip.value} coins)!`, isTrade: true });
      addNotificationToHistory(`Traded ${clipToTrade.title} for ${randomClip.title}`, true);
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    } else if (clipToTrade) {
      setNotification({ show: true, message: `Cannot trade ${clipToTrade.title} - it's in an archived collection!`, isTrade: false });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    }
  }, [ownedClips, clips, setOwnedClips, setNotification, addNotificationToHistory, archivedCollections]);

  const handleRedeem = () => {
    if (clipCoins >= 100) {
      setClipCoins(prev => prev - 100);
      setNotification({ show: true, message: 'Redeemed 100 ClipCoins for a prize!', isTrade: false });
      addNotificationToHistory('Redeemed 100 ClipCoins for a prize!', false);
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    } else {
      alert('Need 100 ClipCoins to redeem a prize!');
    }
  };

  useEffect(() => {
    handleSetCompletion();
  }, [ownedClips, handleSetCompletion]);

  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>My Library</h1>
          <h3>ClipCoins: {clipCoins}</h3>
          <button onClick={handleRedeem} className="redeem-button">Redeem Prize (100 Coins)</button>
          <Link to="/prizes" className="redeem-link">Visit Prize Store</Link>
        </div>
        <div className="notification-icon" onClick={() => setShowNotificationOverlay(!showNotificationOverlay)}>🔔</div>
        {ownedClips.length === 0 ? (
          <p className="centered-section">No clips hunted yet!</p>
        ) : (
          <div className="library-feed">
            {ownedClips.map(clip => (
              <div key={clip.id} className="library-item">
                <p>{clip.title} - {clip.value} coins</p>
                <button onClick={() => handleRemove(clip.id)}>Remove</button>
                <button onClick={() => handleTrade(clip.id)}>Trade</button>
              </div>
            ))}
          </div>
        )}
        {notification.show && (
          <div className={`notification-popup ${notification.isTrade ? 'notification-trade' : 'notification-remove'}`}>
            {notification.message}
          </div>
        )}
        {showNotificationOverlay && (
          <div className="notification-overlay">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotificationOverlay(false)} className="close-button">✕</button>
            <button onClick={clearNotificationHistory} className="clear-button">Clear All</button>
            {notificationHistory.length === 0 ? (
              <p>No notifications yet.</p>
            ) : (
              notificationHistory.map((notif, index) => (
                <div key={index} className={`notification-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                  <span>{notif.message}</span>
                  <span className="notification-timestamp">{timeAgo(notif.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <StickyFooter />
    </div>
  );
}

function Profile({ ownedClips, clips, setOwnedClips, archivedCollections, setArchivedCollections }) {
  const [selectedCollection, setSelectedCollection] = useState(null);

  const collections = [
    { title: "Cat Chronicles", setId: "cat-story", totalValue: 30 },
    { title: "Skate Legends", setId: "skate-trick", totalValue: 40 },
    { title: "Music Vibes", setId: "music-mix", totalValue: 50 },
    { title: "Game Highlights", setId: "game-epic", totalValue: 60 },
    { title: "Comedy Gold", setId: "funny-bits", totalValue: 45 },
    { title: "Sporting Feats", setId: "sport-moments", totalValue: 55 },
  ];

  const getCollectionStatus = (setId) => {
    const total = clips.filter(c => c.setId === setId).length;
    const owned = ownedClips.filter(c => c.setId === setId).length;
    return { total, owned, isComplete: owned === total, isArchived: archivedCollections.includes(setId) };
  };

  const handleArchive = (setId) => {
    const { isComplete } = getCollectionStatus(setId);
    if (isComplete && !archivedCollections.includes(setId)) {
      setArchivedCollections([...archivedCollections, setId]);
      setOwnedClips(ownedClips.filter(clip => clip.setId !== setId));
    }
  };

  const archivedClips = clips.filter(clip => archivedCollections.includes(clip.setId));

  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>My Profile</h1>
          <h2>My Collections</h2>
        </div>
        <div className="collection-feed">
          {collections.map(collection => {
            const { total, owned, isComplete, isArchived } = getCollectionStatus(collection.setId);
            return (
              <div
                key={collection.setId}
                className={`collection-box ${isComplete || isArchived ? 'complete' : 'incomplete'} ${isArchived ? 'archived' : ''}`}
                onClick={() => setSelectedCollection(collection.setId === selectedCollection ? null : collection.setId)}
              >
                <h3>{collection.title}</h3>
                <p>Clips: {owned}/{total}</p>
                <p>Value: {collection.totalValue} coins</p>
                {isComplete && !isArchived && (
                  <button onClick={(e) => { e.stopPropagation(); handleArchive(collection.setId); }} className="archive-button">
                    Archive Clips
                  </button>
                )}
                {(isComplete || isArchived) && <span className="complete-message">Collection Complete</span>}
                <span className={isComplete || isArchived ? 'checkmark' : 'clock'}>{isComplete || isArchived ? '✓' : '⏰'}</span>
              </div>
            );
          })}
        </div>
        {selectedCollection && (
          <div className="collection-details">
            <h3 className="centered-section">{collections.find(c => c.setId === selectedCollection).title} Details</h3>
            <div className="clip-list">
              {clips.filter(clip => clip.setId === selectedCollection).map(clip => (
                <div key={clip.id} className="clip-entry">
                  <span>{clip.title}</span>
                  <span className={ownedClips.some(c => c.id === clip.id) || archivedCollections.includes(clip.setId) ? 'check-box' : 'empty-box'}>
                    {(ownedClips.some(c => c.id === clip.id) || archivedCollections.includes(clip.setId)) ? '✔' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {archivedClips.length > 0 && (
          <div className="archived-library">
            <h2 className="centered-section">Archived Library</h2>
            <div className="library-feed">
              {archivedClips.map(clip => (
                <div key={clip.id} className="library-item archived">
                  <p>{clip.title} - {clip.value} coins (Archived)</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <StickyFooter />
    </div>
  );
}

function Prizes({ clipCoins, setClipCoins, setNotification }) {
  const prizes = [
    { id: 1, name: 'Extra Clip Slot', cost: 100, description: 'Add one more slot to your library.' },
    { id: 2, name: 'Rare Clip Badge', cost: 200, description: 'Show off your rare clip status.' },
  ];

  const handleRedeem = (prize) => {
    if (clipCoins >= prize.cost) {
      setClipCoins(prev => prev - prize.cost);
      setNotification({ show: true, message: `Redeemed ${prize.name} for ${prize.cost} ClipCoins!`, isTrade: false });
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000);
    } else {
      alert(`Need ${prize.cost} ClipCoins to redeem ${prize.name}!`);
    }
  };

  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>Prize Store</h1>
          <h3>ClipCoins: {clipCoins}</h3>
        </div>
        <div className="prize-feed">
          {prizes.map(prize => (
            <div key={prize.id} className="prize-item">
              <h4>{prize.name}</h4>
              <p>{prize.description}</p>
              <p>Cost: {prize.cost} ClipCoins</p>
              <button onClick={() => handleRedeem(prize)}>Redeem</button>
            </div>
          ))}
        </div>
      </div>
      <StickyFooter />
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
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>Join the ClipHunt Waitlist</h1>
          <p>Reserve your $username and get early access!</p>
        </div>
        <form onSubmit={handleSubmit} className="waitlist-form">
          <div className="input-group">
            <label>$</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="divider"></div>
          <button type="submit" className="join-waitlist-button">Join Waitlist</button>
        </form>
        {message && <p className="waitlist-message">{message}</p>}
      </div>
      <StickyFooter />
    </div>
  );
}

function Donate() {
  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>Support ClipHunt</h1>
          <p>Donations will be available soon! Stay tuned.</p>
        </div>
      </div>
      <StickyFooter />
    </div>
  );
}

function Success() {
  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>Thank You!</h1>
        </div>
      </div>
      <StickyFooter />
    </div>
  );
}

function Cancel() {
  return (
    <div className="page-container">
      <HamburgerMenu />
      <div className="content">
        <div className="centered-section">
          <h1>Cancelled</h1>
        </div>
      </div>
      <StickyFooter />
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
  const [notification, setNotification] = useState({ show: false, message: '', isTrade: false });
  const [archivedCollections, setArchivedCollections] = useState(() => {
    const saved = localStorage.getItem('archivedCollections');
    return saved ? JSON.parse(saved) : [];
  });
  const [clips] = useState([
    { id: 1, title: "Funny Cat Pt1", url: "https://www.pexels.com/video/cat-playing-with-toy-855282/", category: "Funny", setId: "cat-story", value: 10 },
    { id: 2, title: "Funny Cat Pt2", url: "https://www.pexels.com/video/a-small-dog-running-around-10598107/", category: "Funny", setId: "cat-story", value: 10 },
    { id: 3, title: "Cat Nap", url: "https://www.pexels.com/video/cat-sleeping-855282/", category: "Funny", setId: "cat-story", value: 10 },
    { id: 4, title: "Epic Skate Pt1", url: "https://www.pexels.com/video/skateboarder-doing-a-trick-854302/", category: "Sports", setId: "skate-trick", value: 10 },
    { id: 5, title: "Epic Skate Pt2", url: "https://www.pexels.com/video/a-man-surfing-857148/", category: "Sports", setId: "skate-trick", value: 10 },
    { id: 6, title: "Skate Flip", url: "https://www.pexels.com/video/skateboard-trick-854303/", category: "Sports", setId: "skate-trick", value: 10 },
    { id: 7, title: "Grind Master", url: "https://www.pexels.com/video/skateboard-grind-854304/", category: "Sports", setId: "skate-trick", value: 10 },
    { id: 8, title: "Guitar Solo", url: "https://www.pexels.com/video/guitar-player-855285/", category: "Music", setId: "music-mix", value: 10 },
    { id: 9, title: "Drum Beat", url: "https://www.pexels.com/video/drummer-playing-855286/", category: "Music", setId: "music-mix", value: 10 },
    { id: 10, title: "Piano Flow", url: "https://www.pexels.com/video/piano-performance-855287/", category: "Music", setId: "music-mix", value: 10 },
    { id: 11, title: "Bass Drop", url: "https://www.pexels.com/video/bass-player-855288/", category: "Music", setId: "music-mix", value: 10 },
    { id: 12, title: "Live Jam", url: "https://www.pexels.com/video/band-jamming-855289/", category: "Music", setId: "music-mix", value: 10 },
    { id: 13, title: "Headshot King", url: "https://www.pexels.com/video/gaming-headshot-855290/", category: "Gaming", setId: "game-epic", value: 12 },
    { id: 14, title: "Speed Run", url: "https://www.pexels.com/video/speed-run-855291/", category: "Gaming", setId: "game-epic", value: 12 },
    { id: 15, title: "Boss Fight", url: "https://www.pexels.com/video/boss-battle-855292/", category: "Gaming", setId: "game-epic", value: 12 },
    { id: 16, title: "Clutch Win", url: "https://www.pexels.com/video/clutch-moment-855293/", category: "Gaming", setId: "game-epic", value: 12 },
    { id: 17, title: "Team Play", url: "https://www.pexels.com/video/team-strategy-855294/", category: "Gaming", setId: "game-epic", value: 12 },
    { id: 18, title: "Prank Fail", url: "https://www.pexels.com/video/prank-gone-wrong-855295/", category: "Funny", setId: "funny-bits", value: 11 },
    { id: 19, title: "Dog Chaos", url: "https://www.pexels.com/video/dog-mess-855296/", category: "Funny", setId: "funny-bits", value: 11 },
    { id: 20, title: "Kid Blooper", url: "https://www.pexels.com/video/kid-fail-855297/", category: "Funny", setId: "funny-bits", value: 11 },
    { id: 21, title: "Slip Up", url: "https://www.pexels.com/video/slip-fall-855298/", category: "Funny", setId: "funny-bits", value: 12 },
    { id: 22, title: "Slam Dunk", url: "https://www.pexels.com/video/basketball-dunk-855299/", category: "Sports", setId: "sport-moments", value: 14 },
    { id: 23, title: "Goal Rush", url: "https://www.pexels.com/video/soccer-goal-855300/", category: "Sports", setId: "sport-moments", value: 13 },
    { id: 24, title: "Home Run", url: "https://www.pexels.com/video/baseball-homer-855301/", category: "Sports", setId: "sport-moments", value: 14 },
    { id: 25, title: "Bike Stunt", url: "https://www.pexels.com/video/bmx-trick-855302/", category: "Sports", setId: "sport-moments", value: 14 },
    { id: 26, title: "Dance Off", url: "https://www.pexels.com/video/dance-battle-855303/", category: "Music", setId: "music-mix", value: 10 },
    { id: 27, title: "Pet Trick", url: "https://www.pexels.com/video/pet-skill-855304/", category: "Funny", setId: "funny-bits", value: 11 },
    { id: 28, title: "Parkour Run", url: "https://www.pexels.com/video/parkour-855305/", category: "Sports", setId: "sport-moments", value: 14 },
    { id: 29, title: "No Scope", url: "https://www.pexels.com/video/no-scope-855306/", category: "Gaming", setId: "game-epic", value: 12 },
    { id: 30, title: "Mic Drop", url: "https://www.pexels.com/video/mic-drop-855307/", category: "Music", setId: "music-mix", value: 10 },
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

  useEffect(() => {
    localStorage.setItem('archivedCollections', JSON.stringify(archivedCollections));
  }, [archivedCollections]);

  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/" element={<Home ownedClips={ownedClips} setOwnedClips={setOwnedClips} clips={clips} archivedCollections={archivedCollections} />} />
          <Route path="/library" element={<Library ownedClips={ownedClips} setOwnedClips={setOwnedClips} clips={clips} clipCoins={clipCoins} setClipCoins={setClipCoins} archivedCollections={archivedCollections} />} />
          <Route path="/profile" element={<Profile ownedClips={ownedClips} clips={clips} setOwnedClips={setOwnedClips} archivedCollections={archivedCollections} setArchivedCollections={setArchivedCollections} />} />
          <Route path="/prizes" element={<Prizes clipCoins={clipCoins} setClipCoins={setClipCoins} setNotification={setNotification} />} />
          <Route path="/waitlist" element={<Waitlist waitlist={waitlist} setWaitlist={setWaitlist} />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
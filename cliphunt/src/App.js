import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import './App.css';

// Initialize Stripe with your Publishable Key
const stripePromise = loadStripe('pk_test_51R36ot5Cp3FKy9pXvMULLqndqDyUzGP42VrvtY249XJndkp3V6LBDXLKuFZVtkxPwPKK1CCoGL9prPY33izsv1l500e0CIZUX9');

function Home({ ownedClips, setOwnedClips }) {
  const [clips] = useState([
    { id: 1, title: "Funny Cat", url: "https://www.pexels.com/video/cat-playing-with-toy-855282/" },
    { id: 2, title: "Epic Skate", url: "https://www.pexels.com/video/skateboarder-doing-a-trick-854302/" },
    { id: 3, title: "Dancing Dog", url: "https://www.pexels.com/video/a-small-dog-running-around-10598107/" },
    { id: 4, title: "Surfing Wave", url: "https://www.pexels.com/video/a-man-surfing-857148/" },
  ]);
  const handleHunt = () => {
    const randomClip = clips[Math.floor(Math.random() * clips.length)];
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
      <div className="link-spacing"><Link to="/library">Go to Library</Link></div>
      <div className="link-spacing"><Link to="/waitlist">Join the Waitlist</Link></div>
      <div className="link-spacing"><Link to="/donate">Support ClipHunt</Link></div>
    </div>
  );
}

function Library({ ownedClips, setOwnedClips }) {
  const handleRemove = (id) => {
    setOwnedClips(ownedClips.filter(clip => clip.id !== id));
  };
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>My Library</h1>
      {ownedClips.length === 0 ? (
        <p>No clips hunted yet!</p>
      ) : (
        <div className="library-feed">
          {ownedClips.map(clip => (
            <div key={clip.id} className="library-item">
              <p>{clip.title} <button onClick={() => handleRemove(clip.id)}>Remove</button></p>
            </div>
          ))}
        </div>
      )}
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function Waitlist() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [waitlist, setWaitlist] = useState([]);
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
        <button type="submit">Join Waitlist</button>
      </form>
      {message && <p>{message}</p>}
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function Donate() {
  const handleDonate = async () => {
    const stripe = await stripePromise;
    const { error } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: 'price_1R37Pl5Cp3FKy9pX0WK8hoRu', // Updated with your Stripe Price ID
          quantity: 1,
        },
      ],
      mode: 'payment',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    });
    if (error) {
      console.warn(error.message);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Support ClipHunt</h1>
      <p>Your donation helps keep ClipHunt growing!</p>
      <button onClick={handleDonate}>Donate Now</button>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function Success() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Thank You!</h1>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function Cancel() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Cancelled</h1>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

function App() {
  const [ownedClips, setOwnedClips] = useState([]);
  return (
    <Elements stripe={stripePromise}>
      <Router>
        <Routes>
          <Route path="/" element={<Home ownedClips={ownedClips} setOwnedClips={setOwnedClips} />} />
          <Route path="/library" element={<Library ownedClips={ownedClips} setOwnedClips={setOwnedClips} />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
        </Routes>
      </Router>
    </Elements>
  );
}

export default App;
import logo from './logo.svg';
import './App.css';

function App() {
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
    </div>
  );
}
export default App;

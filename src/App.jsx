import { useRef, useEffect, useCallback, useState } from 'react';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState('/sample.mp4');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const speedOptions = [0.2,0.4,0.6,0.8,1.0,1.2,1.4,1.6,1.8,2.0,3.0,5.0];

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  // Seek helper
  const seek = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  // Expand video to fit window
  const expandToWindow = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
      video.msRequestFullscreen();
    }
  }, []);

  // Toggle theater mode
  const toggleTheaterMode = () => {
    setIsTheater((prev) => !prev);
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === videoRef.current ||
        document.webkitFullscreenElement === videoRef.current ||
        document.msFullscreenElement === videoRef.current
      );
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Set playback rate on video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Change playback speed
  const changeSpeed = (dir) => {
    const idx = speedOptions.findIndex(opt => Math.abs(opt - playbackRate) < 0.001);
    let newIdx = idx + dir;
    if (newIdx < 0) newIdx = 0;
    if (newIdx >= speedOptions.length) newIdx = speedOptions.length - 1;
    setPlaybackRate(speedOptions[newIdx]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input or textarea
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
      // Number keys 0-9: seek to 0/10, 1/10, ..., 9/10 of duration
      if (e.key >= '0' && e.key <= '9' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const video = videoRef.current;
        if (video && video.duration) {
          const num = parseInt(e.key, 10);
          video.currentTime = (video.duration * num) / 10;
          e.preventDefault();
        }
        return;
      }
      switch (e.key.toLowerCase()) {
        case ' ': // Space
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'j':
          seek(-10);
          break;
        case 'l':
          seek(10);
          break;
        case 'arrowleft':
          seek(-5);
          break;
        case 'arrowright':
          seek(5);
          break;
        case 'f':
          expandToWindow();
          break;
        case 't':
          toggleTheaterMode();
          break;
        case '>':
          changeSpeed(1);
          break;
        case '<':
          changeSpeed(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seek, expandToWindow, toggleTheaterMode, playbackRate]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  return (
    <div className={`video-player-container${isTheater ? ' theater' : ''}`}>
      <h1>React Video Player</h1>
      <input type="file" accept="video/*" onChange={handleFileChange} style={{ marginBottom: 16 }} />
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="playbackRate" style={{ marginRight: 8 }}>Speed:</label>
        <select
          id="playbackRate"
          value={playbackRate}
          onChange={e => setPlaybackRate(Number(e.target.value))}
        >
          {speedOptions.map(opt => (
            <option key={opt} value={opt}>{opt}x</option>
          ))}
        </select>
      </div>
      <button onClick={toggleTheaterMode} style={{ marginBottom: 16, marginRight: 8 }}>
        {isTheater ? 'Exit Theater Mode' : 'Theater Mode (T)'}
      </button>
      <button onClick={expandToWindow} style={{ marginBottom: 16 }}>
        {isFullscreen ? 'Exit Fullscreen' : 'Expand to Window (F)'}
      </button>
      <video
        ref={videoRef}
        width={isTheater ? '100%' : isFullscreen ? '100%' : '720'}
        controls
        style={{
          borderRadius: 8,
          background: '#000',
          width: isTheater ? '80vw' : isFullscreen ? '100vw' : 720,
          height: isTheater ? '60vh' : isFullscreen ? '100vh' : 'auto',
          maxWidth: '100%',
          transition: 'width 0.3s, height 0.3s',
          display: 'block',
          margin: '0 auto',
        }}
        src={videoSrc}
      >
        Your browser does not support the video tag.
      </video>
      <div className="shortcuts">
        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li><b>Space</b> or <b>K</b>: Play/Pause</li>
          <li><b>J</b>: Rewind 10 seconds</li>
          <li><b>L</b>: Fast forward 10 seconds</li>
          <li><b>Left Arrow</b>: Rewind 5 seconds</li>
          <li><b>Right Arrow</b>: Fast forward 5 seconds</li>
          <li><b>T</b>: Toggle Theater Mode</li>
          <li><b>F</b>: Expand to Window / Fullscreen</li>
          <li><b>Shift + .</b> ({'>'}): Next Speed</li>
          <li><b>Shift + ,</b> ({'<' }): Previous Speed</li>
          <li><b>0-9</b>: Jump to 0%, 10%, ..., 90% of video</li>
        </ul>
        <div style={{marginTop:8}}><b>Current Speed: {playbackRate}x</b></div>
      </div>
    </div>
  );
}

export default App;

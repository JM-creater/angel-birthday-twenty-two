import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Mail,
  Cake,
  Music,
  VolumeX,
  Sparkles,
  Flame,
  Wind,
  Mic,
  BookOpen
} from 'lucide-react';
import { BirthdayScene3D, type SceneMode } from './components/BirthdayScene3D';
import { LoveLetterModal } from './components/LoveLetterModal';
import { soundManager } from './utils/soundEffects';
import './App.css';

export function App() {
  const [mode, setMode] = useState<SceneMode>('envelope');
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [candlesLit, setCandlesLit] = useState(true);
  const [wishMadeCount, setWishMadeCount] = useState(0);
  const [isPlayingMelody, setIsPlayingMelody] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnimRef = useRef<number>(0);

  const triggerCelebrationConfetti = useCallback(() => {
    confetti({
      particleCount: 85,
      spread: 80,
      origin: { y: 0.62 },
      colors: ['#fb7185', '#fde047', '#f43f5e', '#f9a8d4', '#fffbeb']
    });
  }, []);

  // Unseal the 3D envelope & open the romantic letter modal
  const handleEnvelopeAction = useCallback(() => {
    soundManager.playEnvelopeOpen();
    if (!isEnvelopeOpen) {
      setIsEnvelopeOpen(true);
      triggerCelebrationConfetti();
      window.setTimeout(() => {
        setIsLetterModalOpen(true);
      }, 650);
    } else {
      setIsLetterModalOpen(true);
    }
  }, [isEnvelopeOpen, triggerCelebrationConfetti]);

  // Stop microphone listener helper
  const stopMicBlowListener = useCallback(() => {
    if (micAnimRef.current) {
      cancelAnimationFrame(micAnimRef.current);
      micAnimRef.current = 0;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setIsListeningMic(false);
  }, []);

  // Blow out or relight the 22nd birthday candles
  const handleBlowOutCandles = useCallback(() => {
    if (candlesLit) {
      setCandlesLit(false);
      setWishMadeCount((c) => c + 1);
      stopMicBlowListener();
      soundManager.playWishGranted();
      triggerCelebrationConfetti();

      // Second burst of fireworks confetti
      window.setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0.15, y: 0.65 },
          colors: ['#fb7185', '#fde047', '#f43f5e']
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 0.85, y: 0.65 },
          colors: ['#fb7185', '#fde047', '#f43f5e']
        });
      }, 320);
    } else {
      setCandlesLit(true);
      soundManager.playHeartChime(4);
    }
  }, [candlesLit, stopMicBlowListener, triggerCelebrationConfetti]);

  // Optional microphone blow detection for mobile/desktop
  const toggleMicBlowDetection = async () => {
    if (isListeningMic) {
      stopMicBlowListener();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setIsListeningMic(true);

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkBlow = () => {
        analyser.getByteFrequencyData(dataArray);
        // Low-mid frequency energy characteristic of blowing into phone mic
        let sum = 0;
        for (let i = 0; i < 28; i++) {
          sum += dataArray[i];
        }
        const avg = sum / 28;
        if (avg > 105) {
          handleBlowOutCandles();
          audioCtx.close().catch(() => {});
          return;
        }
        micAnimRef.current = requestAnimationFrame(checkBlow);
      };

      micAnimRef.current = requestAnimationFrame(checkBlow);
    } catch {
      // If mic permission is denied or unavailable, immediately blow out candles gracefully
      handleBlowOutCandles();
    }
  };

  useEffect(() => {
    return () => {
      stopMicBlowListener();
    };
  }, [stopMicBlowListener]);

  const handleToggleMusic = () => {
    soundManager.toggleBirthdayMelody((playing) => {
      setIsPlayingMelody(playing);
    });
  };

  return (
    <div className="app-shell">
      {/* Ambient Radial Glow Layers */}
      <div className="ambient-glow ambient-glow-top" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-bottom" aria-hidden="true" />

      {/* Interactive 3D Three.js Canvas */}
      <BirthdayScene3D
        mode={mode}
        isEnvelopeOpen={isEnvelopeOpen}
        candlesLit={candlesLit}
        onEnvelopeTap={handleEnvelopeAction}
        onCandleTap={handleBlowOutCandles}
      />

      {/* Top HUD Header */}
      <header className="hud-header">
        <div className="brand-block">
          <div className="chapter-pill">
            <Sparkles size={12} />
            <span>CHAPTER 22 • HAPPY BIRTHDAY ANGEL</span>
          </div>
          <h1 className="main-title">
            To My Lablab, <span className="gold-italic">Angel</span>
          </h1>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={`hud-icon-btn ${isPlayingMelody ? 'playing' : ''}`}
            onClick={handleToggleMusic}
            aria-label={isPlayingMelody ? 'Stop birthday melody' : 'Play birthday melody'}
            title="Play Music Box Birthday Melody"
          >
            {isPlayingMelody ? <Music size={17} /> : <VolumeX size={17} />}
            <span className="btn-label-desktop">
              {isPlayingMelody ? 'Playing...' : 'Melody'}
            </span>
          </button>

          <button
            type="button"
            className="hud-letter-btn"
            onClick={() => {
              soundManager.playEnvelopeOpen();
              setIsEnvelopeOpen(true);
              setIsLetterModalOpen(true);
            }}
          >
            <BookOpen size={16} />
            <span>Read Letter</span>
          </button>
        </div>
      </header>

      {/* Interactive 3D Touch Hint Pill */}
      <div className="touch-hint-banner">
        <span>
          {mode === 'envelope'
            ? '✨ Drag to spin 3D • Tap the envelope to unseal your letter'
            : candlesLit
              ? '🎂 Close your eyes, make a 22nd birthday wish & tap the candles!'
              : '🎉 Happy 22nd Birthday, my Angel! May every wish come true!'}
        </span>
      </div>

      {/* Bottom Interactive Stage Card + Mode Navigation Dock */}
      <footer className="hud-footer">
        {/* Contextual Stage Card depending on 3D Mode */}
        {mode === 'envelope' && (
          <div className="stage-glass-card">
            <div className="stage-card-content">
              <span className="stage-badge">💌 Special 22nd Birthday Gift</span>
              <h2 className="stage-heading">A Sealed Letter For My Angel</h2>
              <p className="stage-description">
                Tap the 3D envelope above or press the button below to break the wax seal and read my birthday letter for you, Lablab.
              </p>
            </div>
            <div className="stage-card-actions">
              <button
                type="button"
                className="primary-cta-btn"
                onClick={handleEnvelopeAction}
              >
                <Mail size={18} />
                <span>
                  {isEnvelopeOpen ? 'Open Birthday Letter 💌' : 'Unseal Your Letter ✨'}
                </span>
              </button>
            </div>
          </div>
        )}

        {mode === 'cake' && (
          <div className="stage-glass-card">
            <div className="stage-card-content">
              <span className="stage-badge">
                {candlesLit ? '🕯️ Make Your 22nd Birthday Wish' : '✨ Wish Sealed in the Stars!'}
              </span>
              <h2 className="stage-heading">
                {candlesLit
                  ? 'Happy 22nd Birthday, My Lablab!'
                  : 'Yay! Happy 22nd Birthday, Angel! 🥳'}
              </h2>
              <p className="stage-description">
                {candlesLit
                  ? 'Make a wish in your heart, then tap the 3D cake candles—or use your microphone to blow them out!'
                  : `You've blown out your 22nd birthday candles${wishMadeCount > 1 ? ` (${wishMadeCount}x)` : ''}! I pray all your heart's desires blossom this year.`}
              </p>
            </div>

            <div className="stage-card-actions dual-actions">
              <button
                type="button"
                className="primary-cta-btn"
                onClick={handleBlowOutCandles}
              >
                {candlesLit ? (
                  <>
                    <Wind size={18} />
                    <span>Blow Out Candles 🌬️</span>
                  </>
                ) : (
                  <>
                    <Flame size={18} />
                    <span>Relight Candles 🕯️</span>
                  </>
                )}
              </button>

              {candlesLit ? (
                <button
                  type="button"
                  className={`secondary-cta-btn ${isListeningMic ? 'mic-active' : ''}`}
                  onClick={toggleMicBlowDetection}
                >
                  <Mic size={16} />
                  <span>{isListeningMic ? 'Blow Now! 🌬️' : 'Blow with Mic'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-cta-btn"
                  onClick={() => setIsLetterModalOpen(true)}
                >
                  <BookOpen size={16} />
                  <span>Read Birthday Letter 💌</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom 2-Mode Navigation Dock (Thumb-friendly for Mobile) */}
        <nav className="mode-dock" aria-label="3D Gift Modes">
          <button
            type="button"
            className={`dock-btn ${mode === 'envelope' ? 'active' : ''}`}
            onClick={() => {
              setMode('envelope');
              soundManager.playHeartChime(0);
            }}
          >
            <Mail size={18} />
            <span>Love Letter</span>
          </button>

          <button
            type="button"
            className={`dock-btn ${mode === 'cake' ? 'active' : ''}`}
            onClick={() => {
              setMode('cake');
              soundManager.playHeartChime(2);
            }}
          >
            <Cake size={18} />
            <span>22nd Cake</span>
          </button>
        </nav>
      </footer>

      {/* Full Interactive Love Letter Dialog */}
      <LoveLetterModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        onGoToCake={() => {
          setIsLetterModalOpen(false);
          setMode('cake');
        }}
      />
    </div>
  );
}

export default App;

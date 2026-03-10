import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WebcamTracker from '../components/WebcamTracker';
import PuzzleModal from '../components/PuzzleModal';
import SessionStats from '../components/SessionStats';

const Session = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [faceVisible, setFaceVisible] = useState(false);
  const [isLookingForward, setIsLookingForward] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [backendResponse, setBackendResponse] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);

  const distractionRef = useRef(0);
  const sessionTimeRef = useRef(0);
  const activeTimeRef = useRef(0);
  const warningCountRef = useRef(0);
  const isFinishedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;
  const module = location.state?.module;

  const playerRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Keep refs in sync with state (so callbacks always have latest values)
  useEffect(() => { sessionTimeRef.current = sessionTime; }, [sessionTime]);
  useEffect(() => { activeTimeRef.current = activeTime; }, [activeTime]);
  useEffect(() => { warningCountRef.current = warningCount; }, [warningCount]);

  // ── Auto-end session when video finishes ──────────────────────────────────
  const handleEndSession = useCallback(async () => {
    if (isFinishedRef.current) return; // Prevent double-call
    isFinishedRef.current = true;

    const totalTime = sessionTimeRef.current;
    const active = activeTimeRef.current;
    const warnings = warningCountRef.current;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/session/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          totalTime,
          activeTime: active,
          warnings,
          courseTitle: `${course?.title || 'Course'} - ${module?.title || 'Lesson'}`,
          courseId: course?.id,
          moduleId: module?.id,
          totalModules: course?.modules?.length
        })
      });
      const data = await response.json();
      if (response.ok) {
        setBackendResponse(data);

        // Auto-next logic: If there are more modules, prepare to move to the next one
        const currentIndex = course?.modules?.findIndex(m => m.id === module?.id);
        if (currentIndex !== -1 && currentIndex < course.modules.length - 1) {
          const nextModule = course.modules[currentIndex + 1];
          setTimeout(() => {
            navigate('/session', { state: { course, module: nextModule }, replace: true });
            window.location.reload(); // Hard reload to ensure YT player re-initializes correctly
          }, 3000); // 3 second delay to show stats/progress
        }
      }
    } catch (err) {
      console.error('Session save error:', err);
    } finally {
      setIsFinished(true);
    }
  }, [course, module, navigate]);

  // ── YouTube Player setup ──────────────────────────────────────────────────
  useEffect(() => {
    let seekInterval = null;

    function initPlayer() {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: module?.videoId || course?.videoId || 'VaSjiJMrq24',
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          start: module?.startTime || course?.startTime || 0
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event) => {
            // Auto-end session when video ends
            if (event.data === window.YT.PlayerState.ENDED) {
              handleEndSession();
              return;
            }

            if (event.data === window.YT.PlayerState.PLAYING) {
              clearInterval(seekInterval);
              seekInterval = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  const currentTime = playerRef.current.getCurrentTime();
                  if (currentTime > lastTimeRef.current + 2) {
                    playerRef.current.seekTo(lastTimeRef.current, true);
                  } else {
                    lastTimeRef.current = currentTime;
                  }
                }
              }, 1000);
            } else {
              clearInterval(seekInterval);
            }
          }
        }
      });
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else {
      initPlayer();
    }

    return () => {
      clearInterval(seekInterval);
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [course, handleEndSession]);

  // ── Sync player pause state ───────────────────────────────────────────────
  useEffect(() => {
    if (playerReady && playerRef.current) {
      // Only play if face is visible and looking forward
      const shouldPlay = !isPaused && faceVisible && isLookingForward;
      shouldPlay ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
    }
  }, [isPaused, faceVisible, isLookingForward, playerReady]);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || isFinished) return;
    const interval = setInterval(() => {
      setSessionTime(p => p + 1);
      if (faceVisible && isLookingForward) setActiveTime(p => p + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isFinished, faceVisible, isLookingForward]);

  // ── Distraction tracking ──────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || isFinished) return;
    const interval = setInterval(() => {
      if (!faceVisible || !isLookingForward) {
        distractionRef.current += 1;
        if (distractionRef.current >= 3) {
          setWarningCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 3) setIsPaused(true);
            return newCount;
          });
          distractionRef.current = 0;
        }
      } else {
        distractionRef.current = 0;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isFinished, faceVisible, isLookingForward]);

  // ── Face detection callback ───────────────────────────────────────────────
  // ASYMMETRIC debounce:
  //  - Face FOUND  → update state immediately (so "face not detected" clears at once)
  //  - Face LOST   → wait 800ms before updating (prevents blinking from brief misses)
  const noFaceTimerRef = useRef(null);

  const handleDetection = useCallback((results) => {
    if (results.multiFaceLandmarks?.length > 0) {
      // Face is detected — clear the pending "no face" timer and update immediately
      clearTimeout(noFaceTimerRef.current);
      noFaceTimerRef.current = null;

      const landmarks = results.multiFaceLandmarks[0];
      const noseTip = landmarks[4];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const midPointX = (leftEye.x + rightEye.x) / 2;
      const eyeDistance = Math.abs(rightEye.x - leftEye.x);
      const looking = Math.abs(noseTip.x - midPointX) < eyeDistance * 0.35;

      setFaceVisible(true);
      setIsLookingForward(looking);
    } else {
      // Face is NOT detected — only commit after 800ms of continuous no-face
      // This absorbs brief detection dropouts without blinking the warning
      if (!noFaceTimerRef.current) {
        noFaceTimerRef.current = setTimeout(() => {
          setFaceVisible(false);
          setIsLookingForward(false);
          noFaceTimerRef.current = null;
        }, 800);
      }
    }
  }, []);

  const handleResolvePuzzle = () => {
    setWarningCount(0);
    setIsPaused(false);
  };

  // ── Finished state ────────────────────────────────────────────────────────
  if (isFinished) {
    return (
      <SessionStats
        stats={{ sessionTime, activeTime, warningCount }}
        certificateUrl={backendResponse?.certificateUrl}
        eligible={backendResponse?.eligible}
        onBack={() => navigate('/dashboard')}
      />
    );
  }

  const focusStatus = isPaused ? 'PAUSED' : (faceVisible ? (isLookingForward ? 'FOCUSED' : 'DISTRACTED') : 'NO FACE');
  const focusColor = isPaused ? '#f87171' : (faceVisible && isLookingForward ? '#34d399' : '#fbbf24');

  return (
    <div className="session-container">
      {/* Session Header */}
      <header className="header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="dashboard-brand">
            <div className="dashboard-brand-logo">IX</div>
            <span className="dashboard-brand-name">INTERNIXA</span>
          </div>
          <h1 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            {course?.title || 'Active Session'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent)' }}>
            Module: {module?.title || 'Live Session'}
          </p>
        </div>
        <button
          onClick={handleEndSession}
          className="primary-button"
          style={{ maxWidth: '160px', background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
        >
          ⏹ End Session
        </button>
      </header>

      {/* Main layout */}
      <div
        className="content-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
          gap: '2rem',
          alignItems: 'start'
        }}
      >
        {/* Video side */}
        <div className="video-main-container">
          <div
            id="youtube-player"
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              background: '#000',
              border: '1px solid var(--glass-border)'
            }}
          />
          <div
            style={{
              marginTop: '1.5rem',
              background: 'var(--card-bg)',
              padding: '1.75rem',
              borderRadius: '1.5rem',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <h2 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
              📖 {module?.title || 'Course Overview'}
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>
              {module?.description || course?.description || 'Learn and interact with the AI-monitored tutorial.'}
            </p>
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: '0.75rem',
                fontSize: '0.8rem',
                color: 'var(--accent)'
              }}
            >
              ℹ️ Session will automatically complete when the video finishes.
            </div>
          </div>
        </div>

        {/* Monitoring sidebar */}
        <div className="monitoring-sidebar" style={{ position: 'sticky', top: '2rem' }}>
          <WebcamTracker onDetection={handleDetection} isPaused={isPaused} />

          <div className="stats-card">
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              <span className={`status-indicator ${playerReady ? 'status-online' : 'status-offline'}`} />
              Live Monitoring
            </h3>
            <div style={{ display: 'grid', gap: '0.1rem' }}>
              <div className="stats-row">
                <span>Session Time</span>
                <strong>{sessionTime}s</strong>
              </div>
              <div className="stats-row">
                <span>Active Time</span>
                <strong style={{ color: 'var(--success)' }}>{activeTime}s</strong>
              </div>
              <div className="stats-row">
                <span>Warnings</span>
                <strong className="warning-badge">{warningCount}/3</strong>
              </div>
              <div className="stats-row">
                <span>Focus Status</span>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '1rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: `${focusColor}22`,
                    color: focusColor,
                    border: `1px solid ${focusColor}44`,
                    letterSpacing: '0.04em'
                  }}
                >
                  {focusStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Puzzle modal */}
      {isPaused && <PuzzleModal onResolve={handleResolvePuzzle} />}

      {/* Distraction warning toast */}
      {!isPaused && (!faceVisible || !isLookingForward) && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,0.95)',
            color: 'white',
            padding: '1rem 2.5rem',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px rgba(239,68,68,0.4)',
            zIndex: 100,
            fontWeight: 700,
            letterSpacing: '0.025em',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          {!faceVisible ? '⚠️ FACE NOT DETECTED!' : '👀 PLEASE LOOK AT THE SCREEN!'}
        </div>
      )}
    </div>
  );
};

export default Session;

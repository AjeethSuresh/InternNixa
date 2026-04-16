import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WebcamTracker from '../components/WebcamTracker';
import PuzzleModal from '../components/PuzzleModal';
import SessionStats from '../components/SessionStats';
import { ChatBot } from '../components/ChatBot';

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
  const [isEyesClosed, setIsEyesClosed] = useState(false);
  const [sleepTime, setSleepTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const distractionRef = useRef(0);
  const sessionTimeRef = useRef(0);
  const activeTimeRef = useRef(0);
  const warningCountRef = useRef(0);
  const isFinishedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const course = location.state?.course;
  const module = location.state?.module;

  const playerRef = useRef(null); // YouTube player instance
  const videoRef = useRef(null); // HTML5 video element ref
  const lastTimeRef = useRef(0);
  const isLocalVideo = !!module?.videoUrl;

  // Keep refs in sync with state (so callbacks always have latest values)
  useEffect(() => { sessionTimeRef.current = sessionTime; }, [sessionTime]);
  useEffect(() => { activeTimeRef.current = activeTime; }, [activeTime]);
  useEffect(() => { warningCountRef.current = warningCount; }, [warningCount]);

  // ── Auto-end session when video finishes ──────────────────────────────────
  const autoNextTimeoutRef = useRef(null);

  const handleEndSession = useCallback(async (isAuto = false) => {
    // If the argument is an event object (from a click), treat it as manual (false)
    const trulyAuto = isAuto === true;

    if (isFinishedRef.current) return; // Prevent double-call
    isFinishedRef.current = true;

    const totalTime = sessionTimeRef.current;
    const active = activeTimeRef.current;
    const warnings = warningCountRef.current;
    
    let watchPercentage = 0.0;
    if (trulyAuto) {
      watchPercentage = 100.0;
    } else {
      let duration = 0;
      if (isLocalVideo && videoRef.current) {
        duration = videoRef.current.duration;
      } else if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        duration = playerRef.current.getDuration();
      }

      if (duration > 0) {
        watchPercentage = Math.min(100.0, (totalTime / duration) * 100.0);
      } else if (trulyAuto) {
        watchPercentage = 100.0;
      } else {
        // Fallback: If duration is unknown but they stayed for a while
        watchPercentage = totalTime > 10 ? 100.0 : 0.0;
      }
    }

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
        courseTitle: course?.id === 'sample-course' 
          ? 'Completion for sample video' 
          : `${course?.title || 'Course'} - ${module?.title || 'Lesson'}`,
        courseId: course?.id,
        moduleId: module?.id,
        totalModules: course?.modules?.length,
        watchPercentage
        })
      });
      const data = await response.json();
      if (response.ok) {
        setBackendResponse(data);

        // Auto-next logic: ONLY if the video ended naturally
        if (trulyAuto) {
          const currentIndex = course?.modules?.findIndex(m => m.id === module?.id);
          if (currentIndex !== -1 && currentIndex < course.modules.length - 1) {
            const nextModule = course.modules[currentIndex + 1];
            autoNextTimeoutRef.current = setTimeout(() => {
              navigate('/session', { state: { course, module: nextModule }, replace: true });
              window.location.reload(); 
            }, 3000); 
          }
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
          iv_load_policy: 3, // Hide video annotations
          start: module?.startTime || course?.startTime || 0
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event) => {
            // Auto-end session when video ends
            if (event.data === window.YT.PlayerState.ENDED) {
              handleEndSession(true); // Auto-end
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

    if (isLocalVideo) {
      setPlayerReady(true);
      return;
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
      clearTimeout(autoNextTimeoutRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [course, handleEndSession, isLocalVideo]);

  // ── Local Video Time/Seek Protection ─────────────────────────────────────
  useEffect(() => {
    if (!isLocalVideo || !videoRef.current) return;

    const video = videoRef.current;
    let seekInterval = null;

    const handlePlay = () => {
      clearInterval(seekInterval);
      seekInterval = setInterval(() => {
        if (video.currentTime > lastTimeRef.current + 2) {
          video.currentTime = lastTimeRef.current;
        } else {
          lastTimeRef.current = video.currentTime;
        }
      }, 1000);
    };

    const handlePause = () => clearInterval(seekInterval);
    const handleEnded = () => handleEndSession(true);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      clearInterval(seekInterval);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isLocalVideo, handleEndSession]);

  // ── Sync player pause state ───────────────────────────────────────────────
  useEffect(() => {
    if (playerReady) {
      const shouldPlay = !isPaused && faceVisible && isLookingForward;
      
      if (isLocalVideo && videoRef.current) {
        shouldPlay ? videoRef.current.play().catch(() => {}) : videoRef.current.pause();
      } else if (playerRef.current) {
        shouldPlay ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
      }
    }
  }, [isPaused, faceVisible, isLookingForward, playerReady, isLocalVideo]);

  // ── Session timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || isFinished) return;
    const interval = setInterval(() => {
      setSessionTime(p => p + 1);
      if (faceVisible && isLookingForward) setActiveTime(p => p + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isFinished, faceVisible, isLookingForward]);

  // ── Sleep tracking & Alarm ────────────────────────────────────────────────
  useEffect(() => {
    if (isEyesClosed && !isPaused && !isFinished) {
      const interval = setInterval(() => {
        setSleepTime(p => {
          const next = p + 1;
          if (next === 10) {
            // Play loud alert
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.error(e));
            // Trigger the puzzle by pausing the session
            setIsPaused(true);
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSleepTime(0);
    }
  }, [isEyesClosed, isPaused, isFinished]);

  // ── Tab Switch / Background Tracking ──────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isFinished && !isPaused) {
        // Automatically pause and force puzzle if they leave the tab
        setIsPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isFinished, isPaused]);

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
      
      // Calculate Eye Aspect Ratio (EAR)
      let isSleeping = false;
      try {
        const getDist = (p1, p2) => {
          if (!p1 || !p2) return 1;
          return Math.hypot(p1.x - p2.x, p1.y - p2.y);
        };
        const leftEAR = getDist(landmarks[159], landmarks[145]) / getDist(landmarks[33], landmarks[133]);
        const rightEAR = getDist(landmarks[386], landmarks[374]) / getDist(landmarks[362], landmarks[263]);
        const avgEAR = (leftEAR + rightEAR) / 2;
        isSleeping = avgEAR > 0 && avgEAR < 0.22;
      } catch (e) {
        console.error("EAR calc err", e);
      }
      
      const looking = Math.abs(noseTip.x - midPointX) < eyeDistance * 0.35;

      setFaceVisible(true);
      setIsLookingForward(looking);
      setIsEyesClosed(isSleeping);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.().catch(console.error);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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
          onClick={() => handleEndSession(false)}
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
        <div className="video-main-container" style={{ position: 'relative' }}>
          
          <div 
            ref={containerRef} 
            style={{ 
              position: 'relative', 
              width: '100%', 
              height: isFullscreen ? '100vh' : 'auto',
              background: '#000', 
              borderRadius: isFullscreen ? '0' : '1.5rem', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isFullscreen ? 'none' : '0 20px 60px rgba(0,0,0,0.6)',
              border: isFullscreen ? 'none' : '1px solid var(--glass-border)'
            }}
          >
            {isLocalVideo ? (
              <video
                ref={videoRef}
                src={module.videoUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: '16/9',
                  objectFit: 'contain'
                }}
                controls={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
              />
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  id="youtube-player"
                  style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none' /* Prevents hover state on YouTube branding */
                  }}
                />
                {/* Invisible shield to completely block all mouse interactions with YouTube iframe */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' }} />
              </div>
            )}

            {/* Custom Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              style={{
                 position: 'absolute',
                 bottom: '1.5rem',
                 right: '1.5rem',
                 zIndex: 40,
                 background: 'rgba(15, 17, 23, 0.65)',
                 border: '1px solid rgba(255,255,255,0.15)',
                 color: 'white',
                 padding: '0.6rem 1rem',
                 borderRadius: '0.75rem',
                 cursor: 'pointer',
                 backdropFilter: 'blur(8px)',
                 fontWeight: 600,
                 fontSize: '0.85rem',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                 boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 17, 23, 0.65)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
            </button>

            {/* Glass Overlay to hide suggestions and block interaction during pause/distraction */}
            {(isPaused || (!faceVisible || !isLookingForward)) && !isFinished && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#020617', // Fully opaque to hide YouTube pause screen
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 50,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'all'
                }}
              >
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' 
                }}>
                  {isPaused ? '🧩' : (faceVisible ? '👀' : '👤')}
                </div>
                <h3 style={{ 
                  color: 'white', 
                  margin: '0 0 0.5rem', 
                  fontSize: '1.25rem', 
                  fontWeight: 700,
                  letterSpacing: '0.02em'
                }}>
                  {isPaused ? 'SESSION PAUSED' : 'ATTENTION REQUIRED'}
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  fontSize: '0.9rem',
                  margin: 0,
                  maxWidth: '280px',
                  lineHeight: 1.5
                }}>
                  {isPaused 
                    ? 'Please solve the security puzzle to continue your lesson.' 
                    : (!faceVisible ? 'Face not detected. Please position yourself in front of the camera.' : 'Please look at the screen to resume playback.')}
                </p>
              </div>
            </div>
          )}
          </div> {/* Close containerRef div */}
          
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
            background: sleepTime >= 10 ? 'rgba(153,27,27,0.95)' : 'rgba(239,68,68,0.95)',
            color: 'white',
            padding: '1rem 2.5rem',
            borderRadius: '1rem',
            boxShadow: sleepTime >= 10 ? '0 0 50px rgba(153,27,27,0.8)' : '0 20px 40px rgba(239,68,68,0.4)',
            zIndex: 100,
            fontWeight: 700,
            letterSpacing: '0.025em',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: sleepTime >= 10 ? 'pulse 0.5s infinite' : 'none'
          }}
        >
          {sleepTime >= 10 ? 'WAKE UP! EYES CLOSED FOR 10 SECONDS' : (!faceVisible ? '⚠️ FACE NOT DETECTED!' : '👀 PLEASE LOOK AT THE SCREEN!')}
        </div>
      )}
      <style>{`@keyframes pulse { 0% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.05); } 100% { transform: translateX(-50%) scale(1); } }`}</style>
      <ChatBot courseId={course?.id} moduleId={module?.id} />
    </div>
  );
};

export default Session;

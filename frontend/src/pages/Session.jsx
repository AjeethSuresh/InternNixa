import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WebcamTracker from '../components/WebcamTracker';
import PuzzleModal from '../components/PuzzleModal';
import SessionStats from '../components/SessionStats';
import { ChatBot } from '../components/ChatBot';
import { BookOpen, Square, RefreshCw, Puzzle, Eye, User, AlertTriangle, AlertCircle, PlayCircle, Settings, LogOut, ChevronRight } from 'lucide-react';

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
    const trulyAuto = isAuto === true;

    if (isFinishedRef.current) return; 
    isFinishedRef.current = true;

    const totalTime = sessionTimeRef.current;
    const active = activeTimeRef.current;
    const warnings = warningCountRef.current;
    
    let watchPercentage = 0.0;
    try {
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
        } else {
          // If duration is unknown, they definitely shouldn't get 100% just for staying 10s.
          // We only grant 100% if the video actually finished (trulyAuto)
          watchPercentage = trulyAuto ? 100.0 : 0.0;
        }
      }
    } catch (e) {
      console.warn("Duration calculation failed", e);
      watchPercentage = 0;
    }

    // Set a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:5001" : "https://internnixa-1.onrender.com");
      const response = await fetch(`${baseUrl}/api/session/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal,
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
      clearTimeout(timeoutId);
      const data = await response.json();
      if (response.ok) {
        setBackendResponse(data);

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
  }, [course, module, navigate, isLocalVideo]);

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
          iv_load_policy: 3,
          start: module?.startTime || course?.startTime || 0
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              handleEndSession(true);
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
  }, [course, handleEndSession, isLocalVideo, module]);

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

  // ── Sleep tracking ──
  useEffect(() => {
    if (isEyesClosed && !isPaused && !isFinished) {
      const interval = setInterval(() => {
        setSleepTime(p => {
          const next = p + 1;
          if (next === 10) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
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

  // ── Face detection callback ──
  const noFaceTimerRef = useRef(null);

  const handleDetection = useCallback((results) => {
    if (results.multiFaceLandmarks?.length > 0) {
      clearTimeout(noFaceTimerRef.current);
      noFaceTimerRef.current = null;

      const landmarks = results.multiFaceLandmarks[0];
      if (!landmarks[4] || !landmarks[33] || !landmarks[263]) return;

      const noseTip = landmarks[4];
      const leftEyeInner = landmarks[133];
      const leftEyeOuter = landmarks[33];
      const rightEyeInner = landmarks[362];
      const rightEyeOuter = landmarks[263];
      
      const midPointX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
      const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
      
      // Precision Iris Detection
      let isLookingAtScreen = true;
      try {
        if (landmarks[468] && landmarks[473]) {
          const leftIris = landmarks[468];
          const rightIris = landmarks[473];
          
          // Calculate relative position of iris within eye width (0 to 1)
          const leftIrisPos = (leftIris.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x);
          const rightIrisPos = (rightIris.x - rightEyeInner.x) / (rightEyeOuter.x - rightEyeInner.x);
          
          // If iris is too far left or right (e.g., < 0.2 or > 0.8), they are looking away
          const isLeftLookingAway = leftIrisPos < 0.15 || leftIrisPos > 0.85;
          const isRightLookingAway = rightIrisPos < 0.15 || rightIrisPos > 0.85;
          
          if (isLeftLookingAway || isRightLookingAway) {
            isLookingAtScreen = false;
          }
        }
      } catch (e) {
        console.warn("Iris tracking error", e);
      }

      let isSleeping = false;
      try {
        const getDist = (a, b) => {
          if (!landmarks[a] || !landmarks[b]) return 1;
          const p1 = landmarks[a], p2 = landmarks[b];
          return Math.hypot(p1.x - p2.x, p1.y - p2.y);
        };
        const leftEAR = getDist(159, 145) / getDist(33, 133);
        const rightEAR = getDist(386, 374) / getDist(362, 263);
        const avgEAR = (leftEAR + rightEAR) / 2;
        isSleeping = avgEAR > 0 && avgEAR < 0.22;
      } catch (e) {
        console.warn("EAR error", e);
      }
      
      // Combined logic: Head must be forward AND eyes must be on screen
      const headForward = Math.abs(noseTip.x - midPointX) < eyeDistance * 0.45;
      const looking = headForward && isLookingAtScreen;

      setFaceVisible(true);
      setIsLookingForward(looking);
      setIsEyesClosed(isSleeping);
    } else {
      if (!noFaceTimerRef.current) {
        noFaceTimerRef.current = setTimeout(() => {
          setFaceVisible(false);
          setIsLookingForward(false);
          noFaceTimerRef.current = null;
        }, 1200); // 1.2s grace period for detection dropouts
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

  // ── Auto-pause on tab change ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Tab hidden - pausing session");
        setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (isFinished) {
    return (
      <SessionStats
        stats={{ 
          sessionTime, 
          activeTime, 
          warningCount, 
          watchPercentage: backendResponse?.session?.watchPercentage || 0,
          focusPointsEarned: backendResponse?.focusPointsEarned || 0
        }}
        sessionId={backendResponse?.session?._id}
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
          style={{ maxWidth: '160px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
        >
          <Square className="w-4 h-4" /> End Session
        </button>
      </header>

      <div
        className="content-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
          gap: '2rem',
          alignItems: 'start'
        }}
      >
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
                style={{ width: '100%', height: '100%', aspectRatio: '16/9', objectFit: 'contain' }}
                controls={false}
              />
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div id="youtube-player" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' }} />
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              style={{
                 position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 40,
                 background: 'rgba(15, 17, 23, 0.65)', border: '1px solid rgba(255,255,255,0.15)',
                 color: 'white', padding: '0.6rem 1rem', borderRadius: '0.75rem', cursor: 'pointer',
                 backdropFilter: 'blur(8px)', fontWeight: 600, fontSize: '0.85rem'
              }}
            >
              {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
            </button>

            {(isPaused || (!faceVisible || !isLookingForward)) && !isFinished && (
              <div 
                style={{
                  position: 'absolute', inset: 0, background: '#020617',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 50, transition: 'all 0.4s ease', pointerEvents: 'all'
                }}
              >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--brand-400)' }}>
                  {isPaused ? <Puzzle className="w-12 h-12 mx-auto" strokeWidth={1.5} /> : (faceVisible ? <Eye className="w-12 h-12 mx-auto" strokeWidth={1.5} /> : <User className="w-12 h-12 mx-auto" strokeWidth={1.5} />)}
                </div>
                <h3 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
                  {isPaused ? 'SESSION PAUSED' : 'ATTENTION REQUIRED'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: '0 0 1.5rem', maxWidth: '300px' }}>
                  {isPaused 
                    ? 'Please solve the security puzzle to continue.' 
                    : (!faceVisible ? 'Face not detected. Ensure your camera is clear.' : 'Please look at the screen to resume.')}
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => window.location.reload()}
                    className="logout-button"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh Camera
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
          
          <div style={{ marginTop: '1.5rem', background: 'var(--card-bg)', padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen className="w-5 h-5" /> {module?.title || 'Course Overview'}
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0, fontSize: '0.9rem' }}>{module?.description || course?.description}</p>
          </div>
        </div>

        <div className="monitoring-sidebar" style={{ position: 'sticky', top: '2rem' }}>
          <WebcamTracker onDetection={handleDetection} isPaused={isPaused} />
          <div className="stats-card">
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              <span className={`status-indicator ${playerReady ? 'status-online' : 'status-offline'}`} />
              Live Monitoring
            </h3>
            <div className="stats-row"><span>Session Time</span><strong>{sessionTime}s</strong></div>
            <div className="stats-row"><span>Active Time</span><strong style={{ color: 'var(--success)' }}>{activeTime}s</strong></div>
            <div className="stats-row"><span>Warnings</span><strong className="warning-badge">{warningCount}/3</strong></div>
            <div className="stats-row"><span>Status</span>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700, background: `${focusColor}22`, color: focusColor, border: `1px solid ${focusColor}44` }}>
                {focusStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isPaused && <PuzzleModal onResolve={handleResolvePuzzle} />}
      {!isPaused && (!faceVisible || !isLookingForward) && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.95)', color: 'white', padding: '1rem 2rem', borderRadius: '1rem', zIndex: 100, fontWeight: 700, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {sleepTime >= 10 ? <AlertTriangle className="animate-bounce" /> : <AlertCircle className="animate-pulse" />}
          {sleepTime >= 10 ? 'WAKE UP!' : (!faceVisible ? 'FACE NOT DETECTED!' : 'LOOK AT THE SCREEN!')}
        </div>
      )}
      <ChatBot courseId={course?.id} moduleId={module?.id} />
    </div>
  );
};

export default Session;

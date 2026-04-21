import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Mic, MicOff, Camera, CameraOff, Video as VideoIcon, TrendingUp } from 'lucide-react';
import WebcamTracker from '../components/WebcamTracker';
import MeetingControls from '../components/MeetingControls';
import EngagementPanel from '../components/EngagementPanel';
import RemoteVideo from '../components/RemoteVideo';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meetingTitle, setMeetingTitle] = useState('Loading meeting...');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // Array of { id, stream, name, status, attentionScore, role }
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null); // ID of participant in main view

  const callsRef = useRef([]); // To keep track of active calls
  const [isHost, setIsHost] = useState(false);
  const isHostRef = useRef(false);
  const [distractionAlerts, setDistractionAlerts] = useState([]); 
  const [isEyesClosed, setIsEyesClosed] = useState(false);
  const [sleepTime, setSleepTime] = useState(0); 
  const [awayTime, setAwayTime] = useState(0);
  const [meetingNotifications, setMeetingNotifications] = useState([]);
  const [showEndSummary, setShowEndSummary] = useState(false);
  const [summaryData, setSummaryData] = useState([]);

  // AI Monitoring State
  const [faceVisible, setFaceVisible] = useState(false);
  const [isLookingForward, setIsLookingForward] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [warning, setWarning] = useState('');
  const [copied, setCopied] = useState(false);
  const [peerStatus, setPeerStatus] = useState('Initializing...');
  const [socketStatus, setSocketStatus] = useState('Disconnected');

  // Status Refs for high-stability monitoring
  const faceVisibleRef = useRef(false);
  const isEyesClosedRef = useRef(false);
  const isCamOnRef = useRef(true);
  const activeTimeRef = useRef(0);
  const totalTimeRef = useRef(0);

  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const userRef = useRef(JSON.parse(localStorage.getItem('currentUser')) || { name: 'Guest', email: 'guest@example.com' });
  const myIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const activeStreamRef = useRef(null); 
  const mainStreamRef = useRef(null); 

  const handleEndMeeting = async () => {
    if (isHost) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meet/sessions/${meetingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
          setShowEndSummary(true);
        } else {
          navigate('/meet');
        }
      } catch (err) {
        console.error('End meeting summary error', err);
        navigate('/meet');
      }
    } else {
      navigate('/meet');
    }
  };

  const addNotification = (msg, type = 'info') => {
    const id = Date.now();
    setMeetingNotifications(prev => [{ id, msg, type }, ...prev].slice(0, 3));
    setTimeout(() => {
      setMeetingNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // 1. Fetch meeting info
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meet/${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeetingTitle(data.title);
          const currentUserId = userRef.current._id || userRef.current.id;
          if (data.hostId === currentUserId) {
            setIsHost(true);
            isHostRef.current = true;
          }
        }
      } catch (err) {
        console.error('Fetch meeting error', err);
      }
    };
    fetchMeeting();
  }, [meetingId]);

  // 2. Initial Media Setup for Lobby
  useEffect(() => {
    const getPreJoinMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        mainStreamRef.current = stream;
        activeStreamRef.current = stream;
      } catch (err) {
        console.error('Failed to get local stream initially', err);
      }
    };
    if (!hasJoined) {
      getPreJoinMedia();
    }
  }, [hasJoined]);

  // 3. Connect to Meeting (WebRTC & Socket)
  useEffect(() => {
    if (!hasJoined) return;

    const connectToSocket = (stream) => {
      const apiVar = import.meta.env.VITE_API_URL;
      const baseUrl = apiVar ? apiVar : `${window.location.protocol}//${window.location.host}`;
      const wsUrl = `${baseUrl.replace(/^http/, 'ws')}/ws/meet/${meetingId}/${myIdRef.current}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("🛰️ WebSocket Connected!");
        setSocketStatus('Connected');
        socket.send(JSON.stringify({ 
          type: 'hello', 
          payload: { name: userRef.current.name, email: userRef.current.email, role: isHostRef.current ? 'Host' : 'Participant' } 
        }));
      };

      socket.onerror = (e) => {
        console.error("❌ WebSocket Error:", e);
        setSocketStatus('Error');
      };
      
      socket.onclose = () => {
        console.warn("⚠️ WebSocket Disconnected!");
        setSocketStatus('Disconnected');
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'user-joined') {
          const pName = data.payload?.name || 'A participant';
          addNotification(`${pName} joined the meet`, 'success');
          
          const call = peerRef.current.call(data.from, activeStreamRef.current);
          if (call) {
            callsRef.current = callsRef.current.filter(c => c.peer !== call.peer);
            callsRef.current.push(call);
            call.on('stream', (userRemoteStream) => {
              setRemoteStreams(prev => {
                const existing = prev.find(s => s.id === data.from);
                if (existing) return prev.map(s => s.id === data.from ? { ...s, stream: userRemoteStream } : s);
                return [...prev, { id: data.from, stream: userRemoteStream, name: pName, status: 'Active', attentionScore: 100, role: data.payload?.role || 'Participant' }];
              });
            });
            call.on('close', () => {
              setRemoteStreams(prev => prev.filter(s => s.id !== data.from));
            });
          }
          // Send back info
          socket.send(JSON.stringify({
            to: data.from,
            type: 'user-info',
            payload: { name: userRef.current.name, role: isHostRef.current ? 'Host' : 'Participant' }
          }));
        } else if (data.type === 'user-info') {
          setRemoteStreams(prev => prev.map(s => s.id === data.from ? { ...s, name: data.payload.name, role: data.payload.role || 'Participant' } : s));
        } else if (data.type === 'status-update') {
          setRemoteStreams(prev => prev.map(s => s.id === data.from ? { ...s, ...data.payload } : s));
          if ((data.payload.status === 'Away' || data.payload.status === 'Sleeping') && isHostRef.current) {
            const pName = data.payload.name || 'A participant';
            setDistractionAlerts(p => [{ id: Date.now(), name: pName, status: data.payload.status, time: new Date().toLocaleTimeString() }, ...p].slice(0, 5));
          }
        } else if (data.type === 'user-left') {
          const p = remoteStreams.find(s => s.id === data.payload.userId);
          addNotification(`${data.payload.name || p?.name || 'Someone'} has left the meet`, 'error');
          setRemoteStreams(prev => prev.filter(s => s.id !== data.payload.userId));
        }
      };
    };

    // Initialize Peer
    const peer = new Peer(myIdRef.current, {
        config: {'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'stun:stun2.l.google.com:19302' },
            { url: 'stun:stun3.l.google.com:19302' },
            { url: 'stun:stun4.l.google.com:19302' }
        ]}
    });
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Peer connected with ID:', id);
      setPeerStatus('Connected');
      if (activeStreamRef.current) connectToSocket(activeStreamRef.current);
    });

    peer.on('error', (err) => {
      console.error('PeerJS Error:', err);
      setPeerStatus(`Error: ${err.type}`);
    });

    peer.on('call', (call) => {
      console.log('Receiving call from:', call.peer);
      call.answer(activeStreamRef.current);
      callsRef.current = callsRef.current.filter(c => c.peer !== call.peer);
      callsRef.current.push(call);
      
      call.on('stream', (userRemoteStream) => {
        setRemoteStreams(prev => {
          const existing = prev.find(s => s.id === call.peer);
          if (existing) return prev.map(s => s.id === call.peer ? { ...s, stream: userRemoteStream } : s);
          return [...prev, { id: call.peer, stream: userRemoteStream, name: 'Participant', status: 'Active', attentionScore: 100, role: 'Participant' }];
        });
      });

      call.on('close', () => {
        setRemoteStreams(prev => prev.filter(s => s.id !== call.peer));
      });
    });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.close();
    };
  }, [hasJoined, meetingId]);

  // Clean up streams across whole component lifecycle
  useEffect(() => {
    return () => {
      if (mainStreamRef.current) mainStreamRef.current.getTracks().forEach(t => t.stop());
      if (activeStreamRef.current && activeStreamRef.current !== mainStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Sync state
  useEffect(() => {
    if (!hasJoined) return;
    const syncInterval = setInterval(() => {
      const status = sleepTime >= 7 ? 'Sleeping' : (!faceVisible ? 'Away' : 'Active');
      const score = totalTime > 0 ? Math.round((activeTime / totalTime) * 100) : 100;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'status-update', payload: { 
            status, 
            attentionScore: score, 
            name: userRef.current.name, 
            role: isHostRef.current ? 'Host' : 'Participant',
            activeTime: activeTime,
            totalTime: totalTime
          }
        }));
      }
    }, 5000); // More frequent sync for production reliability
    return () => clearInterval(syncInterval);
  }, [hasJoined, faceVisible, isLookingForward, activeTime, totalTime, isEyesClosed]);

  const toggleMic = () => {
    if (mainStreamRef.current) {
      const audioTrack = mainStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (mainStreamRef.current) {
      const videoTrack = mainStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
        isCamOnRef.current = videoTrack.enabled;
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        callsRef.current.forEach(call => {
          const pc = call.peerConnection || call._pc;
          if (pc) {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
          }
        });

        activeStreamRef.current = screenStream;
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        setIsCamOn(true); 

        screenTrack.onended = () => stopScreenShare(screenTrack);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopScreenShare = async (screenTrack) => {
    try {
      if (mainStreamRef.current) {
        const camTrack = mainStreamRef.current.getVideoTracks()[0];
        if (camTrack) camTrack.enabled = isCamOn; // restore previous state
        
        callsRef.current.forEach(call => {
          const pc = call.peerConnection || call._pc;
          if (pc) {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
          }
        });
        
        activeStreamRef.current = mainStreamRef.current;
        setLocalStream(mainStreamRef.current);
      }
      setIsScreenSharing(false);
      isCamOnRef.current = isCamOn; // Sync back from current state
      if (screenTrack) screenTrack.stop();
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  };

  const handleDetection = useCallback((results) => {
    if (!hasJoined) return;
    if (isScreenSharing) {
      setFaceVisible(true); setIsLookingForward(true); setWarning('');
      return;
    }
    if (results.multiFaceLandmarks?.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      const noseTip = landmarks[4];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const midPointX = (leftEye.x + rightEye.x) / 2;
      const eyeDistance = Math.abs(rightEye.x - leftEye.x);
      
      const getDist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const leftEAR = (getDist(landmarks[159], landmarks[145]) + getDist(landmarks[158], landmarks[144])) / (2 * getDist(landmarks[33], landmarks[133]));
      const rightEAR = (getDist(landmarks[386], landmarks[374]) + getDist(landmarks[385], landmarks[373])) / (2 * getDist(landmarks[362], landmarks[263]));
      const avgEAR = (leftEAR + rightEAR) / 2;
      const isSleeping = avgEAR > 0 && avgEAR < 0.23; // Optimized EAR threshold

      const looking = Math.abs(noseTip.x - midPointX) < eyeDistance * 0.35;
      setFaceVisible(true); faceVisibleRef.current = true;
      setIsLookingForward(looking); 
      setIsEyesClosed(isSleeping); isEyesClosedRef.current = isSleeping;
      setWarning('');
    } else {
      setFaceVisible(false); faceVisibleRef.current = false;
      setIsLookingForward(false); 
      setIsEyesClosed(false); isEyesClosedRef.current = false;
      setWarning('Absence Detected');
    }
  }, [isScreenSharing, hasJoined]);

  // ── High-Stability Monitoring Loop (Debounced) ──────────────────────────
  useEffect(() => {
    if (!hasJoined) return;
    
    // Using refs to avoid timer resets on every state change
    const monitoringInterval = setInterval(() => {
      // 1. Update Attendance Timers
      totalTimeRef.current += 1;
      setTotalTime(totalTimeRef.current);
      
      if (faceVisibleRef.current && !isEyesClosedRef.current) {
        activeTimeRef.current += 1;
        setActiveTime(activeTimeRef.current);
      }

      // 2. Sleep Detection (Buffered)
      if (isEyesClosedRef.current && faceVisibleRef.current) {
        setSleepTime(p => {
          const next = p + 1;
          if (next === 7) {
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: 'status-update', 
                payload: { 
                  status: 'Sleeping', 
                  name: userRef.current.name, 
                  role: isHostRef.current ? 'Host' : 'Participant', 
                  activeTime: activeTimeRef.current, 
                  totalTime: totalTimeRef.current 
                }
              }));
            }
          }
          return next;
        });
      } else {
        setSleepTime(0);
      }

      // 3. Absence Detection (Buffered)
      if (!faceVisibleRef.current && isCamOnRef.current) {
        setAwayTime(p => {
          const next = p + 1;
          if (next === 5) {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: 'status-update', 
                payload: { 
                  status: 'Away', 
                  name: userRef.current.name, 
                  role: isHostRef.current ? 'Host' : 'Participant', 
                  activeTime: activeTimeRef.current, 
                  totalTime: totalTimeRef.current 
                }
              }));
            }
          }
          return next;
        });
      } else {
        setAwayTime(0);
      }
    }, 1000);

    return () => clearInterval(monitoringInterval);
  }, [hasJoined, faceVisible, isEyesClosed, isCamOn, activeTime, totalTime]);

  if (!hasJoined) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', gap: '4rem', maxWidth: '1000px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ flex: '1', minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                  {localStream ? (
                    <video ref={(ref) => { if (ref) ref.srcObject = localStream }} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: isCamOn ? 1 : 0 }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>Starting camera...</div>
                  )}
                  {!isCamOn && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontSize: '4rem', color: '#444' }}>
                      {userRef.current.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button onClick={toggleMic} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isMicOn ? 'rgba(30, 41, 59, 0.8)' : '#ef4444', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
                        {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                    <button onClick={toggleCam} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isCamOn ? 'rgba(30, 41, 59, 0.8)' : '#ef4444', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
                        {isCamOn ? <Camera size={24} /> : <CameraOff size={24} />}
                    </button>
                  </div>
              </div>
            </div>

            <div style={{ flex: '1', minWidth: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
              <div>
                <p style={{ color: '#3b82f6', fontWeight: 700, letterSpacing: '2px', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>Ready to join?</p>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{meetingTitle}</h1>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}><VideoIcon size={18}/> WebRTC Secured Meeting</p>
                <button onClick={() => setHasJoined(true)} style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: '1.1rem', fontWeight: 600, border: 'none', borderRadius: '2rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.3s', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)' }}>
                    {isHost ? 'Join Meeting' : 'Ask to Join'}
                </button>
              </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', zIndex: 10 }}>
        <div>
          <p style={{ color: 'var(--accent, #3b82f6)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>LIVE MEETING</p>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{meetingTitle}</h2>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: copied ? '#10b981' : '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Link Copied!' : 'Copy Join Link'}
        </button>

        {/* Signaling Radar HUD */}
        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
           <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 700 }}>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: socketStatus === 'Connected' ? '#10b981' : '#ef4444' }} />
             SIGNALING {socketStatus.toUpperCase()}
           </div>
           <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 700 }}>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: peerStatus === 'Connected' ? '#10b981' : '#ef4444' }} />
             WEBRTC {peerStatus.toUpperCase()}
           </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        padding: '6rem 2rem 8rem', 
        height: 'calc(100vh - 4rem)', 
        maxWidth: '1600px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        {/* Main View - Local Video with Face Tracking */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          borderRadius: '1.5rem', 
          overflow: 'hidden', 
          border: '2px solid rgba(255,255,255,0.1)', 
          background: '#111', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          height: '100%'
        }}>
          <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 5, display: 'flex', gap: '0.5rem' }}>
            {pinnedParticipantId && (
              <button 
                onClick={() => setPinnedParticipantId(null)}
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, backdropFilter: 'blur(10px)' }}
              >
                Reset View
              </button>
            )}
          </div>

          {pinnedParticipantId ? (
            <div style={{ width: '100%', height: '100%' }}>
               <RemoteVideo 
                  stream={remoteStreams.find(s => s.id === pinnedParticipantId)?.stream} 
                  name={remoteStreams.find(s => s.id === pinnedParticipantId)?.name || 'Participant'} 
                />
            </div>
          ) : (
            <WebcamTracker onDetection={handleDetection} externalStream={localStream} />
          )}

          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: pinnedParticipantId ? '#10b981' : (isLookingForward ? '#10b981' : '#f59e0b') }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {pinnedParticipantId 
                ? (remoteStreams.find(s => s.id === pinnedParticipantId)?.name || 'Participant')
                : (isHost ? <span><span style={{ color: '#f59e0b', marginRight: '4px' }}>[HOST]</span>{userRef.current.name} (You)</span> : `${userRef.current.name} (You)`)}
            </span>
          </div>
          
          {pinnedParticipantId === null && !isCamOn && !isScreenSharing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontSize: '3rem' }}>
              {userRef.current.name?.charAt(0).toUpperCase()}
            </div>
          )}
          {(warning || sleepTime >= 7) && (
            <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', background: (sleepTime >= 7 || warning === 'Absence Detected') ? 'rgba(153,27,27,0.95)' : 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: 700, backdropFilter: 'blur(10px)', animation: (sleepTime >= 7 || warning === 'Absence Detected') ? 'pulse 0.5s infinite' : 'pulse 2s infinite', boxShadow: (sleepTime >= 7 || warning === 'Absence Detected') ? '0 0 50px rgba(153,27,27,0.8)' : 'none', zIndex: 10 }}>
              ⚠️ {sleepTime >= 7 ? 'WAKE UP! EYES CLOSED FOR 7 SECONDS' : warning}
            </div>
          )}

          {/* Host - Live Monitoring Intelligence Feed */}
          {isHost && distractionAlerts.length > 0 && (
            <div style={{ position: 'absolute', top: '2rem', right: '2rem', width: '280px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'dot-pulse 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Intelligence</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <AnimatePresence>
                      {distractionAlerts.map(alert => (
                        <motion.div 
                          key={alert.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{alert.name}</span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>{alert.time}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: alert.status === 'Sleeping' ? '#ef4444' : '#f59e0b' }}>
                             {alert.status === 'Sleeping' ? '😴 Sleep Detected' : '🛰️ User Not Available'}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Remote Participants */}
        <div style={{ 
          width: '380px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          overflowY: 'auto', 
          paddingRight: '0.5rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent'
        }}>
          {remoteStreams.length > 0 ? (
            remoteStreams.map((rs) => (
              <div 
                key={rs.id} 
                onClick={() => setPinnedParticipantId(rs.id === pinnedParticipantId ? null : rs.id)}
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  aspectRatio: '16/9', 
                  borderRadius: '1.25rem', 
                  overflow: 'hidden', 
                  background: '#111', 
                  boxShadow: rs.status === 'Distracted' ? '0 0 20px rgba(245, 158, 11, 0.4)' : (rs.id === pinnedParticipantId ? '0 0 0 2px var(--accent)' : 'none'), 
                  border: rs.status === 'Distracted' ? '2px solid #f59e0b' : (rs.id === pinnedParticipantId ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)'),
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {rs.id === pinnedParticipantId ? (
                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', background: '#0a0a1a' }}>
                     <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700 }}>{rs.name.charAt(0).toUpperCase()}</div>
                     <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Viewing in main window</span>
                   </div>
                ) : (
                  <RemoteVideo stream={rs.stream} name={rs.name} />
                )}
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.5)', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', backdropFilter: 'blur(10px)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: rs.status === 'Active' ? '#10b981' : (rs.status === 'Away' ? '#f59e0b' : '#ef4444') }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{rs.role === 'Host' ? <span style={{ color: '#f59e0b', marginRight: '4px' }}>[HOST]</span> : ''}{rs.name}</span>
                </div>
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                  {rs.attentionScore || 100}%
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '1.5rem', 
              border: '1px dashed rgba(255,255,255,0.1)', 
              color: 'rgba(255,255,255,0.3)', 
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Waiting for others to join...</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', opacity: 0.6 }}>Share the link to invite participants</p>
            </div>
          )}
        </div>
      </div>

      <MeetingControls isMicOn={isMicOn} isCamOn={isCamOn} isScreenSharing={isScreenSharing} onToggleMic={toggleMic} onToggleCam={toggleCam} onToggleScreen={toggleScreenShare} onLeave={handleEndMeeting} onToggleParticipants={() => setShowEngagement(!showEngagement)} onShare={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} isCopied={copied} />

      <EngagementPanel participants={[{ id: 'me', name: `${userRef.current.name} (You)`, status: !faceVisible ? 'Away' : (isLookingForward ? 'Active' : 'Distracted'), attentionScore: totalTime > 0 ? Math.round((activeTime / totalTime) * 100) : 100, role: isHost ? 'Host' : 'Participant' }, ...remoteStreams]} isOpen={showEngagement} onClose={() => setShowEngagement(false)} />

      {/* Notifications Toasts */}
      <div style={{ position: 'fixed', bottom: '7rem', left: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 1000 }}>
        <AnimatePresence>
          {meetingNotifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                padding: '0.75rem 1.25rem',
                background: n.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : (n.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(30, 41, 59, 0.9)'),
                borderRadius: '1rem',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {n.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* End Meeting Summary Modal */}
      <AnimatePresence>
        {showEndSummary && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{ width: '100%', maxWidth: '800px', background: '#0f172a', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}
            >
              <div style={{ padding: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <TrendingUp size={40} color="#3b82f6" />
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Meeting Intelligence Report</h2>
                <p style={{ opacity: 0.6, marginTop: '0.5rem' }}>Final Attendance & Engagement Breakdown</p>
              </div>

              <div style={{ padding: '2rem', maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '1rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Participant</th>
                      <th style={{ padding: '1rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Active Time</th>
                      <th style={{ padding: '1rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Exits</th>
                      <th style={{ padding: '1rem', opacity: 0.4, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Engagement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.length > 0 ? summaryData.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ fontWeight: 700 }}>{s.name || 'Anonymous'}</span><br/>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{s.email}</span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ fontWeight: 700, color: '#3b82f6' }}>{Math.round(s.activeTime / 60)}m</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}> / {Math.round(s.totalTime / 60)}m</span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <span style={{ fontWeight: 700, color: s.leaveCount > 2 ? '#ef4444' : '#fff' }}>{s.leaveCount || 0} times</span>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <div style={{ flex: 1, height: '4px', width: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                               <div style={{ height: '100%', background: '#10b981', width: `${s.attentionScore || 0}%`, borderRadius: '2px' }} />
                             </div>
                             <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{s.attentionScore || 0}%</span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No session data recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                <button 
                  onClick={() => navigate('/meet')}
                  style={{ padding: '1rem 3rem', background: '#3b82f6', color: '#fff', borderRadius: '1rem', fontWeight: 700, cursor: 'pointer', border: 'none' }}
                >
                  Close & Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.05); } 100% { transform: translateX(-50%) scale(1); } }
        @keyframes dot-pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MeetingRoom;

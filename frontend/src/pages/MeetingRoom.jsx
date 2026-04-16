import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Mic, MicOff, Camera, CameraOff, Video as VideoIcon } from 'lucide-react';
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
  
  // AI Monitoring State
  const [faceVisible, setFaceVisible] = useState(false);
  const [isLookingForward, setIsLookingForward] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [warning, setWarning] = useState('');
  const [copied, setCopied] = useState(false);

  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const userRef = useRef(JSON.parse(localStorage.getItem('currentUser')) || { name: 'Guest', email: 'guest@example.com' });
  const myIdRef = useRef(Math.random().toString(36).substr(2, 9));
  const activeStreamRef = useRef(null); 
  const mainStreamRef = useRef(null); 

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
      const wsUrl = `${import.meta.env.VITE_API_URL.replace('http', 'ws')}/ws/meet/${meetingId}/${myIdRef.current}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ 
          type: 'hello', 
          payload: { name: userRef.current.name, email: userRef.current.email, role: isHostRef.current ? 'Host' : 'Participant' } 
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'user-joined') {
          console.log('New user joined, calling:', data.from);
          const call = peerRef.current.call(data.from, activeStreamRef.current);
          if (call) {
            callsRef.current = callsRef.current.filter(c => c.peer !== call.peer);
            callsRef.current.push(call);
            call.on('stream', (userRemoteStream) => {
              setRemoteStreams(prev => {
                const existing = prev.find(s => s.id === data.from);
                if (existing) return prev.map(s => s.id === data.from ? { ...s, stream: userRemoteStream } : s);
                return [...prev, { id: data.from, stream: userRemoteStream, name: data.payload?.name || 'Participant', status: 'Active', attentionScore: 100, role: data.payload?.role || 'Participant' }];
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
          if ((data.payload.status === 'Distracted' || data.payload.status === 'Sleeping') && isHostRef.current) {
            const pName = data.payload.name || 'A participant';
            setDistractionAlerts(p => [{ id: Date.now(), name: pName, status: data.payload.status, time: new Date().toLocaleTimeString() }, ...p].slice(0, 5));
          }
        } else if (data.type === 'user-left') {
          setRemoteStreams(prev => prev.filter(s => s.id !== data.payload.userId));
        }
      };
    };

    // Initialize Peer
    const peer = new Peer(myIdRef.current, {
        config: {'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' }
        ]}
    });
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('Peer connected with ID:', id);
      if (activeStreamRef.current) connectToSocket(activeStreamRef.current);
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
      const status = sleepTime >= 10 ? 'Sleeping' : (!faceVisible ? 'Away' : (isLookingForward ? 'Active' : 'Distracted'));
      const score = totalTime > 0 ? Math.round((activeTime / totalTime) * 100) : 100;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'status-update', payload: { status, attentionScore: score, name: userRef.current.name, role: isHostRef.current ? 'Host' : 'Participant' }
        }));
      }
    }, 10000);
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
      setFaceVisible(true); setIsLookingForward(looking); setIsEyesClosed(isSleeping);
      setWarning(looking ? '' : 'Please look at the screen');
    } else {
      setFaceVisible(false); setIsLookingForward(false); setIsEyesClosed(false);
      setWarning('Face not detected');
    }
  }, [isScreenSharing, hasJoined]);

  useEffect(() => {
    if (!hasJoined) return;
    const timer = setInterval(() => {
      setTotalTime(t => t + 1);
      if (faceVisible && isLookingForward && !isEyesClosed) setActiveTime(a => a + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [faceVisible, isLookingForward, isEyesClosed, hasJoined]);

  // ── Sleep tracking & Alarm ────────────────────────────────────────────────
  useEffect(() => {
    if (hasJoined && isEyesClosed) {
      const interval = setInterval(() => {
        setSleepTime(p => {
          const next = p + 1;
          if (next === 10) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(e => console.error(e));
            // Immediately notify host
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                  type: 'status-update', payload: { status: 'Sleeping', name: userRef.current.name, role: isHostRef.current ? 'Host' : 'Participant' }
                }));
            }
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSleepTime(0);
    }
  }, [isEyesClosed, hasJoined]);

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
          {(warning || sleepTime >= 10) && (
            <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', background: sleepTime >= 10 ? 'rgba(153,27,27,0.95)' : 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: 700, backdropFilter: 'blur(10px)', animation: sleepTime >= 10 ? 'pulse 0.5s infinite' : 'pulse 2s infinite', boxShadow: sleepTime >= 10 ? '0 0 50px rgba(153,27,27,0.8)' : 'none', zIndex: 10 }}>
              ⚠️ {sleepTime >= 10 ? 'WAKE UP! EYES CLOSED FOR 10 SECONDS' : warning}
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
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: rs.status === 'Active' ? '#10b981' : (rs.status === 'Distracted' ? '#f59e0b' : '#ef4444') }} />
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

      <MeetingControls isMicOn={isMicOn} isCamOn={isCamOn} isScreenSharing={isScreenSharing} onToggleMic={toggleMic} onToggleCam={toggleCam} onToggleScreen={toggleScreenShare} onLeave={() => navigate('/meet')} onToggleParticipants={() => setShowEngagement(!showEngagement)} onShare={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} isCopied={copied} />

      <EngagementPanel participants={[{ id: 'me', name: `${userRef.current.name} (You)`, status: !faceVisible ? 'Away' : (isLookingForward ? 'Active' : 'Distracted'), attentionScore: totalTime > 0 ? Math.round((activeTime / totalTime) * 100) : 100, role: isHost ? 'Host' : 'Participant' }, ...remoteStreams]} isOpen={showEngagement} onClose={() => setShowEngagement(false)} />

      <AnimatePresence>
        {isHost && distractionAlerts.length > 0 && (
          <div style={{ position: 'fixed', top: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 100, maxWidth: '320px' }}>
            {distractionAlerts.map((alert) => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: 50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} style={{ background: alert.status === 'Sleeping' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 158, 11, 0.95)', color: alert.status === 'Sleeping' ? '#fff' : '#000', padding: '1rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ fontSize: '1.2rem' }}>{alert.status === 'Sleeping' ? '😴' : '👀'}</div>
                <div><p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>{alert.name} {alert.status === 'Sleeping' ? 'is Sleeping!' : 'Distracted!'}</p><p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>at {alert.time}</p></div>
                <button onClick={() => setDistractionAlerts(prev => prev.filter(a => a.id !== alert.id))} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.5 }}>✕</button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes pulse { 0% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.05); } 100% { transform: translateX(-50%) scale(1); } }`}</style>
    </div>
  );
};

export default MeetingRoom;

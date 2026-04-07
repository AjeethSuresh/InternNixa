import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Copy, Check, Users as UsersIcon, Video as VideoIcon } from 'lucide-react';
import WebcamTracker from '../components/WebcamTracker';
import MeetingControls from '../components/MeetingControls';
import EngagementPanel from '../components/EngagementPanel';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meetingTitle, setMeetingTitle] = useState('Loading meeting...');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // Array of { id, stream, name, status, attentionScore }
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showEngagement, setShowEngagement] = useState(false);
  const [participants, setParticipants] = useState([]);
  
  // AI Monitoring State
  const [faceVisible, setFaceVisible] = useState(false);
  const [isLookingForward, setIsLookingForward] = useState(false);
  const [activeTime, setActiveTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [warning, setWarning] = useState('');
  const [copied, setCopied] = useState(false);

  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const userRef = useRef(JSON.parse(localStorage.getItem('user')) || { name: 'Guest', email: 'guest@example.com' });
  const myIdRef = useRef(Math.random().toString(36).substr(2, 9));
  
  // 1. Fetch meeting info
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meet/${meetingId}`);
        const data = await response.json();
        if (response.ok) {
          setMeetingTitle(data.title);
        } else {
          navigate('/meet');
        }
      } catch (err) {
        console.error(err);
        navigate('/meet');
      }
    };
    fetchMeeting();
  }, [meetingId, navigate]);

  // 2. Initialize Media & Peer
  useEffect(() => {
    let stream = null;
    const initMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        // Initialize Peer
        const peer = new Peer(myIdRef.current);
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          connectToSocket();
        });

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userRemoteStream) => {
            setRemoteStreams(prev => {
              if (prev.find(s => s.id === call.peer)) return prev;
              return [...prev, { id: call.peer, stream: userRemoteStream, name: 'Participant', status: 'Active', attentionScore: 100 }];
            });
          });
        });
      } catch (err) {
        console.error('Failed to get local stream', err);
      }
    };

    const connectToSocket = () => {
      const wsUrl = `${import.meta.env.VITE_API_URL.replace('http', 'ws')}/ws/meet/${meetingId}/${myIdRef.current}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ 
          type: 'hello', 
          payload: { name: userRef.current.name, email: userRef.current.email } 
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'user-joined') {
          // A new user joined, call them
          console.log('New user joined:', data.from);
          const call = peerRef.current.call(data.from, stream);
          call.on('stream', (userRemoteStream) => {
            setRemoteStreams(prev => {
              if (prev.find(s => s.id === data.from)) return prev;
              return [...prev, { id: data.from, stream: userRemoteStream, name: 'Participant', status: 'Active', attentionScore: 100 }];
            });
          });
          // Send back my info
          socket.send(JSON.stringify({
            to: data.from,
            type: 'user-info',
            payload: { name: userRef.current.name }
          }));
        } else if (data.type === 'user-info') {
          setRemoteStreams(prev => prev.map(s => s.id === data.from ? { ...s, name: data.payload.name } : s));
        } else if (data.type === 'status-update') {
          setRemoteStreams(prev => prev.map(s => s.id === data.from ? { ...s, ...data.payload } : s));
        } else if (data.type === 'user-left') {
          setRemoteStreams(prev => prev.filter(s => s.id !== data.payload.userId));
        }
      };
    };

    initMedia();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.close();
    };
  }, [meetingId]);

  // 3. AI Monitoring Logic (Face Detection)
  const handleDetection = useCallback((results) => {
    if (results.multiFaceLandmarks?.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      const noseTip = landmarks[4];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const midPointX = (leftEye.x + rightEye.x) / 2;
      const eyeDistance = Math.abs(rightEye.x - leftEye.x);
      const looking = Math.abs(noseTip.x - midPointX) < eyeDistance * 0.35;

      setFaceVisible(true);
      setIsLookingForward(looking);
      setWarning(looking ? '' : 'Please look at the screen');
    } else {
      setFaceVisible(false);
      setIsLookingForward(false);
      setWarning('Face not detected');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalTime(t => t + 1);
      if (faceVisible && isLookingForward) {
        setActiveTime(a => a + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [faceVisible, isLookingForward]);

  const attentionScore = totalTime > 0 ? Math.round((activeTime / totalTime) * 100) : 100;
  const status = !faceVisible ? 'Away' : (isLookingForward ? 'Active' : 'Distracted');

  // 4. Sync stats with backend & others
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const stats = {
        meetingId,
        userId: myIdRef.current,
        name: userRef.current.name,
        email: userRef.current.email,
        attentionScore,
        activeTime,
        totalTime,
        status
      };

      // To Backend
      fetch(`${import.meta.env.VITE_API_URL}/api/meet/session/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      }).catch(console.error);

      // To Others via WebSocket
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'status-update',
          payload: { status, attentionScore, name: userRef.current.name }
        }));
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(syncInterval);
  }, [meetingId, attentionScore, activeTime, totalTime, status]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  };

  const handleLeave = () => {
    navigate('/meet');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', zIndex: 10 }}>
        <div>
          <p style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', margin: 0 }}>LIVE MEETING</p>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{meetingTitle}</h2>
        </div>
        
        <button 
          onClick={handleCopyLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.75rem',
            color: copied ? '#10b981' : '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)'
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Link Copied!' : 'Copy Join Link'}
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ 
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '6rem 2rem 10rem', 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 4rem)'
      }}>
        {/* Local Video & Monitor */}
        <div style={{ 
          position: 'relative', 
          width: remoteStreams.length === 0 ? 'min(100%, 900px)' : 'calc(50% - 1rem)', 
          aspectRatio: '16/9', 
          maxHeight: '60vh',
          borderRadius: '1.5rem', 
          overflow: 'hidden', 
          border: '2px solid rgba(255,255,255,0.1)', 
          background: '#111',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <WebcamTracker onDetection={handleDetection} />
          
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(10px)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isLookingForward ? '#10b981' : '#f59e0b' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{userRef.current.name} (You)</span>
          </div>

          {!isCamOn && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', fontSize: '3rem' }}>
              {userRef.current.name?.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Warning Overlay */}
          {warning && (
            <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: 700, backdropFilter: 'blur(10px)', animation: 'pulse 2s infinite' }}>
              ⚠️ {warning}
            </div>
          )}
        </div>

        {/* Remote Videos */}
        {remoteStreams.map((rs) => (
          <div key={rs.id} style={{ 
            position: 'relative', 
            width: 'calc(50% - 1rem)', 
            aspectRatio: '16/9', 
            maxHeight: '60vh',
            borderRadius: '1.5rem', 
            overflow: 'hidden', 
            border: '1px solid rgba(255,255,255,0.1)', 
            background: '#111' 
          }}>
            <video 
              autoPlay 
              playsInline 
              ref={el => { if(el) el.srcObject = rs.stream }} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: rs.status === 'Active' ? '#10b981' : (rs.status === 'Distracted' ? '#f59e0b' : '#ef4444') }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{rs.name}</span>
            </div>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.4)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
              {rs.attentionScore}% Engagement
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <MeetingControls 
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onLeave={handleLeave}
        onToggleParticipants={() => setShowEngagement(!showEngagement)}
        onShare={handleCopyLink}
        isCopied={copied}
      />

      {/* Side Panels */}
      <EngagementPanel 
        participants={[
          { id: 'me', name: 'You', status, attentionScore },
          ...remoteStreams
        ]} 
        isOpen={showEngagement}
        onClose={() => setShowEngagement(false)}
      />

      <style>{`
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MeetingRoom;

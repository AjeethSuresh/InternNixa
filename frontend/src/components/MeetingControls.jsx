import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Share, Users, Settings, Check } from 'lucide-react';

const MeetingControls = ({ 
  isMicOn, 
  isCamOn, 
  onToggleMic, 
  onToggleCam, 
  onLeave, 
  onToggleParticipants,
  onShare,
  isCopied
}) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.75rem 1.5rem',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(16px)',
      borderRadius: '2rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      zIndex: 1000
    }}>
      <ControlBtn 
        onClick={onToggleMic} 
        active={isMicOn} 
        icon={isMicOn ? <Mic size={20} /> : <MicOff size={20} />} 
        label="Mic"
      />
      <ControlBtn 
        onClick={onToggleCam} 
        active={isCamOn} 
        icon={isCamOn ? <Video size={20} /> : <VideoOff size={20} />} 
        label="Camera"
      />
      
      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 0.5rem' }} />
      
      <ControlBtn 
        onClick={onShare} 
        active={isCopied} 
        icon={isCopied ? <Check size={20} /> : <Share size={20} />} 
        label={isCopied ? "Copied!" : "Share"}
      />
      <ControlBtn 
        onClick={onToggleParticipants} 
        active={false} 
        icon={<Users size={20} />} 
        label="Participants"
      />
      
      <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 0.5rem' }} />
      
      <button 
        onClick={onLeave}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '1rem',
          background: '#ef4444',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          boxShadow: '0 5px 15px rgba(239, 68, 68, 0.4)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

const ControlBtn = ({ onClick, active, icon, label }) => (
  <button 
    onClick={onClick}
    style={{
      width: '45px',
      height: '45px',
      borderRadius: '0.75rem',
      background: active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      color: active ? '#fff' : '#ef4444',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: active ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(239, 68, 68, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
    title={label}
  >
    {icon}
  </button>
);

export default MeetingControls;

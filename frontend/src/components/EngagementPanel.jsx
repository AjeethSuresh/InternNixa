import React from 'react';
import { User, Activity, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

const EngagementPanel = ({ participants, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      right: '1rem',
      top: '5rem',
      bottom: '6rem',
      width: '320px',
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem',
      zIndex: 900,
      boxShadow: '-20px 0 50px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--accent)" />
          Engagement Monitor
        </h3>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {participants.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            No participants yet.
          </div>
        ) : (
          participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))
        )}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Status is updated in real-time using Face Mesh AI.
        </p>
      </div>
    </div>
  );
};

const ParticipantRow = ({ participant }) => {
  const getStatusIcon = () => {
    switch (participant.status) {
      case 'Active': return <CheckCircle2 size={16} color="#10b981" />;
      case 'Distracted': return <AlertCircle size={16} color="#f59e0b" />;
      case 'Away': return <XCircle size={16} color="#ef4444" />;
      case 'Sleeping': return <Activity size={16} color="#ef4444" />;
      default: return <User size={16} color="var(--text-muted)" />;
    }
  };

  const getStatusColor = () => {
    switch (participant.status) {
      case 'Active': return '#10b981';
      case 'Distracted': return '#f59e0b';
      case 'Away':
      case 'Sleeping': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0.75rem', 
      background: 'rgba(255, 255, 255, 0.05)', 
      borderRadius: '0.75rem',
      border: `1px solid ${getStatusColor()}22`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
          {participant.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>{participant.name}</h4>
          <span style={{ fontSize: '0.7rem', color: getStatusColor(), fontWeight: 700 }}>{participant.status}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{participant.attentionScore || 0}%</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Engagement</div>
      </div>
    </div>
  );
};

export default EngagementPanel;

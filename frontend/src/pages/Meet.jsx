import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Link, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Meet = () => {
  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateMeet = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meet/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: `Meeting by ${JSON.parse(localStorage.getItem('user'))?.name || 'User'}` })
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/meet/${data.meetingId}`);
      }
    } catch (err) {
      console.error('Error creating meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeet = (e) => {
    e.preventDefault();
    if (meetingId.trim()) {
      // Extract ID from full URL if pasted
      const id = meetingId.includes('/') ? meetingId.split('/').pop() : meetingId;
      navigate(`/meet/${id}`);
    }
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <header className="header" style={{ marginBottom: '3rem' }}>
        <div>
          <div className="dashboard-brand">
            <div className="dashboard-brand-logo">IX</div>
            <span className="dashboard-brand-name">INTERNIXA</span>
          </div>
          <h1 style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            INTERNIXA MEET
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Real-time video conferencing with AI engagement monitoring.
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', width: '100%' }}>
            {/* Left Side: Create/Join */}
            <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
                background: 'var(--card-bg)',
                padding: '3rem',
                borderRadius: '2rem',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}
            >
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '1rem', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(6,182,212,0.2)' }}>
                <Video size={32} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Start a Meeting</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create a unique space for your team.</p>
            </div>

            <button 
                onClick={handleCreateMeet}
                disabled={loading}
                className="primary-button"
                style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1.1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.75rem',
                background: 'linear-gradient(135deg, var(--accent), #0891b2)',
                boxShadow: '0 10px 25px -5px rgba(6,182,212,0.4)',
                cursor: 'pointer'
                }}
            >
                <Plus size={20} />
                {loading ? 'Creating...' : 'Create New Meeting'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                <div style={{ height: '1px', flex: 1, background: 'var(--glass-border)' }}></div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
                <div style={{ height: '1px', flex: 1, background: 'var(--glass-border)' }}></div>
            </div>

            <form onSubmit={handleJoinMeet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                <Link size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                    type="text" 
                    placeholder="Enter Meeting ID or Link" 
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    style={{ 
                    width: '100%', 
                    padding: '1rem 1rem 1rem 3rem', 
                    borderRadius: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--glass-border)', 
                    color: '#fff',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                    }}
                />
                </div>
                <button 
                type="submit"
                className="secondary-button"
                style={{ 
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--glass-border)', 
                    color: '#fff',
                    padding: '0.8rem',
                    borderRadius: '0.75rem',
                    cursor: 'pointer'
                }}
                >
                Join Meeting
                </button>
            </form>
            </motion.div>

            {/* Right Side: Features/Illustration */}
            <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}
            >
            <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'var(--success)' }}><Users size={24} /></div>
                <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Host any size</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connect with up to 50 participants securely with high-quality audio and video.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: 'var(--accent)' }}><Video size={24} /></div>
                <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>AI Monitoring</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Built-in face detection tracks engagement and provides real-time focus analytics.</p>
                </div>
            </div>

            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌐</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure. Reliable. INTERNIXA.</p>
            </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Meet;

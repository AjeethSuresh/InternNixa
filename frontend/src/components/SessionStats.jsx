import React from 'react';

const SessionStats = ({ stats, onBack, certificateUrl, eligible }) => {
  const { sessionTime, activeTime, warningCount, watchPercentage } = stats;
  const engagementScore = sessionTime > 0 ? Math.round((activeTime / sessionTime) * 100) : 0;

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}${certificateUrl}?t=${new Date().getTime()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        const contentType = res.headers.get('content-type');
        if (contentType && !contentType.includes('application/pdf')) {
            throw new Error('Server returned non-PDF content');
        }
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const filename = `AI_Engagement_Certificate_${new Date().toISOString().split('T')[0]}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 2000);
      })
      .catch(err => {
        console.error('Error downloading certificate:', err);
        alert('Could not download certificate. Please try again from your dashboard history.');
      });
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '550px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Session Summary</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Real-time AI monitoring results for this lesson.
        </p>

        {eligible ? (
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid rgba(52, 211, 153, 0.2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎉 Congratulations! You met all the criteria for a certificate.
          </div>
        ) : (
          <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid rgba(251, 191, 36, 0.2)', fontSize: '0.85rem' }}>
            <strong>Ineligibility Note:</strong> To earn a certificate, you need at least 90% Video Progress and 75% Focus Score.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', margin: '1.5rem 0' }}>
          <div className="history-card" style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', opacity: 0.7 }}>Time in Session</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{sessionTime}s</p>
          </div>
          <div className="history-card" style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', opacity: 0.7 }}>Active Study Time</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{activeTime}s</p>
          </div>
          <div className="history-card" style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', opacity: 0.7 }}>Video Progress</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: watchPercentage >= 90 ? 'var(--success)' : '#f87171' }}>
              {Math.round(watchPercentage)}%
            </p>
          </div>
          <div className="history-card" style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', opacity: 0.7 }}>Focus Score</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: engagementScore >= 75 ? 'var(--primary-light)' : '#fbbf24' }}>
              {engagementScore}%
            </p>
          </div>
        </div>

        {eligible && certificateUrl && (
          <button
            onClick={handleDownload}
            className="primary-button"
            style={{ 
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', 
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
            }}
          >
            Download Certificate
          </button>
        )}

        <button onClick={onBack} className="logout-button" style={{ width: '100%' }}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default SessionStats;

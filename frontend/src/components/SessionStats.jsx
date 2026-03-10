import React from 'react';

const SessionStats = ({ stats, onBack, certificateUrl, eligible }) => {
  const { sessionTime, activeTime, warningCount } = stats;
  const engagementScore = sessionTime > 0 ? Math.round((activeTime / sessionTime) * 100) : 0;

  const handleDownload = () => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}${certificateUrl}?t=${new Date().getTime()}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-cache'
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Use a clean filename
        const filename = `AI_Engagement_Certificate_${new Date().toISOString().split('T')[0]}.pdf`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
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
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <h1>Session Summary</h1>
        {eligible ? (
          <div style={{ background: '#f0fdf4', color: '#166534', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
            🎉 Congratulations! You are eligible for a certificate.
          </div>
        ) : (
          <p>Here is how you performed today:</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2rem 0' }}>
          <div className="history-card">
            <h4>Total Time</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{sessionTime}s</p>
          </div>
          <div className="history-card">
            <h4>Active Time</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>{activeTime}s</p>
          </div>
          <div className="history-card">
            <h4>Warnings</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--warning)' }}>{warningCount}</p>
          </div>
          <div className="history-card">
            <h4>Engagement</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{engagementScore}%</p>
          </div>
        </div>

        {eligible && certificateUrl && (
          <button
            onClick={handleDownload}
            className="primary-button"
            style={{ background: 'var(--success)', marginBottom: '1rem' }}
          >
            Download Certificate
          </button>
        )}

        <button onClick={onBack} className="primary-button">Back to Dashboard</button>
      </div>
    </div>
  );
};

export default SessionStats;

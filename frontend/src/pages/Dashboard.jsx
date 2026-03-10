import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) setUser(JSON.parse(userData));

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/session/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history');
      }
    };

    const fetchEnrollments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enroll/my-courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setEnrollments(data);
      } catch (err) {
        console.error('Failed to fetch enrollments');
      }
    };

    fetchHistory();
    fetchEnrollments();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDownloadHistory = (certificateUrl) => {
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
        a.download = `INTERNIXA_Certificate_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 2000);
      })
      .catch(() => alert('Could not download certificate. Please try refreshing.'));
  };

  const courses = [
    {
      id: 'sample-course',
      title: 'SAMPLE COURSE',
      description: 'A 30-second demo lesson to experience the AI-monitored learning environment.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
      isDemo: true,
      modules: [
        {
          id: 'demo-lesson',
          title: 'Demo Lesson',
          description: 'A 30-second sample video to test the system.',
          videoId: 'scWj1BMRHUA', // 30s video
        }
      ]
    },
    {
      id: 'data-analyst',
      title: 'Data Analyst Bootcamp',
      description: 'Master data visualization, SQL, and Excel for analytics.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
      modules: [
        {
          id: 'da-intro',
          title: 'Part 1: Introduction to Data Analytics',
          description: 'Understanding the fundamentals of data analysis.',
          videoId: 'ibVm6HgNTjM'
        },
        {
          id: 'da-sql',
          title: 'Part 2: SQL for Data Analysis',
          description: 'Learn queries, joins, and data manipulation.',
          videoId: '7S_tz1z_5bA'
        },
        {
          id: 'da-viz',
          title: 'Part 3: Data Visualization',
          description: 'Creating impactful charts and storytelling with data.',
          videoId: 'hXsf_SreYTM'
        }
      ]
    },
    {
      id: 'data-scientist',
      title: 'Data Science Specialization',
      description: 'Learn Python, Machine Learning, and Statistical modeling.',
      image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop',
      modules: [
        {
          id: 'ds-python',
          title: 'Part 1: Intro to Python for Data Science',
          description: 'Python basics, NumPy, and Pandas library.',
          videoId: 'LHBE6Q9XIzI'
        },
        {
          id: 'ds-ml',
          title: 'Part 2: Machine Learning Foundations',
          description: 'Linear regression, classification, and model training.',
          videoId: 'i_LwzRVP7bg'
        },
        {
          id: 'ds-stats',
          title: 'Part 3: Statistical Inference',
          description: 'Probability, hypothesis testing, and data distribution.',
          videoId: '169m_pS_Bv4'
        }
      ]
    }
  ];

  const handleEnroll = async (course) => {
    const token = localStorage.getItem('token');
    const enrollment = enrollments.find(e => e.courseId === course.id);

    if (enrollment) {
      // Already enrolled
      if (course.isDemo) {
        navigate('/session', { state: { course, module: course.modules[0] } });
      } else {
        navigate(`/course/${course.id}`, { state: { course } });
      }
      return;
    }

    // Not enrolled, perform enrollment
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enroll/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseId: course.id })
      });

      if (response.ok) {
        const newEnrollment = await response.json();
        setEnrollments([...enrollments, newEnrollment]);

        if (course.isDemo) {
          navigate('/session', { state: { course, module: course.modules[0] } });
        } else {
          navigate(`/course/${course.id}`, { state: { course } });
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Enrollment failed');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('An error occurred during enrollment');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header with INTERNIXA brand */}
      <header className="header">
        <div>
          <div className="dashboard-brand">
            <div className="dashboard-brand-logo">IX</div>
            <span className="dashboard-brand-name">INTERNIXA</span>
          </div>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Welcome back, <strong style={{ color: 'var(--text-main)' }}>{user?.name || 'Student'}</strong> 👋
          </h1>
        </div>
        <button onClick={handleLogout} className="logout-button">↩ Logout</button>
      </header>

      {/* Courses */}
      <section className="courses-section">
        <h2 className="section-title">🎓 Explore Courses</h2>
        <div className="history-grid">
          {courses.map(course => (
            <div key={course.id} className="history-card course-card">
              <div style={{ overflow: 'hidden', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <img src={course.image} alt={course.title} style={{ width: '100%', display: 'block', margin: 0 }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem' }}>{course.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                {course.description}
              </p>
              <button onClick={() => handleEnroll(course)} className="primary-button">
                {enrollments.find(e => e.courseId === course.id) ? '▶ Continue Learning' : '▶ Enroll Now'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Previous Sessions */}
      {history.length > 0 && (
        <div className="history-section" style={{ marginTop: '4rem' }}>
          <h2 className="section-title">📋 Previous Sessions</h2>
          <div className="history-grid">
            {history.map(session => (
              <div key={session._id} className="history-card session-history-card">
                <div className="session-score">{session.engagementScore}%</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  Engagement Score
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>⏱ {Math.round(session.totalTime / 60)}m</span>
                  <span>📅 {new Date(session.completedAt).toLocaleDateString()}</span>
                </div>
                {session.certificateUrl && (
                  <button
                    onClick={() => handleDownloadHistory(session.certificateUrl)}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 0.8rem',
                      fontSize: '0.78rem',
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(6,182,212,0.15))',
                      color: 'var(--success)',
                      border: '1px solid rgba(52,211,153,0.3)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      width: '100%',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(52,211,153,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(6,182,212,0.15))'}
                  >
                    ⬇ Download Certificate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

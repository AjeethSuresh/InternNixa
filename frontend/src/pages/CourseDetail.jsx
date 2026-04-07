import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChatBot } from '../components/ChatBot';

const CourseDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [fullCourse, setFullCourse] = useState(null);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [enrollment, setEnrollment] = useState(null);

    useEffect(() => {
        const fetchCourseDetail = async () => {
            try {
                const token = localStorage.getItem('token');
                // Use courseId from URL
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setFullCourse(data.course);
                    setEnrollment(data.enrollment);
                    setProgressPercentage(data.progressPercentage);
                }
            } catch (err) {
                console.error('Failed to fetch course details');
            }
        };

        if (courseId) {
            fetchCourseDetail();
        }
    }, [courseId]);

    if (!fullCourse) {
        return (
            <div className="dashboard-container">
                <div className="error-message">Loading course data...</div>
                <button onClick={() => navigate('/dashboard')} className="logout-button">Back to Dashboard</button>
            </div>
        );
    }

    const handleStartModule = (module) => {
        if (module.isLocked) return;
        navigate('/session', { state: { course: fullCourse, module } });
    };

    return (
        <div className="dashboard-container">
            <header className="header">
                <div>
                    <div className="dashboard-brand">
                        <div className="dashboard-brand-logo">IX</div>
                        <span className="dashboard-brand-name">INTERNIXA</span>
                    </div>
                    <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', fontWeight: 700 }}>
                        {fullCourse.title}
                    </h1>
                </div>
                <button onClick={() => navigate('/dashboard')} className="logout-button">← Back</button>
            </header>

            <section className="courses-section">
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: '0 0 400px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', aspectRatio: '16/9', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={fullCourse.image} alt={fullCourse.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 className="section-title">Description</h2>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1rem', marginBottom: '2rem' }}>
                            {fullCourse.description}
                        </p>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong style={{color: 'var(--primary-light)'}}>Course Progress</strong>
                                <strong style={{color: 'var(--accent)'}}>{progressPercentage}%</strong>
                            </div>
                            <div style={{ width: '100%', height: '10px', background: 'var(--glass-bg)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'var(--primary-light)', transition: 'width 1s ease-in-out' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>📚 Course Modules ({fullCourse.modules.length})</h2>
                    {enrollment?.status === 'completed' && (
                        <div style={{ background: 'var(--success)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700 }}>
                            ✅ COURSE COMPLETED
                        </div>
                    )}
                </div>

                <div className="history-grid" style={{ gridTemplateColumns: '1fr', maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem' }}>
                    {fullCourse.modules.map((module, index) => {
                        const isCompleted = module.isCompleted;
                        const isLocked = module.isLocked;
                        
                        return (
                            <div key={module.id} className="history-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', opacity: (isCompleted || isLocked) ? 0.6 : 1, filter: isLocked ? 'grayscale(0.8)' : 'none', padding: '1rem 1.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: isLocked ? 'var(--text-muted)' : 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                        Module {index + 1} {isCompleted && '✅'} {isLocked && '🔒'}
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: isLocked ? 'var(--text-muted)' : 'inherit' }}>{module.title}</h3>
                                </div>
                                <button
                                    onClick={() => handleStartModule(module)}
                                    className="primary-button"
                                    disabled={isLocked}
                                    style={{
                                        width: 'auto',
                                        padding: '0.6rem 1.2rem',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        background: isLocked ? 'var(--bg-card)' : (isCompleted ? 'rgba(52,211,153,0.1)' : undefined),
                                        color: isLocked ? '#666' : (isCompleted ? 'var(--success)' : undefined),
                                        border: isLocked ? '1px solid #444' : (isCompleted ? '1px solid var(--success)' : undefined),
                                        cursor: isLocked ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isLocked ? '🔒 Locked' : (isCompleted ? 'Replay' : '▶ Start Lesson')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
            <ChatBot courseId={courseId} />
        </div>
    );
};

export default CourseDetail;

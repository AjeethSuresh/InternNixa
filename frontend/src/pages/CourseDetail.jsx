import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const CourseDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const course = state?.course;
    const [enrollment, setEnrollment] = useState(null);

    useEffect(() => {
        const fetchEnrollmentStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enroll/status/${course.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok && data.enrolled) {
                    setEnrollment(data.enrollment);
                }
            } catch (err) {
                console.error('Failed to fetch enrollment status');
            }
        };

        if (course) {
            fetchEnrollmentStatus();
        }
    }, [course]);

    if (!course) {
        return (
            <div className="dashboard-container">
                <div className="error-message">Course not found.</div>
                <button onClick={() => navigate('/dashboard')} className="logout-button">Back to Dashboard</button>
            </div>
        );
    }

    const handleStartModule = (module) => {
        navigate('/session', { state: { course, module } });
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
                        {course.title}
                    </h1>
                </div>
                <button onClick={() => navigate('/dashboard')} className="logout-button">← Back</button>
            </header>

            <section className="courses-section">
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: '0 0 400px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <img src={course.image} alt={course.title} style={{ width: '100%', display: 'block' }} />
                    </div>
                    <div>
                        <h2 className="section-title">Description</h2>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1rem' }}>
                            {course.description}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>📚 Course Modules</h2>
                    {enrollment?.status === 'completed' && (
                        <div style={{ background: 'var(--success)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 700 }}>
                            ✅ COURSE COMPLETED
                        </div>
                    )}
                </div>

                <div className="history-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {course.modules.map((module, index) => {
                        const isCompleted = enrollment?.completedModules.includes(module.id);
                        return (
                            <div key={module.id} className="history-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', opacity: isCompleted ? 0.7 : 1 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                        Module {index + 1} {isCompleted && '✓'}
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{module.title}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{module.description}</p>
                                </div>
                                <button
                                    onClick={() => handleStartModule(module)}
                                    className="primary-button"
                                    style={{
                                        width: 'auto',
                                        padding: '0.7rem 1.5rem',
                                        whiteSpace: 'nowrap',
                                        background: isCompleted ? 'rgba(52,211,153,0.1)' : undefined,
                                        color: isCompleted ? 'var(--success)' : undefined,
                                        border: isCompleted ? '1px solid var(--success)' : undefined
                                    }}
                                >
                                    {isCompleted ? 'Replay Lesson' : '▶ Start Lesson'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default CourseDetail;

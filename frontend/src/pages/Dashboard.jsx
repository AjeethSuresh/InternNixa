import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { ChatBot } from '../components/ChatBot';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
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

    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses');
      }
    };

    fetchHistory();
    fetchEnrollments();
    fetchCourses();
  }, []);

  const nextSlide = () => {
    if (courses.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  const prevSlide = () => {
    if (courses.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  useEffect(() => {
    if (isPaused || courses.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, courses.length]);

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

    // Courses are now fetched from backend

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

  const completedCount = enrollments.filter(e => e.isCompleted).length;
  const certificateCount = history.filter(h => h.certificateUrl).length;

  return (
    <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
      {/* Hero Welcome Section */}
      <section className="relative px-6 py-12 mb-12 text-center hero-gradient rounded-3xl border border-white/5 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center mb-6">
            <div className="dashboard-brand-logo w-16 h-16 text-xl">IX</div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Welcome back, <span className="text-brand-400">{user?.name || 'Scholar'}</span>!
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
             Track your progress and continue your learning journey.
          </p>
        </motion.div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'All Courses', count: courses.length, icon: '📚', color: 'brand' },
          { label: 'Enrolled', count: enrollments.length, icon: 'emerald', icon_char: '🎓', color: 'emerald' },
          { label: 'Completed', count: completedCount, icon: 'cyan', icon_char: '✅', color: 'cyan' },
          { label: 'Certificates', count: certificateCount, icon: 'amber', icon_char: '📜', color: 'amber' }
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${metric.color}-500/10 blur-3xl rounded-full`} />
            <div className="flex items-center gap-4 relative z-10">
              <span className="text-3xl">{metric.icon_char || metric.icon}</span>
              <div>
                <div className="text-2xl font-black">{metric.count}</div>
                <div className="text-xs text-text-muted font-bold uppercase tracking-widest">{metric.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Recent Activity / Previous Sessions */}
      {history.length > 0 && (
        <section className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title mb-0">🔄 Recent Activity</h2>
            <button 
              onClick={() => navigate('/my-learning')}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors uppercase tracking-widest"
            >
              View All ↗
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {history.slice(0, 3).map((session, i) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-white text-base leading-snug mb-2 line-clamp-2" title={session.courseTitle}>
                        {session.courseTitle || 'Learning Session'}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted font-bold tracking-wide uppercase">
                         <span className="flex items-center gap-1">📅 {new Date(session.timestamp || session.completedAt).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1">⏱️ {Math.round((session.totalTime || 0) / 60)}m</span>
                      </div>
                    </div>
                    <div className="text-right flex-none">
                      <div className="text-2xl font-black text-brand-400 leading-none">
                        {session.engagementScore || session.score}%
                      </div>
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Score</div>
                    </div>
                  </div>
                {session.certificateUrl && (
                  <button 
                    onClick={() => handleDownloadHistory(session.certificateUrl)}
                    className="w-full mt-2 py-3 glass hover:bg-brand-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-400 border border-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    📜 Download Certificate
                  </button>
                )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State if no history */}
      {history.length === 0 && (
         <section className="py-20 text-center glass rounded-[3rem] border border-white/5">
            <div className="text-5xl mb-6">✨</div>
            <h2 className="text-2xl font-bold mb-2">Start Your Journey</h2>
            <p className="text-text-muted mb-8 max-w-xs mx-auto">You haven't completed any sessions yet. Visit Explore to find your first course!</p>
            <button 
              onClick={() => navigate('/explore-courses')}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-bold transition-all"
            >
              🚀 Explore Courses
            </button>
         </section>
      )}

      <ChatBot />
    </div>
  );
};;

export default Dashboard;

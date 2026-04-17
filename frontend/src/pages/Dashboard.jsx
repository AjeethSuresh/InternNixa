import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Book, GraduationCap, Zap, FileText, History, Calendar, Clock, Rocket, Sparkles } from 'lucide-react';
import { ChatBot } from '../components/ChatBot';
import { fetchWithAuth } from '../lib/api';

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
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/session/history`);
        const data = await response.json();
        if (response.ok) setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history');
      }
    };

    const fetchEnrollments = async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/enroll/my-courses`);
        const data = await response.json();
        if (response.ok) setEnrollments(data);
      } catch (err) {
        console.error('Failed to fetch enrollments');
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/courses`);
        const data = await response.json();
        if (response.ok) setCourses(data);
      } catch (err) {
        console.error('Failed to fetch courses');
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/auth/profile`);
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          localStorage.setItem('currentUser', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Failed to fetch user profile');
      }
    };

    fetchHistory();
    fetchEnrollments();
    fetchCourses();
    fetchUserProfile();
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
    fetchWithAuth(`${import.meta.env.VITE_API_URL}${certificateUrl}?t=${new Date().getTime()}`, {
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
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/enroll/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

  const completedCount = enrollments.filter(e => e.status === 'completed' || e.isCompleted).length;
  const certificateCount = history.filter(h => h.certificateUrl).length;

  return (
    <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
      {/* Hero Welcome Section */}
      <section className="relative px-6 py-16 mb-12 text-center hero-gradient rounded-[3rem] border border-white/5 overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/20 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full animate-pulse delay-700" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] rotate-3 hover:rotate-0 transition-transform duration-500">
              IX
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
            {history.length === 0 ? 'Welcome' : 'Welcome back'}, <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">{user?.name || 'Scholar'}</span>!
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-medium">
             Your learning journey continues here. You have <span className="text-white font-bold">{courses.length - enrollments.length} new courses</span> waiting to be discovered.
          </p>
        </motion.div>
      </section>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {[
          { label: 'All Courses', count: courses.length, icon: <Book className="w-8 h-8 text-brand-400" />, color: 'brand', path: '/explore-courses', gradient: 'from-brand-500/20 to-transparent' },
          { label: 'Enrolled', count: enrollments.length, icon: <GraduationCap className="w-8 h-8 text-emerald-400" />, color: 'emerald', path: '/my-learning', gradient: 'from-emerald-500/20 to-transparent' },
          { label: 'Focus Points', count: user?.totalFocusPoints || 0, icon: <Zap className="w-8 h-8 text-brand-400 animate-pulse" />, color: 'brand', path: '/leaderboard', gradient: 'from-brand-500/20 to-transparent', bonus: 'Ranked' },
          { label: 'Certificates', count: certificateCount, icon: <FileText className="w-8 h-8 text-amber-400" />, color: 'amber', path: '/certificates', gradient: 'from-amber-500/20 to-transparent' }
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            onClick={() => navigate(metric.path)}
            className={`glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500 cursor-pointer active:scale-95 shadow-lg hover:shadow-${metric.color}-500/10`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="flex flex-col gap-4 relative z-10">
              <div className={`w-14 h-14 bg-${metric.color}-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner`}>
                {metric.icon}
              </div>
              <div>
                <div className="text-3xl font-black mb-1 group-hover:scale-110 transition-transform origin-left duration-300">{metric.count}</div>
                <div className="text-[11px] text-text-muted font-bold uppercase tracking-[0.2em]">{metric.label}</div>
              </div>
            </div>
            
            {/* Visual accent */}
            <div className={`absolute bottom-0 right-0 w-24 h-24 bg-${metric.color}-500/5 blur-[40px] rounded-full translate-x-8 translate-y-8`} />
          </motion.div>
        ))}
      </section>

      {/* Recent Activity / Previous Sessions */}
      {history.length > 0 && (
        <section className="mb-20">
          <div className="flex justify-between items-center mb-8">
            <h2 className="section-title mb-0 flex items-center gap-3"><History className="w-6 h-6 text-brand-400" /> Recent Activity</h2>
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
                onClick={() => navigate(`/course/${session.courseId || 'sql-course'}`)}
                className="glass p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group cursor-pointer active:scale-95"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-white text-base leading-snug mb-2 line-clamp-2" title={session.courseTitle}>
                        {session.courseTitle || 'Learning Session'}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted font-bold tracking-wide uppercase">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(session.timestamp || session.completedAt).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round((session.totalTime || 0) / 60)}m</span>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadHistory(session.certificateUrl);
                    }}
                    className="w-full mt-2 py-3 glass hover:bg-brand-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-400 border border-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Download Certificate
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
             <div className="flex justify-center mb-6">
                <Sparkles className="w-12 h-12 text-brand-400" />
             </div>
             <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter italic">Start Your Journey</h2>
             <p className="text-text-muted mb-8 max-w-xs mx-auto">You haven't completed any sessions yet. Visit Explore to find your first course!</p>
             <button 
               onClick={() => navigate('/explore-courses')}
               className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-bold transition-all flex items-center gap-2 mx-auto"
             >
               <Rocket className="w-5 h-5" /> Explore Courses
             </button>
          </section>
       )}

      <ChatBot />
    </div>
  );
};;

export default Dashboard;

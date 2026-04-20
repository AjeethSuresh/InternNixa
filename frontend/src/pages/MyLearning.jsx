import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, CheckCircle, Clock } from 'lucide-react';
import { ChatBot } from '../components/ChatBot';

const MyLearning = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [coursesRes, enrollmentsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/api/courses`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${import.meta.env.VITE_API_URL}/api/enroll/my-courses`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const coursesData = await coursesRes.json();
                const enrollmentsData = await enrollmentsRes.json();

                if (coursesRes.ok) setCourses(coursesData);
                if (enrollmentsRes.ok) setEnrollments(enrollmentsData);
            } catch (err) {
                console.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const enrichedEnrollments = enrollments.map(e => {
        const course = courses.find(c => c.id === e.courseId);
        return { ...e, course };
    }).filter(e => e.course);

    const inProgress = enrichedEnrollments.filter(e => e.status !== 'completed' && !e.isCompleted);
    const completed = enrichedEnrollments.filter(e => e.status === 'completed' || e.isCompleted);

    const LearningCard = ({ enrollment, isCompleted }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-[2rem] border border-white/5 hover:border-brand-500/20 transition-all flex flex-col sm:flex-row gap-6 relative overflow-hidden group"
        >
            <div className="w-full sm:w-48 aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-surface-800/50 flex items-center justify-center p-6 flex-none">
                <img src={enrollment.course.image} alt={enrollment.course.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-400">
                    {isCompleted ? <CheckCircle size={12} /> : <Clock size={12} />}
                    <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight line-clamp-1" title={enrollment.course.title}>
                    {enrollment.course.title}
                </h3>
                <p className="text-sm text-text-muted mb-6 leading-relaxed line-clamp-2">{enrollment.course.description}</p>
                
                {/* Progress Bar Mockup */}
                {!isCompleted && (
                    <div className="w-full h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full w-[45%]" />
                    </div>
                )}

                <button 
                    onClick={() => navigate(`/course/${enrollment.course.id}`, { state: { course: enrollment.course } })}
                    className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all ${isCompleted ? 'glass text-white/70' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/20'}`}
                >
                    {isCompleted ? 'Review Content' : 'Continue Learning'}
                </button>
            </div>
        </motion.div>
    );

    if (loading) return (
        <div className="pt-32 px-12 text-center text-text-muted">
            <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
            Loading your learning path...
        </div>
    );

    return (
        <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
            <header className="mb-16 relative">
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                <h1 className="text-5xl font-black mb-4 tracking-tight">My Learning</h1>
                <p className="text-lg text-text-muted font-medium">Continue your path to excellence</p>
            </header>

            {/* In Progress */}
            <section className="mb-24">
                <div className="flex items-center gap-4 mb-10">
                    <h2 className="text-2xl font-black tracking-tight">🚀 Active Path</h2>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                
                {inProgress.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8">
                        {inProgress.map(e => (
                            <motion.div 
                                key={e._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass p-8 rounded-[3rem] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row gap-10 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] translate-x-32 -translate-y-32 pointer-events-none" />
                                
                                <div className="w-full md:w-64 aspect-video md:aspect-square rounded-[2rem] overflow-hidden bg-surface-800 flex items-center justify-center p-8 flex-none shadow-inner group-hover:p-6 transition-all duration-500">
                                    <img src={e.course.image} alt={e.course.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="px-3 py-1 bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-500/30">
                                            In Progress
                                        </div>
                                        <div className="text-xs text-text-muted font-bold">
                                            Last active: {new Date(e.enrolledAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black mb-3 tracking-tight group-hover:text-brand-400 transition-colors">
                                        {e.course.title}
                                    </h3>
                                    <p className="text-base text-text-muted mb-8 leading-relaxed line-clamp-2 max-w-3xl font-medium">{e.course.description}</p>
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-8 w-full mt-auto">
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-black uppercase tracking-widest text-text-muted">Total Attendance</span>
                                                <span className="text-xs font-black text-brand-400">{e.attendance}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${e.attendance}%` }}
                                                    className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/course/${e.course.id}`, { state: { course: e.course } })}
                                            className="w-full sm:w-auto px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-[0_10px_30px_rgba(124,58,237,0.3)] active:scale-95 flex-none"
                                        >
                                            Resume Journey
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass p-20 rounded-[4rem] text-center border border-white/5 border-dashed relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="text-6xl mb-8">✨</div>
                        <h3 className="text-2xl font-bold mb-4">No active courses</h3>
                        <p className="text-text-muted mb-10 max-w-xs mx-auto font-medium leading-relaxed">Your learning path is clear. Ready to start something new?</p>
                        <button onClick={() => navigate('/explore-courses')} className="px-10 py-4 glass hover:bg-white/10 rounded-full font-black text-xs uppercase tracking-widest transition-all">
                            Browse Catalog
                        </button>
                    </div>
                )}
            </section>

            {/* Completed */}
            {completed.length > 0 && (
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <h2 className="text-2xl font-black tracking-tight">✅ Achievements</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {completed.map(e => (
                             <motion.div 
                                key={e._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass p-8 rounded-[3rem] border border-white/5 hover:border-emerald-500/30 transition-all flex gap-8 group"
                             >
                                <div className="w-32 h-32 rounded-[1.5rem] overflow-hidden bg-surface-800/50 flex-none p-6 group-hover:p-4 transition-all duration-500">
                                    <img src={e.course.image} alt={e.course.title} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <CheckCircle size={12} /> Certified
                                    </div>
                                    <h3 className="text-xl font-black mb-4 leading-tight">{e.course.title}</h3>
                                    <button 
                                        onClick={() => navigate(`/course/${e.course.id}`, { state: { course: e.course } })}
                                        className="text-white/60 hover:text-white text-xs font-bold transition-colors flex items-center gap-2"
                                    >
                                        Review Content ↗
                                    </button>
                                </div>
                             </motion.div>
                        ))}
                    </div>
                </section>
            )}
            <ChatBot />
        </div>
    );
};

export default MyLearning;

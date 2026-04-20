import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBot } from '../components/ChatBot';
import { Book, Clock, TrendingUp, CheckCircle, Lock, Sparkles, GraduationCap } from 'lucide-react';

const CourseDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [fullCourse, setFullCourse] = useState(null);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [attendancePercentage, setAttendancePercentage] = useState(0);
    const [enrollment, setEnrollment] = useState(null);
    const userRole = JSON.parse(localStorage.getItem('currentUser') || '{}').role;

    useEffect(() => {
        if (userRole === 'recruiter') {
            navigate('/leaderboard');
        }
    }, [userRole, navigate]);

    useEffect(() => {
        const fetchCourseDetail = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setFullCourse(data.course);
                    setEnrollment(data.enrollment);
                    setProgressPercentage(data.progressPercentage);
                    setAttendancePercentage(data.attendancePercentage || 0);
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
            <div className="pt-32 text-center text-text-muted">
                <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
                Loading Course Intelligence...
            </div>
        );
    }

    const handleStartModule = (module) => {
        if (module.isLocked) return;
        navigate('/session', { state: { course: fullCourse, module } });
    };

    return (
        <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
            <header className="mb-12 flex justify-between items-center">
                <div>
                   <div className="flex items-center gap-4 mb-2">
                       <div className="px-3 py-1 bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-brand-500/30">
                           {fullCourse.category || 'Specialized Domain'}
                       </div>
                   </div>
                   <h1 className="text-4xl font-black tracking-tight">{fullCourse.title}</h1>
                </div>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-2 glass hover:bg-white/10 rounded-xl font-bold transition-all text-sm">
                   ← Dashboard
                </button>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
                <div className="lg:col-span-2">
                    <div className="glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group mb-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] pointer-events-none" />
                        <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Book size={20} className="text-brand-400" /> Description</h2>
                        <p className="text-text-muted leading-relaxed font-medium mb-8">
                            {fullCourse.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Attendance Meter */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                        <Clock size={14} className="text-brand-400" /> Attendance
                                    </span>
                                    <span className="text-sm font-black text-brand-400">{attendancePercentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${attendancePercentage}%` }}
                                        className="h-full bg-brand-500 rounded-full"
                                     />
                                </div>
                                <p className="text-[10px] text-text-muted mt-3 font-medium italic">Based on 10 hours focus target</p>
                            </div>

                            {/* Progress Meter */}
                            <div className="glass p-6 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                                        <TrendingUp size={14} className="text-emerald-400" /> Progress
                                    </span>
                                    <span className="text-sm font-black text-emerald-400">{progressPercentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        className="h-full bg-emerald-500 rounded-full"
                                     />
                                </div>
                                <p className="text-[10px] text-text-muted mt-3 font-medium italic">Syllabus completion status</p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black mb-8 px-4 flex items-center gap-3">
                        <Sparkles size={24} className="text-brand-400" /> Learning Path
                    </h2>
                    
                    <div className="space-y-4">
                        {fullCourse.modules.map((module, index) => (
                            <motion.div 
                                key={module.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`glass p-6 rounded-[2rem] border border-white/5 flex items-center justify-between gap-6 group hover:border-white/10 transition-all ${module.isLocked ? 'opacity-50 grayscale' : ''}`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${module.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/10 text-brand-400'}`}>
                                        {module.isCompleted ? <CheckCircle size={24} /> : (index + 1)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{module.title}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Module {index + 1}</span>
                                            {module.isLocked && <span className="text-[10px] flex items-center gap-1 text-amber-500 font-bold uppercase"><Lock size={10} /> Locked</span>}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleStartModule(module)}
                                    disabled={module.isLocked}
                                    className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${module.isLocked ? 'bg-white/5 text-white/20 cursor-not-allowed' : (module.isCompleted ? 'glass text-white/50 hover:text-white' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/20')}`}
                                >
                                    {module.isLocked ? 'Locked' : (module.isCompleted ? 'Review' : 'Start Lesson')}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-8">
                        <div className="glass rounded-[3rem] overflow-hidden border border-white/5">
                            <img src={fullCourse.image} alt={fullCourse.title} className="w-full aspect-video object-cover" />
                        </div>
                        
                        <div className="glass p-8 rounded-[2.5rem] border border-white/5 text-center">
                            <GraduationCap size={40} className="text-brand-400 mx-auto mb-4" />
                            <h3 className="font-black text-xl mb-2">Build Your Future</h3>
                            <p className="text-sm text-text-muted font-medium mb-6">Complete this path to become a domain expert and rank on the global leaderboard.</p>
                            <button className="w-full py-4 glass hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                                Download Syllabus
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            
            <ChatBot courseId={courseId} />
        </div>
    );
};

export default CourseDetail;

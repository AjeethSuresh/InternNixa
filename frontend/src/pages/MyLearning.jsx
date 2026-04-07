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

    const inProgress = enrichedEnrollments.filter(e => !e.isCompleted);
    const completed = enrichedEnrollments.filter(e => e.isCompleted);

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
            <header className="mb-12">
                <h1 className="text-4xl font-black mb-2 tracking-tight">My Learning</h1>
                <p className="text-text-muted">Pick up where you left off</p>
            </header>

            {/* In Progress */}
            <section className="mb-16">
                <h2 className="section-title mb-8">🚀 In Progress</h2>
                {inProgress.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {inProgress.map(e => <LearningCard key={e._id} enrollment={e} isCompleted={false} />)}
                    </div>
                ) : (
                    <div className="glass p-12 rounded-[2rem] text-center text-text-muted border border-white/5 border-dashed">
                        No courses in progress yet. Go explore the catalog!
                    </div>
                )}
            </section>

            {/* Completed */}
            {completed.length > 0 && (
                <section>
                    <h2 className="section-title mb-8">✅ Completed</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {completed.map(e => <LearningCard key={e._id} enrollment={e} isCompleted={true} />)}
                    </div>
                </section>
            )}
            <ChatBot />
        </div>
    );
};

export default MyLearning;

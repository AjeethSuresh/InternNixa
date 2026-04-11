import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Search, Filter } from 'lucide-react';
import { ChatBot } from '../components/ChatBot';

const ExploreCourses = () => {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
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

        fetchCourses();
        fetchEnrollments();
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

    const handleEnroll = async (course) => {
        const isEnrolled = enrollments.find(e => e.courseId === course.id);
        
        if (isEnrolled) {
            if (course.isDemo || course.id === 'local-video-demo') {
                navigate('/session', { state: { course, module: course.modules[0] } });
            } else {
                navigate(`/course/${course.id}`, { state: { course } });
            }
            return;
        }

        try {
            const token = localStorage.getItem('token');
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
                
                if (course.isDemo || course.id === 'local-video-demo') {
                    navigate('/session', { state: { course, module: course.modules[0] } });
                } else {
                    navigate(`/course/${course.id}`, { state: { course } });
                }
            } else {
                const error = await response.json();
                alert(error.detail || error.message || 'Enrollment failed');
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            alert('An error occurred during enrollment');
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
            {/* Page Header */}
            <header className="mb-16 relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />
                <h1 className="text-5xl font-black mb-4 tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Explore Courses</h1>
                <p className="text-lg text-text-muted font-medium">Master In-Demand Skills with Industry Expert Content</p>
            </header>

            {/* Featured Carousel */}
            <section className="mb-24">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-3">
                            <span className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center text-sm">✨</span>
                            Featured Learning
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={prevSlide} className="p-3 rounded-2xl glass hover:bg-white/10 transition-all hover:scale-110 active:scale-90 border border-white/10"><ChevronLeft size={20} /></button>
                        <button onClick={nextSlide} className="p-3 rounded-2xl glass hover:bg-white/10 transition-all hover:scale-110 active:scale-90 border border-white/10"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div 
                    className="relative py-8 carousel-mask overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <motion.div 
                        className="flex gap-8"
                        animate={{ x: `calc(-${currentIndex * 380}px)` }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        style={{ width: "fit-content" }}
                    >
                        {courses.map((course, idx) => {
                            const isEnrolled = enrollments.find(e => e.courseId === course.id);
                            return (
                                <motion.div 
                                    key={course.id} 
                                    className={`flex-none w-[360px] glass p-8 rounded-[3rem] border border-white/5 transition-all duration-700 relative overflow-hidden group ${idx === currentIndex ? 'ring-2 ring-brand-500/40 shadow-[0_30px_60px_rgba(0,0,0,0.5)] scale-100 opacity-100' : 'opacity-30 scale-90 blur-[2px]'}`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                    
                                    <div className="relative mb-8 rounded-[2rem] overflow-hidden aspect-video bg-surface-800 flex items-center justify-center p-8 group-hover:p-6 transition-all duration-500 shadow-inner">
                                        <img src={course.image} alt={course.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-3 tracking-tight line-clamp-2 h-16 leading-tight" title={course.title}>
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-text-muted mb-8 leading-relaxed line-clamp-2 h-10 font-medium">{course.description}</p>
                                    <button 
                                        onClick={() => handleEnroll(course)} 
                                        className="primary-button flex items-center justify-center gap-3 py-4 text-sm font-black uppercase tracking-widest"
                                    >
                                        {isEnrolled ? (
                                            <><div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"><Play size={10} fill="currentColor" /></div> Continue</>
                                        ) : (
                                            '▶ Enroll Now'
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* Search and All Courses Grid */}
            <section>
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                    <h2 className="text-3xl font-black tracking-tight">Catalog</h2>
                    <div className="relative w-full md:w-[400px] group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-400 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search skills, tools, or courses..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-16 pr-6 py-5 glass rounded-3xl border border-white/5 focus:border-brand-500/50 transition-all outline-none font-medium shadow-lg focus:shadow-brand-500/10"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredCourses.map((course) => {
                        const isEnrolled = enrollments.find(e => e.courseId === course.id);
                        return (
                            <motion.div 
                                key={course.id} 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="glass p-8 rounded-[3rem] border border-white/5 hover:border-white/10 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] -translate-y-16 translate-x-16 pointer-events-none" />
                                
                                <div className="mb-8 rounded-2xl overflow-hidden aspect-video bg-surface-800/40 flex items-center justify-center p-8 group-hover:p-6 transition-all duration-500 border border-white/5">
                                    <img src={course.image} alt={course.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <h3 className="text-xl font-extrabold mb-3 line-clamp-2 h-14 leading-tight group-hover:text-brand-400 transition-colors" title={course.title}>
                                    {course.title}
                                </h3>
                                <p className="text-sm text-text-muted mb-8 line-clamp-2 h-10 leading-relaxed font-medium">{course.description}</p>
                                <button 
                                    onClick={() => handleEnroll(course)} 
                                    className={`w-full py-4 rounded-[1.5rem] font-black uppercase tracking-tighter text-sm transition-all duration-300 ${isEnrolled ? 'glass text-brand-400 border-brand-500/20 hover:bg-brand-500/5' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/20 active:scale-95'}`}
                                >
                                    {isEnrolled ? 'Open Course' : 'Enroll Now'}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            </section>
            <ChatBot />
        </div>
    );
};

export default ExploreCourses;

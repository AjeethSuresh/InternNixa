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
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/enroll`, {
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
                navigate(`/course/${course.id}`, { state: { course } });
            }
        } catch (err) {
            console.error('Enrollment error:', err);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
            {/* Page Header */}
            <header className="mb-12">
                <h1 className="text-4xl font-black mb-2 tracking-tight">Explore Courses</h1>
                <p className="text-text-muted">Master In-Demand Skills with Industry Expert Content</p>
            </header>

            {/* Featured Carousel */}
            <section className="mb-20">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">✨ Featured Courses</h2>
                    <div className="flex gap-2">
                        <button onClick={prevSlide} className="p-2 rounded-full glass hover:bg-white/5 transition-all"><ChevronLeft size={20} /></button>
                        <button onClick={nextSlide} className="p-2 rounded-full glass hover:bg-white/5 transition-all"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div 
                    className="relative py-4 carousel-mask overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <motion.div 
                        className="flex gap-6"
                        animate={{ x: `calc(-${currentIndex * 360}px)` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{ width: "fit-content" }}
                    >
                        {courses.map((course, idx) => {
                            const isEnrolled = enrollments.find(e => e.courseId === course.id);
                            return (
                                <motion.div 
                                    key={course.id} 
                                    className={`flex-none w-[340px] glass p-6 rounded-[2rem] transition-all duration-500 ${idx === currentIndex ? 'ring-2 ring-brand-500/50 shadow-2xl scale-100' : 'opacity-40 scale-90'}`}
                                >
                                    <div className="relative mb-6 rounded-2xl overflow-hidden aspect-video bg-surface-800 flex items-center justify-center p-8">
                                        <img src={course.image} alt={course.title} className="w-full h-full object-contain" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 tracking-tight line-clamp-2 h-14" title={course.title}>
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-text-muted mb-6 leading-relaxed line-clamp-2 h-8">{course.description}</p>
                                    <button 
                                        onClick={() => handleEnroll(course)} 
                                        className="primary-button flex items-center justify-center gap-2"
                                    >
                                        {isEnrolled ? (
                                            <><Play size={14} fill="currentColor" /> Continue Learning</>
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
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <h2 className="text-2xl font-bold">All Courses</h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search courses..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 glass rounded-2xl border border-white/5 focus:border-brand-500/50 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCourses.map((course) => {
                        const isEnrolled = enrollments.find(e => e.courseId === course.id);
                        return (
                            <motion.div 
                                key={course.id} 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="glass p-6 rounded-[2rem] border border-white/5 hover:border-brand-500/30 transition-all group"
                            >
                                <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-surface-800/50 flex items-center justify-center p-6 group-hover:p-4 transition-all duration-500">
                                    <img src={course.image} alt={course.title} className="w-full h-full object-contain" />
                                </div>
                                <h3 className="text-lg font-bold mb-2 line-clamp-2 h-14" title={course.title}>
                                    {course.title}
                                </h3>
                                <p className="text-sm text-text-muted mb-6 line-clamp-2 h-10">{course.description}</p>
                                <button 
                                    onClick={() => handleEnroll(course)} 
                                    className={`w-full py-3 rounded-2xl font-bold transition-all ${isEnrolled ? 'glass text-brand-400' : 'bg-brand-600 hover:bg-brand-500 text-white'}`}
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

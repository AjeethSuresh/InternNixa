import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { BookOpen, Video, Target, Code, ArrowRight, User, ChevronDown } from 'lucide-react';

const slides = [
  {
    id: 'intro',
    title: 'Discover Internixa',
    subtitle: 'The Future of Learning & Collaboration',
    description: 'A masterpiece platform integrating premium learning management with state-of-the-art secure video conferencing.',
    icon: <Target size={80} color="#60a5fa" />,
    gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    accent: '#3b82f6'
  },
  {
    id: 'how-to-use',
    title: 'Master Your Skills',
    subtitle: 'Learn. Track. Achieve.',
    description: 'Explore the catalog to enroll in bleeding-edge courses. Track your progress via a dynamic dashboard and earn verified Certificates upon completion.',
    icon: <BookOpen size={80} color="#34d399" />,
    gradient: 'linear-gradient(135deg, #064e3b, #10b981)',
    accent: '#10b981'
  },
  {
    id: 'meetings',
    title: 'Spatial AI Meetings',
    subtitle: 'Connect with Intelligence',
    description: 'Host and join secure WebRTC video meetings. Experience real-time media streams augmented with continuous AI engagement tracking and attention scoring.',
    icon: <Video size={80} color="#c084fc" />,
    gradient: 'linear-gradient(135deg, #4c1d95, #a855f7)',
    accent: '#a855f7'
  },
  {
    id: 'developer',
    title: 'The Architect',
    subtitle: 'Crafted with Precision',
    description: 'This entire platform was solely designed, developed, and engineered natively from ground up by Ajeeth Suresh. A pure showcase of modern full-stack systems design.',
    icon: <Code size={80} color="#fb7185" />,
    gradient: 'linear-gradient(135deg, #881337, #f43f5e)',
    accent: '#f43f5e'
  }
];

const Welcome = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // Custom scroll tracking background
  const [activeSegment, setActiveSegment] = useState(0);

  const handleScroll = (e) => {
    const sectionHeight = window.innerHeight;
    const scrollY = e.target.scrollTop;
    const index = Math.round(scrollY / sectionHeight);
    if (index !== activeSegment) {
      setActiveSegment(index);
    }
  };

  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // Fallback active section incase scroll jumps
  const activeSlide = slides[activeSegment] || slides[0];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#020617', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Dynamic Background Glow */}
      <motion.div 
        animate={{ background: activeSlide.gradient }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', opacity: 0.15, filter: 'blur(100px)', zIndex: 0 }} 
      />

      {/* Main Snap Scrolling Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100vh',
          width: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          position: 'relative',
          zIndex: 10,
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE
        }}
        className="no-scrollbar"
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

        {slides.map((slide, index) => (
          <section key={slide.id} style={{ height: '100vh', width: '100%', scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // smooth spring
              viewport={{ root: containerRef, margin: "-100px", amount: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '900px',
                width: '100%'
              }}
            >
              {/* Floating Icon Container */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '2rem', marginBottom: '3rem', boxShadow: `0 20px 50px ${slide.accent}20`, backdropFilter: 'blur(20px)' }}
              >
                {slide.icon}
              </motion.div>

              {/* Text Elements */}
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: slide.accent }}>
                {slide.subtitle}
              </h3>
              
              <h1 style={{ margin: '0 0 2rem', fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, color: '#fff', letterSpacing: '-0.04em' }}>
                {slide.title}
              </h1>
              
              <p style={{ margin: 0, fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: '800px' }}>
                {slide.description}
              </p>

              {index === slides.length - 1 && (
                <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem 3rem', borderRadius: '1.5rem', border: `1px solid ${slide.accent}40` }}>
                     <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: slide.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <User size={30} color="#fff" />
                     </div>
                     <div style={{ textAlign: 'left' }}>
                       <p style={{ margin: 0, fontSize: '0.8rem', color: slide.accent, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Lead Architect</p>
                       <p style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem', color: '#fff' }}>Ajeeth Suresh</p>
                     </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${slide.accent}60` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    style={{ padding: '1.25rem 4rem', background: '#fff', color: '#000', border: 'none', borderRadius: '3rem', fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.3s' }}
                  >
                    Get Started <ArrowRight size={24} />
                  </motion.button>
                </div>
              )}

            </motion.div>
          </section>
        ))}
      </div>

      {/* Floating Swipe Down Indicator */}
      <AnimatePresence>
        {activeSegment < slides.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none', zIndex: 20 }}
          >
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Scroll Down</p>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <ChevronDown size={24} color="rgba(255,255,255,0.5)" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Nav Skip button */}
      <div style={{ position: 'absolute', top: '2rem', right: '3rem', zIndex: 30 }}>
         <button 
          onClick={() => navigate('/login')}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem', padding: '0.75rem 1.5rem', borderRadius: '2rem', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)' }}
        >
          Skip
        </button>
      </div>

      {/* Scroll Progress Dots */}
      <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 20 }}>
        {slides.map((slide, idx) => (
          <div key={idx} style={{ width: '8px', height: activeSegment === idx ? '32px' : '8px', borderRadius: '4px', background: activeSegment === idx ? slide.accent : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease' }} />
        ))}
      </div>

    </div>
  );
};

export default Welcome;

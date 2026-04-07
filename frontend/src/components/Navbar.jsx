import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Compass, GraduationCap, Award, Video } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Explore', path: '/explore-courses', icon: Compass },
        { name: 'My Learning', path: '/my-learning', icon: GraduationCap },
        { name: 'Meet', path: '/meet', icon: Video },
        { name: 'Certificates', path: '/certificates', icon: Award },
    ];

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[min(90%,500px)]">
            <div className="glass px-4 py-2 rounded-full flex items-center justify-between gap-1 border border-white/10 shadow-2xl shadow-brand-900/20">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative px-4 py-2 rounded-full transition-all duration-300 group"
                        >
                            <div className={`flex items-center gap-2 relative z-10 ${isActive ? 'text-white' : 'text-text-muted hover:text-white'}`}>
                                <Icon size={18} className={isActive ? 'text-brand-400' : ''} />
                                <span className={`text-sm font-semibold ${isActive ? 'block' : 'hidden md:block'}`}>{item.name}</span>
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="navbar-active"
                                    className="absolute inset-0 bg-white/5 rounded-full border border-white/10"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default Navbar;

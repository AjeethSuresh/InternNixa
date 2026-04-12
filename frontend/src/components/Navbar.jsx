import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Compass, GraduationCap, Award, Video, LogOut } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Explore', path: '/explore-courses', icon: Compass },
        { name: 'My Learning', path: '/my-learning', icon: GraduationCap },
        { name: 'Meet', path: '/meet', icon: Video },
        { name: 'Certificates', path: '/certificates', icon: Award },
    ];

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[min(95%,700px)]">
            <div className="glass px-2 py-2 rounded-full flex items-center justify-between gap-1 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative px-4 py-2.5 rounded-full transition-all duration-500 group flex-1"
                        >
                            <div className={`flex items-center justify-center gap-2 relative z-10 ${isActive ? 'text-white' : 'text-text-muted hover:text-white'}`}>
                                <Icon size={18} className={`${isActive ? 'text-brand-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'group-hover:scale-110 transition-transform'}`} />
                                <span className={`text-[13px] font-bold tracking-tight whitespace-nowrap ${isActive ? 'block' : 'hidden lg:block'}`}>
                                    {item.name}
                                </span>
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="navbar-active"
                                    className="absolute inset-0 bg-white/10 rounded-full border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}

                <div className="w-[1px] h-6 bg-white/10 mx-1" />

                <button
                    onClick={handleLogout}
                    className="relative px-4 py-2.5 rounded-full transition-all duration-300 group hover:bg-red-500/10 text-text-muted hover:text-red-400 flex items-center justify-center"
                    title="Logout"
                >
                    <LogOut size={18} />
                    <span className="hidden lg:block ml-2 text-[13px] font-bold">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;

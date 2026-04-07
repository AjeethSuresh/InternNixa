import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Share2, Medal } from 'lucide-react';
import { ChatBot } from '../components/ChatBot';

const Certificates = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/session/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    // Filter only those with certificates
                    setHistory(data.filter(h => h.certificateUrl));
                }
            } catch (err) {
                console.error('Failed to fetch certificates');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleDownload = (certificateUrl) => {
        const token = localStorage.getItem('token');
        fetch(`${import.meta.env.VITE_API_URL}${certificateUrl}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Internixa_Certificate_${new Date().getTime()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            });
    };

    if (loading) return (
        <div className="pt-32 px-12 text-center text-text-muted">
            <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
            Loading your achievements...
        </div>
    );

    return (
        <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-20">
            <header className="mb-12">
                <h1 className="text-4xl font-black mb-2 tracking-tight">My Certificates</h1>
                <p className="text-text-muted">Your hard-earned accomplishments</p>
            </header>

            {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {history.map((cert, i) => (
                        <motion.div 
                            key={cert._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-8 rounded-[2.5rem] border border-white/5 relative group overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Medal size={120} className="text-brand-400 rotate-12" />
                            </div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mb-6 border border-brand-500/20">
                                    <Award className="text-brand-400" size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2 tracking-tight">{cert.courseTitle || 'Course Certificate'}</h3>
                                <div className="flex items-center gap-4 text-xs font-bold text-text-muted mb-8 tracking-widest uppercase">
                                    <span>🏆 {cert.engagementScore || cert.score}% Score</span>
                                    <span>🗓️ {new Date(cert.timestamp || cert.completedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => handleDownload(cert.certificateUrl)}
                                        className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-900/20"
                                    >
                                        <Download size={18} /> Download
                                    </button>
                                    <button className="p-3 glass hover:bg-white/5 rounded-2xl border border-white/10 text-white/70 transition-all">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center glass rounded-[3rem] border border-white/5 relative overflow-hidden">
                    <div className="text-6xl mb-8">🎖️</div>
                    <h2 className="text-3xl font-black mb-4">No Certificates Yet</h2>
                    <p className="text-text-muted max-w-sm mx-auto leading-relaxed mb-10">
                        Complete your courses and pass the final evaluation to earn your industry-standard credentials.
                    </p>
                    <button 
                         onClick={() => window.location.href = '/my-learning'}
                         className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold border border-white/10 transition-all active:scale-95"
                    >
                        🚀 Keep Learning
                    </button>
                </div>
            )}
            <ChatBot />
        </div>
    );
};

export default Certificates;

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
            .then(res => {
                if (!res.ok) {
                    console.error('Download failed with status:', res.status);
                    throw new Error('PDF not ready or unauthorized');
                }
                const contentType = res.headers.get('content-type');
                if (contentType && !contentType.includes('application/pdf')) {
                    throw new Error('Server returned non-PDF content');
                }
                return res.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Internixa_Certificate_${new Date().getTime()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                console.error('Cert download error:', err);
                alert('The certificate is still being processed or is currently unavailable. Please refresh and try again in a few seconds.');
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
            <header className="mb-16 relative">
                 <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                <h1 className="text-5xl font-black mb-4 tracking-tight">Achievements</h1>
                <p className="text-lg text-text-muted font-medium">Your credentials for the digital age</p>
            </header>

            {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {history.map((cert, i) => (
                        <motion.div 
                            key={cert._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass p-10 rounded-[3rem] border border-white/5 relative group overflow-hidden hover:border-amber-500/30 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                                <Medal size={200} className="text-amber-400 rotate-12" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-400/20 to-amber-600/5 rounded-[1.5rem] flex items-center justify-center mb-8 border border-amber-500/20 shadow-inner">
                                    <Award className="text-amber-400" size={40} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight group-hover:text-amber-400 transition-colors">{cert.courseTitle || 'Course Certificate'}</h3>
                                <div className="flex flex-wrap gap-4 text-[10px] font-black text-text-muted mb-10 tracking-[0.2em] uppercase">
                                    <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10">🏆 {cert.engagementScore || cert.score}% Score</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10">🗓️ {new Date(cert.timestamp || cert.completedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex gap-4 mt-auto">
                                    <button 
                                        onClick={() => handleDownload(cert.certificateUrl)}
                                        className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(217,119,6,0.2)] active:scale-95 text-xs uppercase tracking-widest"
                                    >
                                        <Download size={18} /> Download
                                    </button>
                                    <button className="p-4 glass hover:bg-white/10 rounded-[1.5rem] border border-white/10 text-white/70 transition-all active:scale-90">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="py-32 text-center glass rounded-[4rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-brand-500/5 pointer-events-none" />
                    <div className="text-7xl mb-10 group-hover:scale-125 transition-transform duration-700">🎖️</div>
                    <h2 className="text-4xl font-black mb-6 tracking-tight">No Credentials Yet</h2>
                    <p className="text-lg text-text-muted max-w-sm mx-auto leading-relaxed mb-12 font-medium">
                        Complete your courses and pass final assessments to unlock your industry-standard certifications.
                    </p>
                    <button 
                         onClick={() => window.location.href = '/my-learning'}
                         className="px-12 py-5 bg-gradient-to-r from-brand-600 to-brand-400 hover:from-brand-500 hover:to-brand-300 text-white rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl shadow-brand-900/20"
                    >
                        🚀 Continue Path
                    </button>
                </div>
            )}
            <ChatBot />
        </div>
    );
};

export default Certificates;

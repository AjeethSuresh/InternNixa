import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, ArrowLeft, Loader2, Sparkles, Zap } from 'lucide-react';
import { fetchWithAuth } from '../lib/api';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/session/leaderboard`);
        const data = await response.json();
        if (response.ok) setLeaders(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />;
      case 1: return <Medal className="w-7 h-7 text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.3)]" />;
      default: return <span className="text-xl font-black text-white/20">#{index + 1}</span>;
    }
  };

  return (
    <div className="pt-32 px-6 md:px-12 max-w-4xl mx-auto w-full pb-20">
      <header className="flex items-center justify-between mb-12">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
        >
          <ArrowLeft className="w-6 h-6 text-white transition-transform group-hover:-translate-x-1" />
        </button>
        <div className="text-center flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">Global Hall of Fame</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase">
            Focus <span className="text-brand-400 not-italic">Challenge</span>
          </h1>
        </div>
        <div className="w-12 h-12" /> {/* Spacer */}
      </header>

      <section className="relative glass rounded-[3rem] border border-white/5 overflow-hidden p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
            <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">Retrieving top scholars...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-12 px-6 mb-6">
              <div className="col-span-2 text-[10px] font-black text-white/30 uppercase tracking-widest">Rank</div>
              <div className="col-span-7 text-[10px] font-black text-white/30 uppercase tracking-widest text-left">Student</div>
              <div className="col-span-3 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Points</div>
            </div>

            {leaders.map((leader, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`grid grid-cols-12 items-center p-6 rounded-[2rem] border transition-all duration-300 group hover:scale-[1.02] ${
                  i === 0 
                  ? 'bg-gradient-to-r from-brand-600/20 to-transparent border-brand-500/30' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="col-span-2">
                  {getRankIcon(i)}
                </div>
                <div className="col-span-7 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                    i === 0 ? 'bg-brand-500 text-white shadow-lg' : 'bg-white/5 text-white/50'
                  }`}>
                    {leader.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg group-hover:text-brand-400 transition-colors">
                      {leader.name}
                    </h3>
                    {i === 0 && <span className="text-[9px] font-black text-brand-300 uppercase tracking-widest flex items-center gap-1"><Zap className="w-3 h-3" /> Ultimate Prodigy</span>}
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <div className="text-2xl font-black text-white group-hover:scale-110 transition-transform origin-right">
                    {leader.totalFocusPoints || 0}
                  </div>
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">FP</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-12 text-center">
        <p className="text-text-muted text-sm leading-relaxed max-w-lg mx-auto">
          Points are earned by maintaining 100% focus during sessions. Every 30 seconds of active focus earns you 1 FP.
        </p>
      </footer>
    </div>
  );
};

export default Leaderboard;

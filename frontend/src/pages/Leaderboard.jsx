import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, ArrowLeft, Loader2, Sparkles, Zap, X, GraduationCap, Mail, Copy, Check } from 'lucide-react';
import { fetchWithAuth } from '../lib/api';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

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

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchStudentProfile = async (email) => {
    setIsProfileLoading(true);
    const url = `${import.meta.env.VITE_API_URL}/api/session/student-profile/${email}`;
    console.log(`[HIRING] Fetching profile from: ${url}`);
    try {
      const response = await fetchWithAuth(url);
      const data = await response.json();
      console.log(`[HIRING] Profile received:`, data);
      if (response.ok) setSelectedStudent(data);
    } catch (err) {
      console.error('Failed to fetch student profile', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  return (
    <div className="pt-32 px-6 md:px-12 max-w-4xl mx-auto w-full pb-20">
      {/* Candidate Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl bg-gray-900 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-500/20 to-transparent" />
            
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-8 right-8 text-white/40 hover:text-white z-20"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* Left Column: Profile Bio & Primary Stats */}
              <div className="md:col-span-5 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-brand-500 flex items-center justify-center text-4xl font-black text-white shadow-2xl mb-6 relative group">
                  {selectedStudent.name.charAt(0)}
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping group-hover:animate-none opacity-20" />
                </div>
                <h2 className="text-3xl font-black text-white mb-1 tracking-tighter italic uppercase">{selectedStudent.name}</h2>
                
                <div className="flex items-center gap-2 mb-8 group/mail">
                  <p className="text-brand-400 font-bold uppercase tracking-[0.3em] text-[10px]">{selectedStudent.email}</p>
                  <button 
                    onClick={() => handleCopyEmail(selectedStudent.email)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all active:scale-90"
                    title="Copy Email"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/40 group-hover/mail:text-white" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                  <div className="bg-white/5 border border-white/5 p-5 rounded-3xl flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-3xl font-black text-white mb-1 relative z-10">{selectedStudent.totalFocusPoints}</div>
                    <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest leading-none relative z-10 text-brand-400/60">Focus Stamina</div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-5 rounded-3xl flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="text-3xl font-black text-emerald-400 mb-1 relative z-10">{selectedStudent.completedCourses.length}</div>
                    <div className="text-[9px] text-text-muted font-bold uppercase tracking-widest leading-none relative z-10 text-emerald-400/60">Skills Mastered</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Expertise Summary & Portfolio */}
              <div className="md:col-span-1 border-l border-white/5 hidden md:block" />

              <div className="md:col-span-6 space-y-8">
                <div>
                  <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-400 mb-3 flex items-center gap-2 italic">
                     Technical Expertise Narration
                  </h5>
                  <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 group-hover:w-full transition-all duration-700 opacity-10" />
                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                      This candidate has demonstrated exceptional technical discipline, successfully mastering <span className="text-white font-bold">{selectedStudent.completedCourses.length} official specialized domains</span>. 
                      With an elite persistence score, they exhibit the stamina required for high-impact professional environments.
                    </p>
                  </div>
                </div>

                <div className="w-full text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Mastery Portfolio
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-8 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedStudent.completedCourses.length > 0 ? selectedStudent.completedCourses.map((c, idx) => (
                      <span key={idx} className="px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-[10px] font-bold text-brand-300">
                        {c}
                      </span>
                    )) : (
                      <span className="text-text-muted text-xs italic">No courses mastered yet.</span>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      const subject = encodeURIComponent(`Hiring Inquiry: InternNixa Elite Talent Evaluation`);
                      const body = encodeURIComponent(`Hello ${selectedStudent.name},\n\nI am ${user.name}, reaching out via the InternNixa Hiring Portal. I have evaluated your performance profile (Focus Score: ${selectedStudent.totalFocusPoints}, Unique Mastered Domains: ${selectedStudent.completedCourses.length}).\n\nWe are impressed with your discipline and would like to discuss potential opportunities.\n\nBest Regards,\nInternNixa Recruiter Portal`);
                      window.location.href = `mailto:${selectedStudent.email}?subject=${subject}&body=${body}`;
                    }}
                    className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Mail className="w-4 h-4" /> Send Hiring Inquiry
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
                <div className="col-span-5 flex items-center gap-4">
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
                <div className="col-span-5 text-right flex items-center justify-end gap-6">
                  <div className="hidden sm:block">
                    <div className="text-2xl font-black text-brand-400 leading-none">
                      {leader.totalFocusPoints || 0}
                    </div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Focus Points</div>
                  </div>
                  {user?.role === 'recruiter' && (
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        disabled={!user?.isVerified || isProfileLoading}
                        onClick={() => {
                          if (!user?.isVerified) return;
                          fetchStudentProfile(leader.email);
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all ${
                          user?.isVerified 
                          ? 'bg-brand-500 hover:bg-brand-600' 
                          : 'bg-white/10 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {isProfileLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : (user?.isVerified ? '💼 Hire candidate' : '🔒 Verification Required')}
                      </button>
                      {!user?.isVerified && (
                        <div className="text-[9px] text-amber-500 font-bold uppercase tracking-tight">
                          Identity check pending...
                        </div>
                      )}
                      {user?.isVerified && (
                        <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-tight flex items-center gap-1">
                           Verified Employer
                        </div>
                      )}
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white italic">
                    #{i + 1}
                  </div>
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

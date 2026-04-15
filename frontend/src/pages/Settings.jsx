import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, ShieldCheck, CheckCircle, Save } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({ name: 'Ajeeth Suresh', email: '', phone: '+91 9876543210' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.email) setUser(p => ({ ...p, email: currentUser.email }));
    if (currentUser.name) setUser(p => ({ ...p, name: currentUser.name }));
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Future API Save
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwords.new === passwords.confirm && passwords.new.length >= 6) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPasswords({ current: '', new: '', confirm: '' });
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-6 relative lg:px-16 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 z-10">
      {/* Sidebar Navigation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/4 shrink-0 dashboard-card p-6 flex flex-col gap-2 rounded-3xl"
        style={{ border: '1px solid var(--glass-border)', background: 'var(--card-bg)' }}
      >
        <h2 className="text-xl font-bold mb-6 text-white px-2">Settings</h2>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <User size={18} />
          <span className="font-semibold text-[14px]">Personal Info</span>
        </button>

        <button 
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'security' ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border border-[#8b5cf6]/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
        >
          <ShieldCheck size={18} />
          <span className="font-semibold text-[14px]">Security & Password</span>
        </button>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 dashboard-card p-8 lg:p-12 rounded-3xl relative overflow-hidden"
        style={{ border: '1px solid var(--glass-border)', background: 'var(--card-bg)' }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c3aed]/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full overflow-hidden">
            <h3 className="text-2xl font-bold text-white mb-2">Personal Information</h3>
            <p className="text-slate-400 text-sm mb-8">Update your personal details here.</p>
            
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    required
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#a78bfa] focus:bg-[#7c3aed]/5 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      required
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#a78bfa] focus:bg-[#7c3aed]/5 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      required
                      type="tel"
                      value={user.phone}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#a78bfa] focus:bg-[#7c3aed]/5 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="flex items-center gap-2 primary-button w-full md:w-auto !px-8 !py-3 !rounded-xl justify-center">
                  {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full overflow-hidden">
            <h3 className="text-2xl font-bold text-white mb-2">Password & Security</h3>
            <p className="text-slate-400 text-sm mb-8">Ensure your account is using a long, random password to stay secure.</p>
            
            <form onSubmit={handleSavePassword} className="max-w-md space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    required
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#a78bfa] focus:bg-[#7c3aed]/5 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    required
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#a78bfa] focus:bg-[#7c3aed]/5 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirm New Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    required
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-[#a78bfa] focus:bg-[#7c3aed]/5 transition-all text-sm font-medium"
                    placeholder="••••••••"
                  />
                </div>
                {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                  <p className="text-red-400 text-xs ml-1 mt-1 font-medium">Passwords do not match</p>
                )}
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={passwords.new && passwords.new !== passwords.confirm}
                  className={`flex items-center justify-center gap-2 primary-button w-full md:w-auto !px-8 !py-3 !rounded-xl ${passwords.new && passwords.new !== passwords.confirm ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saved ? <CheckCircle size={18} /> : <Save size={18} />}
                  {saved ? 'Updated!' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Settings;

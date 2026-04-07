import React from "react";
import { Send, Bot, User, Loader2, Database, Info, Sparkles, LayoutDashboard, Settings, History, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  grounded?: boolean;
}

interface InternixaUIProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  isConfigured: boolean;
  handleSend: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const InternixaUI: React.FC<InternixaUIProps> = ({
  messages,
  input,
  setInput,
  isLoading,
  isConfigured,
  handleSend,
  messagesEndRef,
}) => {
  return (
    <div className="flex h-screen bg-surface-900 text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 glass border-r border-white/5 hidden lg:flex flex-col p-6 z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="gradient-brand p-2.5 rounded-xl shadow-brand-500/20 shadow-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white italic">Internixa<span className="text-brand-400 not-italic">GPT</span></h1>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active />
          <SidebarLink icon={<History className="w-4 h-4" />} label="Chat History" />
          <SidebarLink icon={<Settings className="w-4 h-4" />} label="Settings" />
        </nav>

        <div className="mt-auto space-y-4">
          <div className="glass-card p-4 rounded-2xl border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">System Status</span>
            </div>
            <div className="space-y-3">
              <StatusItem label="Gemini AI" status={isConfigured ? "Online" : "Missing Key"} active={isConfigured} />
              <StatusItem label="Vector DB" status={isConfigured ? "Connected" : "Disconnected"} active={isConfigured} />
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full gradient-brand border-2 border-white/10 shadow-lg flex items-center justify-center font-bold text-white">
              AD
            </div>
            <div>
              <p className="text-sm font-bold text-white">Ajeet Dev</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Premium Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.1),transparent)] pointer-events-none" />
        
        {/* Mobile Header */}
        <header className="lg:hidden glass border-b border-white/5 px-6 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <span className="font-bold text-lg italic text-white">InternixaGPT</span>
          </div>
          {!isConfigured && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-500 text-[10px] font-bold uppercase tracking-widest">
              Config Req
            </div>
          )}
        </header>

        {/* Scrollable Messages */}
        <section className="flex-1 overflow-y-auto px-4 py-8 md:px-12 space-y-8 scroll-smooth z-10">
          <div className="max-w-4xl mx-auto space-y-10">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "flex gap-6 items-start group",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                    message.role === "user" ? "gradient-brand text-white shadow-brand-500/30 shadow-lg" : "glass border-white/10 text-brand-400"
                  )}>
                    {message.role === "user" ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  
                  <div className={cn(
                    "flex flex-col gap-2 min-w-0",
                    message.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-6 py-4 rounded-3xl text-[15px] shadow-sm relative",
                      message.role === "user" 
                        ? "bg-brand-600 text-white rounded-tr-none" 
                        : "glass-card text-slate-200 rounded-tl-none border-white/5"
                    )}>
                      <div className="prose prose-invert prose-sm max-w-none prose-brand selection:bg-white/20">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {message.sources.map((source, i) => (
                          <span key={i} className="text-[10px] font-bold bg-white/5 text-slate-500 px-2.5 py-1 rounded-lg border border-white/5 uppercase tracking-widest hover:bg-white/10 transition-colors cursor-default">
                            {source}
                          </span>
                        ))}
                        {message.grounded && (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Grounded
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-2xl glass border-white/10 flex items-center justify-center text-brand-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="glass-card px-6 py-5 rounded-3xl rounded-tl-none flex gap-1.5 border-white/5">
                  <div className="w-2 h-2 bg-brand-500/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-brand-500/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-brand-500/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Input Bar */}
        <footer className="p-6 md:p-10 z-20">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-brand-400 rounded-3xl blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message InternixaGPT..."
                className="w-full glass-card border-white/10 rounded-2xl px-7 py-5 pr-16 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-[16px] placeholder-slate-600"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 gradient-brand hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-30 text-white p-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20"
              >
                <Send className="w-5 h-5 shadow-inner" />
              </button>
            </form>
          </div>
          <div className="max-w-4xl mx-auto mt-4 px-2 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex gap-4">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                 <Database className="w-3 h-3" /> Pinecone Search
               </p>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                 <Bot className="w-3 h-3" /> Gemini 3 Flash
               </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 italic">
              Powered by Internixa Intelligence
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

/* Helper Components */

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, label, active }) => (
  <button className={cn(
    "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
    active ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
  )}>
    <div className={cn("transition-transform group-hover:scale-110", active ? "text-brand-400" : "text-slate-500")}>
      {icon}
    </div>
    {label}
  </button>
);

interface StatusItemProps {
  label: string;
  status: string;
  active?: boolean;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, status, active }) => (
  <div className="flex justify-between items-center group">
    <span className="text-[11px] font-medium text-slate-400">{label}</span>
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1 h-1 rounded-full", active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-amber-500")} />
      <span className={cn("text-[10px] font-bold tracking-tight uppercase transition-colors", active ? "text-emerald-400" : "text-amber-500")}>{status}</span>
    </div>
  </div>
);

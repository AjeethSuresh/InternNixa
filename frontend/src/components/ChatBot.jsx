import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Database, Sparkles, MessageCircle, X, ChevronRight, Paperclip, Minimize2, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export const ChatBot = ({ courseId, moduleId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm **InternixaGPT**, your intelligent learning companion. How can I assist you with your studies today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? "http://localhost:5001" : "https://internnixa-1.onrender.com");
      
      const embedRes = await fetch(`${baseUrl}/api/chatbot/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMessage }),
      });
      if (!embedRes.ok) throw new Error("Failed to get embeddings");
      const { embedding } = await embedRes.json();

      const searchRes = await fetch(`${baseUrl}/api/chatbot/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vector: embedding, topK: 3 }),
      });
      if (!searchRes.ok) throw new Error("Failed to search database");
      const searchResults = await searchRes.json();
      
      const context = searchResults.matches
        ?.map((m) => `[Source: ${m.metadata?.source || "Unknown"}] ${m.metadata?.text || ""}`)
        .join("\n\n") || "No relevant context found.";

      const sources = searchResults.matches?.map((m) => m.metadata?.source).filter(Boolean) || [];

      const chatRes = await fetch(`${baseUrl}/api/chatbot/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: userMessage,
          context,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          courseId,
          moduleId
        }),
      });
      if (!chatRes.ok) throw new Error("Failed to get AI response");
      const { text } = await chatRes.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: text,
          sources: sources.length > 0 ? Array.from(new Set(sources)) : undefined,
          grounded: context !== "No relevant context found.",
        },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Error:** ${error.message}. Please check your connection.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Top Right Toggle Button */}
      <div className="fixed top-6 right-8 z-[210]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 relative group",
            isOpen ? "bg-white/10 text-white border border-white/20" : "bg-brand-600 text-white"
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a1a] animate-pulse" />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[min(450px,95vw)] bg-[#0c0d12] border-l border-white/10 shadow-[-20px_0_80px_rgba(0,0,0,0.8)] flex flex-col z-[200] overflow-hidden"
          >
            {/* Background Glows */}
            <div className="absolute top-[10%] left-[-20%] w-[80%] h-[40%] bg-brand-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-20%] w-[80%] h-[40%] bg-accent/5 blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="p-8 pt-10 flex flex-col gap-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-accent rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic">Internixa<span className="text-brand-400 not-italic">GPT</span></h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75" />
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-150" />
                      </div>
                      <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.3em]">Synapse Active</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/5 group"
                >
                  <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-brand-500/30 transition-all">
                  <Database className="w-4 h-4 text-brand-400 opacity-50" />
                  <span className="text-[8px] font-bold text-white/30 tracking-[0.2em] uppercase">Context Ready</span>
                </div>
                <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 group hover:border-accent/30 transition-all">
                  <Bot className="w-4 h-4 text-accent opacity-50" />
                  <span className="text-[8px] font-bold text-white/30 tracking-[0.2em] uppercase">LLM Online</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 relative z-10 custom-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 shadow-2xl relative",
                    msg.role === "user" ? "bg-white/10 border border-white/10" : "bg-gradient-to-br from-brand-500 to-brand-700"
                  )}>
                    {msg.role === "user" ? <User className="w-5 h-5 text-white/70" /> : <Bot className="w-5 h-5 text-white" />}
                    {msg.role === "assistant" && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-400 rounded-full blur-[2px] animate-pulse" />
                    )}
                  </div>
                  <div className={cn("flex flex-col gap-3 max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-6 py-4 rounded-[1.5rem] text-[15px] leading-relaxed relative font-medium",
                      msg.role === "user" 
                        ? "bg-brand-600 text-white rounded-tr-none shadow-brand-500/20" 
                        : "bg-white/[0.04] text-slate-100 border border-white/5 rounded-tl-none shadow-2xl"
                    )}>
                      <div className="chatbot-prose prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    {msg.sources && (
                      <div className="flex flex-wrap gap-2 px-1">
                        {msg.sources.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-brand-500/10 text-brand-300 px-3 py-1.5 rounded-lg border border-brand-500/20 text-[9px] font-black uppercase tracking-widest">
                            <Database className="w-3 h-3" />
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center animate-pulse shadow-2xl">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/5 px-6 py-5 rounded-[1.5rem] rounded-tl-none flex gap-2 items-center">
                    <div className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 bg-white/[0.03] border-t border-white/5 relative z-10 backdrop-blur-xl">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query Internixa GPT..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-6 py-5 pr-20 focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all text-[15px] text-slate-100 placeholder:text-white/10 shadow-2xl"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-600 hover:bg-brand-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl text-white flex items-center justify-center transition-all shadow-2xl hover:shadow-brand-500/20 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-6 flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Internixa intelligence v2.0</span>
                <div className="flex items-center gap-1.5 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                   <div className="w-2 h-2 rounded-full bg-brand-500" />
                   <div className="w-2 h-2 rounded-full bg-accent" />
                   <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </>
  );
};


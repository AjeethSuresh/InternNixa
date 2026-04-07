import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Database, Sparkles, MessageCircle, X, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export const ChatBot = ({ courseId, moduleId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm InternixaGPT, your premium RAG-powered assistant. How can I help you today?",
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
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      
      // 1. Get Embedding
      const embedRes = await fetch(`${baseUrl}/api/chatbot/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMessage }),
      });
      if (!embedRes.ok) throw new Error("Failed to get embeddings");
      const { embedding } = await embedRes.json();

      // 2. Search Pinecone
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

      // 3. Chat with Groq
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
          content: `Error: ${error.message}. Please make sure API keys are configured in the backend.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[400px] h-[600px] glass border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="gradient-brand p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight italic">Internixa<span className="not-italic">GPT</span></h3>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">AI Learning Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-surface-900/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user" ? "gradient-brand text-white" : "bg-white/5 text-brand-400 border border-white/10"
                  }`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`flex flex-col gap-1.5 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm ${
                      msg.role === "user" 
                        ? "bg-brand-600 text-white rounded-tr-none" 
                        : "bg-white/5 text-slate-200 border border-white/5 rounded-tl-none"
                    }`}>
                      <div className="chatbot-prose">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    {msg.sources && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.sources.map((s, idx) => (
                          <span key={idx} className="text-[9px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-brand-400/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-brand-400/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-brand-400/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-surface-900 border-t border-white/5">
              <div className="relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm text-slate-200 placeholder:text-slate-600"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 gradient-brand p-2 rounded-lg text-white disabled:opacity-30 disabled:grayscale transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex justify-between items-center opacity-30">
                <div className="flex gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Database className="w-2 h-2" /> Pinecone
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Bot className="w-2 h-2" /> Gemini
                  </span>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-500 italic">Internixa Intelligence</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-white/10 text-white border border-white/20 rotate-90" : "gradient-brand text-white shadow-brand-500/40"
        }`}
      >
        {isOpen ? <ChevronDown className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-surface-900 animate-pulse"
          />
        )}
      </motion.button>
    </div>
  );
};

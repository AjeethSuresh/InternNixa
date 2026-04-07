import React, { useState, useRef, useEffect } from "react";
import { getEmbedding, generateRAGResponse } from "./lib/api";
import { InternixaUI } from "./components/InternixaUI";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  grounded?: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm InternixaGPT, your premium RAG-powered assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // 1. Get Embedding
      const vector = await getEmbedding(userMessage);

      // 2. Search Pinecone via Backend
      const searchResponse = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vector, topK: 3 }),
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        if (errorData.error?.includes("PINECONE_API_KEY") || errorData.error?.includes("GROQ_API_KEY")) {
          setIsConfigured(false);
          throw new Error("Configuration required. Please set Pinecone and Groq keys.");
        }
        throw new Error(errorData.error || "Failed to search vector database");
      }

      const searchResults = await searchResponse.json();
      const context = searchResults.matches
        ?.map((m: any) => `[Source: ${m.metadata?.source || "Unknown"}] ${m.metadata?.text || ""}`)
        .join("\n\n") || "No relevant context found.";

      const sources = searchResults.matches?.map((m: any) => m.metadata?.source).filter(Boolean) || [];

      // 3. Generate Response
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const responseText = await generateRAGResponse(userMessage, context, history);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseText || "Something went wrong.",
          sources: sources.length > 0 ? Array.from(new Set(sources)) : undefined,
          grounded: context !== "No relevant context found.",
        },
      ]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InternixaUI
      messages={messages}
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      isConfigured={isConfigured}
      handleSend={handleSend}
      messagesEndRef={messagesEndRef}
    />
  );
}

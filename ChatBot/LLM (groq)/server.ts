import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // Initialize Pinecone lazily
  let pineconeClient: Pinecone | null = null;
  function getPinecone() {
    if (!pineconeClient) {
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) {
        throw new Error("PINECONE_API_KEY is not set");
      }
      pineconeClient = new Pinecone({ apiKey });
    }
    return pineconeClient;
  }

  // Initialize Gemini lazily
  let genAI: GoogleGenAI | null = null;
  function getGenAI() {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set");
      }
      genAI = new GoogleGenAI({ apiKey });
    }
    return genAI;
  }

  // API Routes
  app.post("/api/search", async (req, res) => {
    try {
      const { vector, topK = 5 } = req.body;
      const indexName = process.env.PINECONE_INDEX_NAME;

      if (!indexName) {
        return res.status(500).json({ error: "PINECONE_INDEX_NAME is not set" });
      }

      const pc = getPinecone();
      const index = pc.index(indexName);

      const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
      });

      res.json(queryResponse);
    } catch (error: any) {
      console.error("Pinecone Search Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/embed", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const ai = getGenAI();
      const result = await ai.models.embedContent({
        model: "models/gemini-embedding-001",
        contents: [text],
      });

      res.json({ embedding: result.embeddings[0].values });
    } catch (error: any) {
      console.error("Gemini Embedding Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { query, context, history } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY is not set" });
      }

      const systemInstruction = `
        You are an intelligent RAG/CAG-powered chatbot assistant.
        Always base answers on retrieved context from Pinecone.
        CONTEXT FROM PINECONE: ${context || "No relevant context found."}
      `;

      const messages = [
        { role: "system", content: systemInstruction },
        ...(history || []).map((h: any) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content,
        })),
        { role: "user", content: query },
      ];

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      res.json({ text: result.choices[0].message.content });
    } catch (error: any) {
      console.error("Groq Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export async function getEmbedding(text: string) {
  const response = await fetch("/api/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch embedding");
  }

  const data = await response.json();
  return data.embedding;
}

export async function generateRAGResponse(query: string, context: string, history: { role: string; content: string }[]) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context, history }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch RAG response");
  }

  const data = await response.json();
  return data.text;
}

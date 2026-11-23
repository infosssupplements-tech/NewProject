import { streamText } from "ai";

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

const INSTRUCTIONS = `You are the Upolabdhi assistant (উপলব্ধি, "understanding" in Bengali).
Upolabdhi is a RAG-based (Retrieval-Augmented Generation) intelligent question answering system.
Users upload PDFs or documents; Upolabdhi extracts the text, splits it into overlapping chunks,
turns each chunk into vector embeddings, stores them in a vector index, then for every question
embeds the query, retrieves the most similar chunks and asks a language model to answer using
only those chunks, citing the source passages.

Help visitors understand RAG, how Upolabdhi works, how to use the Workspace (sign in, upload,
ask, review cited sources), privacy (documents are private by default) and study tips.
Be warm, clear and concise (under 140 words unless asked for detail). Use short paragraphs or
bullet points. You may reply in Bengali if the user writes in Bengali. If asked about a specific
uploaded document, explain that document-grounded answers are available inside the Workspace
after signing in. For human help, point to upolabdhi-kali@gmail.com.`;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const cleaned = messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return new Response("A user message is required.", { status: 400 });
  }

  const result = streamText({
    model: "anthropic/claude-haiku-5.5",
    instructions: INSTRUCTIONS,
    messages: cleaned,
  });

  return result.toTextStreamResponse();
}

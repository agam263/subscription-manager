import os
import glob
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from sentence_transformers import SentenceTransformer

# ── Environment Setup ─────────────────────────────────────────────────────────
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# Free Groq model - fast, capable, no credit card needed
MODEL_ID = "llama-3.1-8b-instant"
KB_DIR   = Path(__file__).parent / "knowledge_base"

# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# ────────────────────────────────────────────────────────────────────────────
# RAG Retriever
# ────────────────────────────────────────────────────────────────────────────
class RAGRetriever:
    def __init__(self, kb_dir: Path):
        self.docs       = []
        self.embeddings = None
        self.model      = None

        if not kb_dir.exists():
            print(f"[RAG] WARNING: Knowledge base directory not found: {kb_dir}")
            return

        txt_files = sorted(glob.glob(str(kb_dir / "*.txt")))
        if not txt_files:
            print("[RAG] WARNING: No .txt files found in knowledge_base/.")
            return

        for path in txt_files:
            with open(path, "r", encoding="utf-8") as f:
                text = f.read().strip()
            self.docs.append((Path(path).name, text))
        print(f"[RAG] Loaded {len(self.docs)} knowledge base documents.")

        print("[RAG] Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        texts = [text for _, text in self.docs]
        self.embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1e-9, norms)
        self.embeddings = self.embeddings / norms
        print("[RAG] Embeddings ready. Retriever is active.")

    def is_ready(self) -> bool:
        return self.model is not None and self.embeddings is not None and len(self.docs) > 0

    def retrieve(self, query: str, top_k: int = 2) -> str:
        if not self.is_ready():
            return ""
        q_vec = self.model.encode([query], convert_to_numpy=True, show_progress_bar=False)[0]
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm
        scores = self.embeddings @ q_vec
        top_indices = np.argsort(scores)[::-1][:top_k]
        context_parts = []
        for idx in top_indices:
            filename, text = self.docs[idx]
            score = scores[idx]
            if score > 0.15:
                context_parts.append(f"--- {filename} ---\n{text}")
        return "\n\n".join(context_parts)


# ────────────────────────────────────────────────────────────────────────────
# SubManager Bot - powered by Groq (free, fast, no credit card needed)
# ────────────────────────────────────────────────────────────────────────────
class SubManagerBot:
    SYSTEM_PROMPT_BASE = (
        "You are a helpful AI assistant for SubManager — a subscription management web app. "
        "Help users understand how to use the app: its features, pages, settings, and workflows. "
        "Be concise, practical, and give step-by-step instructions when asked how to do something. "
        "Use the provided documentation context to give accurate answers. "
        "If the context doesn't cover the question, answer based on general knowledge but be honest about it."
    )

    def __init__(self, retriever: RAGRetriever):
        self.retriever = retriever
        self.client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        ) if GROQ_API_KEY else None
        self.conversation_history = []

    def _build_messages(self, user_text: str) -> list:
        context = self.retriever.retrieve(user_text, top_k=2) if self.retriever.is_ready() else ""

        if context:
            system_content = f"{self.SYSTEM_PROMPT_BASE}\n\nRELEVANT DOCUMENTATION:\n{context}"
        else:
            system_content = self.SYSTEM_PROMPT_BASE

        messages = [{"role": "system", "content": system_content}]
        messages.extend(self.conversation_history[-6:])
        messages.append({"role": "user", "content": user_text})
        return messages

    def get_response(self, user_text: str) -> str:
        if not self.client:
            return "Configuration Error: GROQ_API_KEY is missing from your .env file. Get a free key at https://console.groq.com"

        messages = self._build_messages(user_text)

        response = self.client.chat.completions.create(
            model=MODEL_ID,
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )

        reply = response.choices[0].message.content.strip()

        self.conversation_history.append({"role": "user",      "content": user_text})
        self.conversation_history.append({"role": "assistant",  "content": reply})

        return reply


# ── Initialize ────────────────────────────────────────────────────────────────
print("[SubManager Bot] Starting up...")
retriever = RAGRetriever(KB_DIR)
bot = SubManagerBot(retriever)


# ── API Routes ────────────────────────────────────────────────────────────────
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400
    user_text = data.get('message', '').strip()
    if not user_text:
        return jsonify({"error": "No message provided"}), 400
    try:
        reply = bot.get_response(user_text)
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "rag_active": retriever.is_ready(),
        "kb_doc_count": len(retriever.docs),
        "groq_key_set": bool(GROQ_API_KEY),
        "model": MODEL_ID,
    })


@app.route('/api/chat/reset', methods=['POST'])
def reset_chat():
    bot.conversation_history.clear()
    return jsonify({"status": "conversation history cleared"})


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print(f"[SubManager Bot] Python RAG API running on port 5001")
    print(f"[SubManager Bot] RAG: {retriever.is_ready()} | Docs: {len(retriever.docs)} | Model: {MODEL_ID}")
    if not GROQ_API_KEY:
        print("[SubManager Bot] WARNING: GROQ_API_KEY not set! Get a free key at https://console.groq.com")
    app.run(port=5001, debug=True)

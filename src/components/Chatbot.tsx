import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your SubManager AI assistant. How can I help you track or manage your subscriptions today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Send only previous user/assistant context to the backend
      const historyToSend = newMessages.slice(1, -1).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: historyToSend
        })
      });

      if (!res.ok) {
        let errMsg = "Failed to connect to AI service.";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = `API Error: ${errData.error}`;
          else if (errData.message) errMsg = `API Error: ${errData.message}`;
        } catch (e) {
          // fallback if not json
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "No reply generated." }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${error.message || "Sorry, I encountered an error answering your request."}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: "assistant", content: "Hi! I'm your SubManager AI assistant. How can I help you track or manage your subscriptions today?" }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-[350px] sm:max-w-[400px] h-[550px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-zinc-950 border border-border/10 dark:border-zinc-800 animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold text-sm">SubManager AI</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="text-white/70 hover:text-white transition-colors text-xs bg-white/10 px-2 py-1 rounded">Clear</button>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background dark:bg-zinc-900/50 backdrop-blur-xl">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm flex gap-3 ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-sm shadow-md' : 'bg-muted dark:bg-zinc-800 text-foreground dark:text-zinc-100 rounded-tl-sm border border-border dark:border-zinc-700/50 shadow-sm'}`}>
                  {msg.role === 'assistant' && <Bot className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />}
                  <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm p-4 bg-muted dark:bg-zinc-800 border border-border dark:border-zinc-700/50 text-foreground dark:text-zinc-100">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-background dark:bg-zinc-950 border-t border-border dark:border-zinc-800 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about subscriptions..."
              className="flex-1 bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-700 text-foreground dark:text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-muted-foreground dark:placeholder:text-zinc-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-full bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

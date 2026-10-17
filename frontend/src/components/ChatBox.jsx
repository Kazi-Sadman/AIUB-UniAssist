import React, { useEffect, useRef, useState } from "react";
import { Send, FileText, Sparkles, User } from "lucide-react";
import ragApi from "../api/ragApi";
import EmptyState from "./EmptyState";
import { useToast } from "../context/ToastContext";

export default function ChatBox() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await ragApi.sendChatMessage(question);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.answer,
          sources: response.sources || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: err.message || "Something went wrong.", isError: true },
      ]);
      toast.error(err.message || "AIUB UniAssist AI could not answer that question.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex flex-col h-[calc(100vh-14rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Ask AIUB UniAssist AI anything"
            description="Admission requirements, tuition fees, attendance policy, scholarships, exam rules, faculty contacts, and more - answered from the official university documents."
          />
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 animate-fadeIn ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  message.role === "user"
                    ? "bg-sky/10 border-sky/30 text-sky"
                    : "bg-gold/10 border-gold/30 text-gold"
                }`}
              >
                {message.role === "user" ? <User size={15} /> : <Sparkles size={15} />}
              </div>

              <div className={`max-w-[75%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block text-left rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-sky/10 border border-sky/30 text-parchment"
                      : message.isError
                      ? "bg-crimson/10 border border-crimson/30 text-crimson"
                      : "bg-surface-raised border border-line text-parchment"
                  }`}
                >
                  {message.text}
                </div>

                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {message.sources.map((source, sIndex) => (
                      <span
                        key={sIndex}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-muted bg-surface border border-line rounded-full px-2.5 py-1"
                        title={source.chunk_id}
                      >
                        <FileText size={11} />
                        {source.document}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-gold/10 border-gold/30 text-gold">
              <Sparkles size={15} />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl px-4 py-3 bg-surface-raised border border-line">
              <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse [animation-delay:0.3s]" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-3 px-6 py-4 border-t border-line">
        <input
          className="input-field"
          placeholder="Ask about admissions, fees, policies, courses..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          maxLength={1000}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={sending || !input.trim()}>
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );
}

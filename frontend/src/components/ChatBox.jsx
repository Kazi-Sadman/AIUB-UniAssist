import React, { useEffect, useRef, useState } from "react";
import { Send, FileText, Sparkles, User, Copy, Trash2, RotateCcw } from "lucide-react";
import ragApi from "../api/ragApi";
import { useToast } from "../context/ToastContext";

// Quick-start questions shown before the first message.
const SUGGESTED_QUESTIONS = [
  "What are the admission requirements?",
  "How are tuition fees calculated?",
  "What is the attendance policy?",
  "What scholarships are available?",
  "What are the exam rules?",
];

const MAX_INPUT_HEIGHT_PX = 160;

export default function ChatBox() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messageListRef = useRef(null);
  const inputRef = useRef(null);
  const nextMessageId = useRef(1); // gives every message a stable id for React keys

  // Keep the newest message in view.
  useEffect(() => {
    // Nothing to scroll to yet. This also keeps the welcome screen scrolled to the top.
    if (messages.length === 0) return;
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  // Make the text box grow with the text, up to a maximum height.
  const resizeInputToFitText = () => {
    const inputElement = inputRef.current;
    if (!inputElement) return;
    inputElement.style.height = "auto";
    inputElement.style.height = `${Math.min(inputElement.scrollHeight, MAX_INPUT_HEIGHT_PX)}px`;
  };

  useEffect(() => {
    resizeInputToFitText();
  }, [input]);

  const addMessage = (message) => {
    setMessages((previous) => [...previous, { id: nextMessageId.current++, ...message }]);
  };

  // Sends one question to the existing RAG endpoint and shows the reply.
  const sendQuestion = async (questionText) => {
    const question = questionText.trim();
    if (!question || isSending) return;

    addMessage({ role: "user", text: question });
    setInput("");
    setIsSending(true);

    try {
      const response = await ragApi.sendChatMessage(question);
      addMessage({ role: "assistant", text: response.answer, sources: response.sources || [] });
    } catch (err) {
      // Keep the failed question so the person can retry it with one click.
      addMessage({
        role: "assistant",
        text: err.message || "Something went wrong.",
        isError: true,
        failedQuestion: question,
      });
      toast.error(err.message || "AIUB UniAssist AI could not answer that question.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    sendQuestion(input);
  };

  // Enter sends the message. Shift+Enter adds a new line.
  const handleInputKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion(input);
    }
  };

  const handleCopyAnswer = async (answerText) => {
    try {
      await navigator.clipboard.writeText(answerText);
      toast.success("Answer copied.");
    } catch {
      toast.error("Could not copy. Select the text and copy it manually.");
    }
  };

  const handleRetry = (failedMessageId, failedQuestion) => {
    // Remove the error bubble and the question before it, then ask again.
    setMessages((previous) => {
      const errorIndex = previous.findIndex((m) => m.id === failedMessageId);
      return previous.filter((_, index) => index !== errorIndex && index !== errorIndex - 1);
    });
    sendQuestion(failedQuestion);
  };

  const handleClearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  return (
    <div className="card flex flex-col h-[calc(100dvh-21rem)] lg:h-[calc(100dvh-13rem)] min-h-[440px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-line">
        <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center shrink-0">
          <Sparkles size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-parchment leading-tight">AIUB UniAssist AI</p>
          <p className="text-xs text-muted truncate">
            Answers come from the university&apos;s official documents
          </p>
        </div>
        {messages.length > 0 && (
          <button
            className="btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={handleClearChat}
            disabled={isSending}
          >
            <Trash2 size={13} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={messageListRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
        {messages.length === 0 ? (
          <div className="min-h-full flex flex-col items-center text-center px-2">
            {/* mt-auto on the icon and mb-auto on the chips center everything without clipping on short screens */}
            <div className="w-14 h-14 shrink-0 mt-auto rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center mb-4">
              <Sparkles size={24} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-parchment mb-2">
              What would you like to know?
            </h2>
            <p className="text-sm text-muted max-w-md mb-6">
              Ask about admissions, tuition fees, attendance, scholarships, exam rules, faculty
              contacts and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mb-auto">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => sendQuestion(question)}
                  className="text-sm text-parchment/90 bg-surface-raised/80 border border-line rounded-full px-4 py-2 transition-colors hover:border-gold/50 hover:text-gold-glow"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUserMessage = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex gap-3 animate-fadeIn ${isUserMessage ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isUserMessage
                      ? "bg-sky/10 border-sky/30 text-sky"
                      : "bg-gold/10 border-gold/30 text-gold"
                  }`}
                >
                  {isUserMessage ? <User size={15} /> : <Sparkles size={15} />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] min-w-0 ${isUserMessage ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block text-left rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isUserMessage
                        ? "bg-sky/10 border border-sky/30 text-parchment rounded-tr-md"
                        : message.isError
                          ? "bg-crimson/10 border border-crimson/30 text-crimson rounded-tl-md"
                          : "bg-surface-raised border border-line text-parchment rounded-tl-md"
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* Sources returned by the RAG endpoint */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-xs text-muted mb-1.5">Sources</p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.map((source, sourceIndex) => (
                          <span
                            key={sourceIndex}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-muted bg-surface border border-line rounded-full px-2.5 py-1"
                            title={source.chunk_id}
                          >
                            <FileText size={11} />
                            {source.document}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions under each assistant message */}
                  {!isUserMessage && (
                    <div className="flex gap-1 mt-1.5">
                      {message.isError ? (
                        <button
                          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-parchment px-2 py-1 rounded-md hover:bg-surface-raised transition-colors"
                          onClick={() => handleRetry(message.id, message.failedQuestion)}
                          disabled={isSending}
                        >
                          <RotateCcw size={12} /> Try again
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-parchment px-2 py-1 rounded-md hover:bg-surface-raised transition-colors"
                          onClick={() => handleCopyAnswer(message.text)}
                        >
                          <Copy size={12} /> Copy
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator while waiting for the backend */}
        {isSending && (
          <div
            className="flex gap-3 animate-fadeIn"
            role="status"
            aria-label="UniAssist is thinking"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-gold/10 border-gold/30 text-gold">
              <Sparkles size={15} />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-3.5 bg-surface-raised border border-line">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/80 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-gold/80 animate-pulse [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gold/80 animate-pulse [animation-delay:0.3s]" />
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleFormSubmit} className="px-4 sm:px-6 py-4 border-t border-line">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            className="input-field resize-none leading-relaxed"
            placeholder="Ask about admissions, fees, policies, courses…"
            aria-label="Your question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isSending}
            maxLength={1000}
          />
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={isSending || !input.trim()}
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="text-[11px] text-muted mt-2">Enter to send, Shift+Enter for a new line.</p>
      </form>
    </div>
  );
}

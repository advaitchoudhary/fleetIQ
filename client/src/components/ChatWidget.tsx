import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/env";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm the FleetIQ Assistant. Ask me anything about the platform — vehicles, maintenance, drivers, warranties, and more." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_BASE_URL}/chat`,
        { messages: next },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Something went wrong. Please try again.";
      setMessages([...next, { role: "assistant", content: `⚠ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 3000,
          width: "52px", height: "52px", borderRadius: "50%",
          background: "var(--t-accent)", border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(79,70,229,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s",
        }}
        title="FleetIQ Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: "92px", right: "28px", zIndex: 3000,
          width: "360px", maxHeight: "520px",
          background: "var(--t-surface)", border: "1px solid var(--t-border)",
          borderRadius: "16px", boxShadow: "var(--t-shadow-lg)",
          display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid var(--t-hover-bg)",
            display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "var(--t-indigo-bg)", border: "1px solid rgba(79,70,229,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t-text)" }}>FleetIQ Assistant</div>
              <div style={{ fontSize: "11px", color: "var(--t-success)", fontWeight: 600 }}>● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "var(--t-accent)" : "var(--t-surface-alt)",
                  color: m.role === "user" ? "#fff" : "var(--t-text-muted)",
                  fontSize: "13px", lineHeight: "1.55", border: m.role === "user" ? "none" : "1px solid var(--t-border)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
                  background: "var(--t-surface-alt)", border: "1px solid var(--t-border)",
                  fontSize: "13px", color: "var(--t-text-faint)",
                }}>
                  <span style={{ letterSpacing: "2px" }}>···</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--t-hover-bg)", flexShrink: 0, display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything about FleetIQ…"
              rows={1}
              style={{
                flex: 1, resize: "none", padding: "10px 12px",
                background: "var(--t-input-bg)", border: "1px solid var(--t-border-strong)",
                borderRadius: "8px", color: "var(--t-text)", fontSize: "13px",
                fontFamily: "Inter, system-ui, sans-serif", outline: "none",
                maxHeight: "100px", lineHeight: "1.5", overflowY: "auto",
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                padding: "10px 14px", background: input.trim() && !loading ? "var(--t-accent)" : "var(--t-hover-bg)",
                border: "none", borderRadius: "8px", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                color: input.trim() && !loading ? "#fff" : "var(--t-text-faint)",
                flexShrink: 0, transition: "background 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

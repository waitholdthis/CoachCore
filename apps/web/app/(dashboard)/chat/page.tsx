"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Shield, AlertTriangle, BookOpen, Loader2, MessageSquare } from "lucide-react";
import { chatApi, leaguesApi } from "@/lib/api";
import { AGE_BRACKETS, DIVISION_TYPES, SPORT_EMOJI } from "@/lib/utils";
import type { ChatMessage, ChatSource, Sport } from "@/lib/types";

const SUGGESTED_QUESTIONS = [
  "Can the keeper pick up a backpass in U10 rec soccer?",
  "How many pitches can an 11-year-old throw per game?",
  "Is zone defense allowed in U8 basketball?",
  "Can younger Pop Warner players carry the ball?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sport, setSport] = useState<Sport | "">("");
  const [ageBracket, setAgeBracket] = useState("");
  const [divisionType, setDivisionType] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: leagues } = useQuery({
    queryKey: ["leagues"],
    queryFn: () => leaguesApi.list(),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(text?: string) {
    const question = text ?? input.trim();
    if (!question || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await chatApi.ask({
        question,
        sport: sport || undefined,
        age_bracket: ageBracket || undefined,
        division_type: divisionType || undefined,
        league_id: leagueId || undefined,
        conversation_history: messages.slice(-6),
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: resp.answer,
        sources: resp.sources,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process your question. Please check your connection and try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Rule Check Chatbot</h1>
        <p className="text-slate-500 text-sm mt-1">Ask anything about youth sports rules — get a cited, localized answer</p>
      </div>

      {/* Context selectors */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-wrap gap-2 shadow-sm">
        <select value={sport} onChange={e => setSport(e.target.value as Sport | "")}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Any sport</option>
          {(["soccer","baseball","basketball","football"] as Sport[]).map(s => (
            <option key={s} value={s}>{SPORT_EMOJI[s]} {s}</option>
          ))}
        </select>
        <select value={ageBracket} onChange={e => setAgeBracket(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Any age</option>
          {AGE_BRACKETS.map(ab => <option key={ab} value={ab}>{ab}</option>)}
        </select>
        <select value={divisionType} onChange={e => setDivisionType(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Any division</option>
          {DIVISION_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
        </select>
        {leagues && leagues.length > 0 && (
          <select value={leagueId} onChange={e => setLeagueId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">No league selected</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="py-8">
            <div className="text-center mb-8">
              <MessageSquare size={48} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Ask a rules question to get started</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-600 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Looking up rules...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask a rules question..."
          className="flex-1 text-sm focus:outline-none text-slate-900 placeholder:text-slate-400"
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "bg-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-3" : ""}`}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl rounded-bl-sm border border-slate-200 px-4 py-3 shadow-sm">
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
            {message.sources && message.sources.length > 0 && (
              <SourceList sources={message.sources} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: ChatSource[] }) {
  return (
    <div className="space-y-1.5 ml-1">
      {sources.map((source, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
          <BookOpen size={12} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium text-slate-700">[Source {i + 1}]</span>{" "}
            {source.source_label}
            {source.rule_tier === "local" && (
              <span className="ml-1 text-brand-600 font-medium">(local)</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatBotProps = {
  mode?: "floating" | "inline";
  isOpen?: boolean;
  onClose?: () => void;
  showTriggerButton?: boolean;
};

// 簡易的なMarkdownリンクパーサー
const renderMessage = (content: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    parts.push(
      <Link
        key={match.index}
        href={match[2]}
        className="text-orange-500 underline font-bold hover:text-orange-600"
      >
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

export function ChatBot({ 
  mode = "floating", 
  isOpen: externalIsOpen, 
  onClose,
  showTriggerButton = true 
}: ChatBotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(mode === "inline");
  
  // 外部制御か内部制御かを判定
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;
  
  const handleOpenChange = (newState: boolean) => {
    if (isControlled) {
      if (!newState && onClose) {
        onClose();
      }
    } else {
      setInternalIsOpen(newState);
    }
  };

  const [isExpanded, setIsExpanded] = useState(mode === "inline"); // inlineモードでの展開状態
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "こんにちは！OKIPOKAへようこそ。何かお手伝いできることはありますか？🃏" }
  ]);
  const [sessionId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((mode === "floating" && isOpen) || (mode === "inline" && isExpanded)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
    if ((mode === "floating" && isOpen) || (mode === "inline" && isExpanded)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, isExpanded, mode]);

  const suggestedQuestions = [
    "今日のトーナメントは？",
    "那覇にある店舗教えて",
    "このサイトについて"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    if (mode === "inline") {
      setIsExpanded(true);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionId
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantMessage;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "すみません、エラーが発生しました。もう一度お試しください。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  if (mode === "inline") {
    return (
      <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 my-6">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden ring-1 ring-orange-100">
          {/* 常時展開ヘッダー */}
          <div className="bg-orange-50 p-4 flex items-center gap-3 border-b border-orange-100">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
              <Image src="/logo.png" alt="OKIPOKA AI" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">OKIPOKA AI</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">ONLINE</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">ポーカーのことなら何でも聞いてください</p>
            </div>
          </div>

          {/* メッセージエリア */}
          <div className="h-100 overflow-y-auto p-6 bg-white space-y-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "justify-end" : "flex-row"
                }`}
              >
                {msg.role !== "user" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 bg-white">
                    <Image src="/logo.png" alt="AI" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-5 py-3 rounded-3xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-50 border border-gray-100 text-gray-800"
                  }`}
                >
                  {renderMessage(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                  <Image src="/logo.png" alt="AI" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div className="bg-gray-50 border border-gray-100 px-5 py-4 rounded-3xl shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* サジェストチップ */}
            {!isLoading && messages[messages.length - 1].role === "assistant" && (
              <div className="flex flex-wrap gap-2 pl-11">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-full border border-orange-100 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none shadow-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* フローティングボタン */}
      {showTriggerButton && (
        <button
          onClick={() => handleOpenChange(!isOpen)}
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
              ? "bg-gray-200 text-gray-800 rotate-90 md:flex hidden" 
              : "bg-orange-500 text-white hover:bg-orange-600 flex"
          }`}
          aria-label="チャットを開く"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      )}

      {/* チャットウィンドウ */}
      <div
        className={`fixed z-50 bg-white overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col
          ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-10 pointer-events-none"
        }
          /* モバイル: 全画面 */
          inset-0 w-full h-full rounded-none
          
          /* PC: 右下固定、サイズアップ */
          md:inset-auto md:bottom-24 md:right-6 md:w-[500px] md:h-[700px] md:max-h-[80vh] md:rounded-2xl md:border md:border-gray-200 md:shadow-2xl
        `}
      >
        {/* ヘッダー */}
        <div className="bg-orange-500 p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 bg-white">
              <Image src="/logo.png" alt="OKIPOKA AI" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-sm">OKIPOKA AI</h3>
              <p className="text-xs text-orange-100">何でも聞いてください</p>
            </div>
          </div>
          {/* 閉じるボタン */}
          <button 
            onClick={() => handleOpenChange(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 ${
                msg.role === "user" ? "justify-end" : "flex-row"
              }`}
            >
              {msg.role !== "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-white border border-gray-100">
                  <Image src="/logo.png" alt="AI" width={32} height={32} className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gray-800 text-white"
                    : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                }`}
              >
                {renderMessage(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                <Image src="/logo.png" alt="AI" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-3xl shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

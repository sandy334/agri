
import React, { useState, useRef, useEffect } from 'react';
import { ai } from '../services';
import { Farm } from '../types';

export const ChatAssistant = ({ farms }: { farms: Farm[] }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Hello! I'm your AI Agronomist. I have access to your farm data. Ask me about irrigation schedules, weather impacts, or soil health." }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setSending(true);

    try {
      const farmContext = farms.map(f => 
        `Farm: ${f.name} (${f.crop}), Loc: ${f.location.lat},${f.location.lon}, Size: ${f.size} sq ft.`
      ).join("\n");

      const systemInstruction = `
        You are AgriCloud AI, an expert agricultural consultant. 
        You have access to the user's farms:
        ${farmContext}
        
        Answer questions about these farms, general agriculture, irrigation, pest control, and weather.
        Keep answers concise and practical for a farmer.
        If the user asks about a specific farm, use the data provided.
      `;

      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
      });

      const result = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "I couldn't generate a response." }]);

    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered a network error. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
        <h2 className="font-bold text-green-800 flex items-center gap-2">
          <i className="fa-solid fa-robot"></i> AI Agronomist
        </h2>
        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Gemini 2.5 Flash</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-green-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Ask about your crops, weather, or irrigation..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

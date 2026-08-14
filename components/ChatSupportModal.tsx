'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '@/lib/types';
import { MessageSquare, Send, User as UserIcon, RefreshCw } from 'lucide-react';

interface ChatSupportModalProps {
  user: User | null;
  studentsList?: User[];
}

export const ChatSupportModal: React.FC<ChatSupportModalProps> = ({
  user,
  studentsList = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  const fetchMessages = async () => {
    try {
      let url = '/api/chat';
      if (isStaff && selectedStudentId) {
        url += `?userId=${selectedStudentId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Real-time poll every 3 sec
    return () => clearInterval(interval);
  }, [selectedStudentId, isStaff]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputContent,
          receiver_id: isStaff ? selectedStudentId || null : null,
        }),
      });

      if (res.ok) {
        setInputContent('');
        await fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-[700px] bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
      
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Mensageiro / Suporte em Tempo Real</h3>
            <p className="text-xs text-slate-400">Canal de suporte com a administração do grupo</p>
          </div>
        </div>

        <button
          onClick={fetchMessages}
          className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl transition-all"
          title="Atualizar mensagens"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Staff Selector to pick student conversation */}
      {isStaff && studentsList.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center space-x-2">
          <span className="text-xs font-bold text-amber-400">Conversar com Aluno:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
          >
            <option value="">-- Todos os Alunos / Suporte Geral --</option>
            {studentsList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.nickname}) - Corda {st.corda}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40 scrollbar-thin scrollbar-thumb-emerald-500/30">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhuma mensagem trocada ainda. Escreva sua primeira mensagem abaixo!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 font-medium px-1 mb-1">
                  {msg.sender_name || 'Usuário'} ({msg.sender_role || 'ALUNO'})
                </span>
                <div
                  className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Escreva sua mensagem para o suporte..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !inputContent.trim()}
          className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};

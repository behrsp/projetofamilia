'use client';

import React, { useState } from 'react';
import { StudentRequest, User } from '@/lib/types';
import { 
  ClipboardList, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  X 
} from 'lucide-react';

interface RequestsManagerProps {
  requests: StudentRequest[];
  user: User | null;
  onAddRequest: (data: { request_type: any; title: string; description: string }) => Promise<void>;
  onRespondRequest: (id: string, status: 'ACCEPTED' | 'REJECTED', reason: string) => Promise<void>;
}

export const RequestsManager: React.FC<RequestsManagerProps> = ({
  requests,
  user,
  onAddRequest,
  onRespondRequest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<any>('TUTORIAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Decision Modal state for Staff
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  const requestTypesList = [
    { id: 'TUTORIAL', label: 'Tutorial de Movimento' },
    { id: 'TOQUE_BERIMBAU', label: 'Toque de Berimbau' },
    { id: 'TOQUE_ATABAQUE', label: 'Toque de Atabaque' },
    { id: 'MUSICA', label: 'Música para o Acervo' },
  ];

  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Por favor, preencha o título e os detalhes do pedido.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAddRequest({ request_type: requestType, title, description });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (status: 'ACCEPTED' | 'REJECTED') => {
    if (!selectedRequest) return;
    try {
      setLoading(true);
      await onRespondRequest(selectedRequest.id, status, decisionReason);
      setSelectedRequest(null);
      setDecisionReason('');
    } catch (err: any) {
      alert(err.message || 'Erro ao processar decisão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white">Central de Pedidos de Conteúdo</h2>
          <p className="text-xs text-slate-400">Solicite tutoriais, toques de berimbau, atabaque ou músicas para o acervo</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Fazer um Pedido</span>
        </button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Nenhum pedido registrado</h3>
          <p className="text-xs text-slate-500 mt-1">Precisa aprender um toque ou música? Faça seu pedido acima!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((reqItem) => (
            <div
              key={reqItem.id}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    {reqItem.request_type.replace('_', ' ')}
                  </span>
                  {isStaff && reqItem.user_name && (
                    <span className="text-xs text-amber-400 font-bold">
                      Por: {reqItem.user_name} ({reqItem.user_nickname})
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-1.5">
                  {reqItem.status === 'PENDING' && (
                    <span className="flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Em Análise</span>
                    </span>
                  )}
                  {reqItem.status === 'ACCEPTED' && (
                    <span className="flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pedido Aceito</span>
                    </span>
                  )}
                  {reqItem.status === 'REJECTED' && (
                    <span className="flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Pedido Rejeitado</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-lg font-bold text-white">{reqItem.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                  {reqItem.description}
                </p>
              </div>

              {/* Reason / Response */}
              {reqItem.response_reason && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block">Resposta do Professor/Admin:</span>
                    <p className="text-slate-200 mt-0.5 leading-snug">{reqItem.response_reason}</p>
                  </div>
                </div>
              )}

              {/* Staff Action to Approve/Reject */}
              {isStaff && reqItem.status === 'PENDING' && (
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedRequest(reqItem);
                      setDecisionReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md"
                  >
                    Analisar & Responder Pedido
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Solicitar Conteúdo</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewRequest} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo de Pedido
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
                >
                  {requestTypesList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Título do Pedido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tutorial do Toque de Benguela no Atabaque"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Detalhes / Explicação *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva detalhadamente o que gostaria de aprender..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Decision Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-white">Analisar Pedido do Aluno</h3>
            
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="font-bold text-amber-400 block">{selectedRequest.title}</span>
              <p className="text-slate-300 mt-1">{selectedRequest.description}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Motivo / Justificativa da Decisão
              </label>
              <textarea
                rows={3}
                placeholder="Escreva uma justificativa ou mensagem para o aluno..."
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDecision('REJECTED')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
                >
                  Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('ACCEPTED')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                >
                  Aceitar Pedido
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

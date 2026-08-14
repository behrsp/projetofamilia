'use client';

import React, { useState } from 'react';
import { GroupEvent, User } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  UserCheck, 
  UserX, 
  Plus, 
  Trash2, 
  Users, 
  CheckCircle, 
  HelpCircle, 
  XCircle 
} from 'lucide-react';

interface EventCardProps {
  events: GroupEvent[];
  user: User | null;
  onAddEvent: () => void;
  onDeleteEvent: (id: string) => Promise<void>;
  onRsvp: (eventId: string, status: 'VOU' | 'NAO_SEI' | 'NAO_VOU') => Promise<void>;
}

export const EventCard: React.FC<EventCardProps> = ({
  events,
  user,
  onAddEvent,
  onDeleteEvent,
  onRsvp,
}) => {
  const [selectedEventDetails, setSelectedEventDetails] = useState<GroupEvent | null>(null);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white">Eventos & Batizados ABADÁ</h2>
          <p className="text-xs text-slate-400">Confirme sua presença e acompanhe os eventos do grupo</p>
        </div>

        {isStaff && (
          <button
            onClick={onAddEvent}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Evento</span>
          </button>
        )}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Nenhum evento agendado</h3>
          <p className="text-xs text-slate-500 mt-1">Fique atento aos próximos batizados, encontros e aulões.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const counts = evt.rsvps_count || { vou: 0, nao_sei: 0, nao_vou: 0 };
            return (
              <div
                key={evt.id}
                className="flex flex-col bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl hover:border-emerald-500/40 transition-all group"
              >
                {/* Banner Photo */}
                {evt.banner_url ? (
                  <div className="relative h-48 sm:h-56 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={evt.banner_url}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  </div>
                ) : (
                  <div className="h-28 bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border-b border-slate-800 flex items-center justify-center">
                    <CalendarIcon className="w-10 h-10 text-emerald-500/40" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Data: {evt.event_date}</span>
                      </span>

                      {isStaff && (
                        <button
                          onClick={() => onDeleteEvent(evt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          title="Excluir Evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-white mt-3 group-hover:text-emerald-300 transition-colors">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
                      {evt.description}
                    </p>
                  </div>

                  {/* Student RSVP Selector */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                      Sua Confirmação:
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      {/* VOU */}
                      <button
                        onClick={() => onRsvp(evt.id, 'VOU')}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                          evt.my_rsvp === 'VOU'
                            ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                            : 'bg-slate-950 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Vou</span>
                      </button>

                      {/* NAO SEI */}
                      <button
                        onClick={() => onRsvp(evt.id, 'NAO_SEI')}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                          evt.my_rsvp === 'NAO_SEI'
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                            : 'bg-slate-950 text-amber-400 border border-amber-500/30 hover:bg-amber-500/10'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Não Sei</span>
                      </button>

                      {/* NAO VOU */}
                      <button
                        onClick={() => onRsvp(evt.id, 'NAO_VOU')}
                        className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
                          evt.my_rsvp === 'NAO_VOU'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400'
                            : 'bg-slate-950 text-red-400 border border-red-500/30 hover:bg-red-500/10'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Não Vou</span>
                      </button>
                    </div>

                    {/* Consolidated Attendance Stats */}
                    <div className="flex items-center justify-between pt-2 text-[11px] font-semibold text-slate-400">
                      <div className="flex items-center space-x-3">
                        <span className="text-emerald-400">Vou: {counts.vou}</span>
                        <span className="text-amber-400">Dúvida: {counts.nao_sei}</span>
                        <span className="text-red-400">Não vou: {counts.nao_vou}</span>
                      </div>

                      {isStaff && evt.rsvps_details && (
                        <button
                          onClick={() => setSelectedEventDetails(evt)}
                          className="flex items-center space-x-1 text-emerald-400 hover:underline font-bold"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Ver Lista</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Attendance Modal Details */}
      {selectedEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold text-white">Lista de Confirmações</h3>
                <p className="text-xs text-amber-400">{selectedEventDetails.title}</p>
              </div>
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
              {(!selectedEventDetails.rsvps_details || selectedEventDetails.rsvps_details.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-6">Nenhum aluno respondeu a este evento ainda.</p>
              ) : (
                selectedEventDetails.rsvps_details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {detail.user_name} ({detail.user_nickname})
                      </span>
                      <span className="text-[10px] text-amber-400">Corda: {detail.user_corda}</span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full font-extrabold text-[11px] ${
                        detail.status === 'VOU'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : detail.status === 'NAO_SEI'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {detail.status === 'VOU' ? 'Vou' : detail.status === 'NAO_SEI' ? 'Não sei' : 'Não Vou'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEventDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

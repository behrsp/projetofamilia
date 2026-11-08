'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Award, 
  Sparkles, 
  Flame, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface StudentCheckinCardProps {
  user: User;
  isCheckedInToday: boolean;
  todayCheckinTime?: string;
  isTodayClassDay: boolean;
  weekdayName: string;
  myMonthCount: number;
  myYearCount: number;
  onCheckinSuccess: () => Promise<void>;
}

export const StudentCheckinCard: React.FC<StudentCheckinCardProps> = ({
  user,
  isCheckedInToday,
  todayCheckinTime,
  isTodayClassDay,
  weekdayName,
  myMonthCount,
  myYearCount,
  onCheckinSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const handleCheckin = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar check-in.');
      }

      setShowSuccessAnim(true);
      await onCheckinSuccess();
      setTimeout(() => setShowSuccessAnim(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar check-in.');
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = todayCheckinTime
    ? new Date(todayCheckinTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
      
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Left Side: Status & Info */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chamada & Frequência</span>
            </span>

            {isTodayClassDay && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Dia de Treino ({weekdayName})</span>
              </span>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Check-in de Presença
          </h3>

          <p className="text-xs text-slate-300 max-w-xl">
            {isCheckedInToday
              ? `Presença confirmada hoje${formattedTime ? ` às ${formattedTime}` : ''}! Muito axé e bom treino com a família ABADÁ.`
              : isTodayClassDay
              ? 'Chegou ao treino? Confirme sua presença agora mesmo para registrar sua frequência oficial.'
              : `Hoje (${weekdayName}) não é dia de treino regular. Nossas aulas acontecem todas as Segundas e Quartas-feiras.`}
          </p>

          {/* Student Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-slate-400">Suas Presenças no Mês:</span>
              <span className="font-extrabold text-emerald-400">{myMonthCount} treinos</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <span className="text-slate-400">Total no Ano:</span>
              <span className="font-extrabold text-amber-400">{myYearCount} treinos</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Action Button */}
        <div className="w-full md:w-auto shrink-0 flex flex-col items-center sm:items-end">
          {isCheckedInToday ? (
            <div className="w-full md:w-auto flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div className="text-left">
                <span className="font-black text-sm block">Presença Confirmada!</span>
                {formattedTime && (
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Registrado às {formattedTime}
                  </span>
                )}
              </div>
            </div>
          ) : isTodayClassDay ? (
            <button
              onClick={handleCheckin}
              disabled={loading}
              className="w-full md:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Confirmando...</span>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>Marcar Minha Presença</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          ) : (
            <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Check-in liberado nas Segundas e Quartas</span>
            </div>
          )}
        </div>

      </div>

      {/* Success Animation Overlay */}
      {showSuccessAnim && (
        <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-2 animate-fadeIn z-10">
          <div className="p-3 bg-emerald-500 text-slate-950 rounded-full animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-black text-white">Presença Registrada com Sucesso!</h4>
          <p className="text-xs text-emerald-300 font-semibold">Axé! Bom treino de Capoeira!</p>
        </div>
      )}

    </div>
  );
};


'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@/lib/types';
import { 
  Cake, 
  PartyPopper, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle, 
  Sparkles, 
  Award, 
  Search,
  RotateCcw
} from 'lucide-react';
import { 
  parseBirthdate, 
  MONTH_NAMES, 
  isBirthdayToday, 
  calculateAge, 
  getWhatsAppBirthdayLink, 
  getCordInfo 
} from '@/lib/dateUtils';

interface BirthdaysCardProps {
  students: User[];
  isStandalone?: boolean; // If used as a full tab section or embedded card
}

export const BirthdaysCard: React.FC<BirthdaysCardProps> = ({
  students,
  isStandalone = false,
}) => {
  const today = useMemo(() => new Date(), []);
  const currentRealMonth = today.getMonth() + 1; // 1 to 12
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [searchFilter, setSearchFilter] = useState('');

  // Extract birthdays for the selected month and sort by day
  const monthBirthdays = useMemo(() => {
    const list: Array<{
      student: User;
      day: number;
      month: number;
      year?: number;
      isToday: boolean;
      age: number | null;
    }> = [];

    students.forEach((s) => {
      const parsed = parseBirthdate(s.birthdate);
      if (parsed && parsed.month === selectedMonth) {
        list.push({
          student: s,
          day: parsed.day,
          month: parsed.month,
          year: parsed.year,
          isToday: isBirthdayToday(s.birthdate, today),
          age: calculateAge(s.birthdate, today),
        });
      }
    });

    // Sort by day ascending
    list.sort((a, b) => a.day - b.day);

    if (!searchFilter.trim()) return list;

    const query = searchFilter.toLowerCase();
    return list.filter(
      (item) =>
        item.student.name.toLowerCase().includes(query) ||
        item.student.nickname.toLowerCase().includes(query) ||
        item.student.corda.toLowerCase().includes(query) ||
        String(item.day).includes(query)
    );
  }, [students, selectedMonth, today, searchFilter]);

  // Today's birthday count
  const todaysBirthdays = useMemo(() => {
    return monthBirthdays.filter((b) => b.isToday);
  }, [monthBirthdays]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 1 ? 12 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === 12 ? 1 : prev + 1));
  };

  const handleResetToCurrent = () => {
    setSelectedMonth(currentRealMonth);
  };

  const monthName = MONTH_NAMES[selectedMonth - 1];
  const isCurrentMonth = selectedMonth === currentRealMonth;

  return (
    <div className={`rounded-3xl bg-slate-900/90 border border-emerald-500/30 overflow-hidden shadow-2xl backdrop-blur-xl ${
      isStandalone ? 'p-6 sm:p-8 space-y-6' : 'p-5 sm:p-6 space-y-5'
    }`}>
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        
        {/* Title & Badge */}
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Cake className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Aniversariantes do Mês
              </h2>
              {isCurrentMonth && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mês Atual
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Celebre a vida e o axé dos nossos capoeiristas da família ABADÁ
            </p>
          </div>
        </div>

        {/* Month Selector Carousel */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          {!isCurrentMonth && (
            <button
              onClick={handleResetToCurrent}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center space-x-1"
              title="Voltar ao mês atual"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hoje</span>
            </button>
          )}

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-center min-w-[110px]">
              <span className="font-extrabold text-amber-300 text-sm block">
                {monthName}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">
                {monthBirthdays.length} {monthBirthdays.length === 1 ? 'aluno' : 'alunos'}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Special Today Celebratory Banner */}
      {todaysBirthdays.length > 0 && isCurrentMonth && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/60 via-amber-950/40 to-emerald-950/60 border border-pink-500/40 flex items-center justify-between gap-3 shadow-lg shadow-pink-500/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-300 shrink-0">
              <PartyPopper className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center space-x-1.5">
                <span>Hoje é dia de Roda de Aniversário!</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h4>
              <p className="text-xs text-pink-200/90">
                {todaysBirthdays.map((b) => b.student.nickname || b.student.name).join(', ')}{' '}
                {todaysBirthdays.length === 1 ? 'está comemorando hoje!' : 'estão comemorando hoje!'} Não esqueça de mandar parabéns!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Input when there are birthdays */}
      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={`Filtrar aniversariantes em ${monthName}...`}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Birthday Grid */}
      {monthBirthdays.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-300">
              Nenhum aniversariante cadastrado em {monthName}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchFilter
                ? 'Nenhum integrante coincide com o termo buscado.'
                : 'Navegue para outros meses nas setas acima para conferir os aniversários do ano!'}
            </p>
          </div>
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthBirthdays.map(({ student, day, isToday, age }) => {
            const cordInfo = getCordInfo(student.corda);
            const waLink = getWhatsAppBirthdayLink(student.phone, student.name, student.nickname);

            return (
              <div
                key={student.id}
                className={`relative rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group border ${
                  isToday
                    ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/20 ring-1 ring-amber-500/40'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                {/* Birthday Day Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-amber-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dia {String(day).padStart(2, '0')}</span>
                  </div>

                  {isToday ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500 text-white shadow-md shadow-pink-500/30 animate-pulse flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>É HOJE!</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {monthName}
                    </span>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex items-center space-x-3.5 mb-4">
                  {/* Avatar with Cord Color Border */}
                  <div 
                    className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-md"
                    style={{
                      border: `3px solid ${cordInfo.color}`,
                    }}
                  >
                    {student.avatar_url ? (
                      <img
                        src={student.avatar_url}
                        alt={student.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center font-extrabold text-base text-white">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name and Nickname */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-white text-sm truncate">
                      {student.name}
                    </h3>
                    <p className="text-amber-400 font-bold text-xs truncate">
                      &quot;{student.nickname}&quot;
                    </p>
                    {age !== null && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isToday ? `Completando ${age} anos!` : `${age} anos`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cord Badge & WhatsApp Link */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-extrabold truncate"
                    style={{
                      backgroundColor: cordInfo.color,
                      color: cordInfo.textColor,
                      border: '1px solid rgba(0,0,0,0.15)',
                    }}
                    title={`Graduação: ${cordInfo.name}`}
                  >
                    {student.corda}
                  </span>

                  {student.phone && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all text-xs font-bold shrink-0 shadow-sm"
                      title="Enviar felicitações no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Parabenizar</span>
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};


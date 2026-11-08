'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, StudentAttendanceStats, AttendanceDashboardData, Checkin } from '@/lib/types';
import { 
  ClipboardCheck, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Download, 
  Printer, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageCircle, 
  X, 
  Check, 
  TrendingUp, 
  Flame,
  FileSpreadsheet,
  FileText,
  Send,
  RotateCcw,
  Eye
} from 'lucide-react';
import { 
  MONTH_NAMES, 
  getCordInfo, 
  formatDateShortBR, 
  getWhatsAppBirthdayLink,
  getLocalDateString,
  getWeekdayName
} from '@/lib/dateUtils';

interface AttendanceDashboardProps {
  students: User[];
  userRole?: UserRole;
  dashboardData: AttendanceDashboardData | null;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  onRefresh: () => Promise<void>;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  students,
  userRole = 'ADMIN',
  dashboardData,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onRefresh,
}) => {
  const isReadOnly = userRole === 'RECEPCAO';

  // Separate Recepção users from Capoeira students
  const recepcaoUsers = useMemo(
    () => students.filter((s) => s.role === 'RECEPCAO'),
    [students]
  );
  const capoeiraStudents = useMemo(
    () => students.filter((s) => s.role !== 'RECEPCAO'),
    [students]
  );

  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'chamada_dia'>('geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);

  // Manual Check-in Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualDate, setManualDate] = useState(dashboardData?.todayDateStr || getLocalDateString());
  const [manualNotes, setManualNotes] = useState('Registrado manualmente pelo administrador');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  // WhatsApp Recepção & PDF Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [reportScope, setReportScope] = useState<'dia' | 'mes'>('dia');
  const [selectedRecepcaoIds, setSelectedRecepcaoIds] = useState<string[]>([]);
  const [sentRecepcaoIds, setSentRecepcaoIds] = useState<string[]>([]);
  const [extraWhatsAppPhone, setExtraWhatsAppPhone] = useState('');
  const [customWhatsAppNotes, setCustomWhatsAppNotes] = useState('');

  // Attendance by Day date filter
  const [selectedDayDate, setSelectedDayDate] = useState(dashboardData?.todayDateStr || getLocalDateString());

  // Pre-select all Recepção users when modal opens or recepcaoUsers changes
  useEffect(() => {
    setSelectedRecepcaoIds(recepcaoUsers.map((r) => r.id));
  }, [recepcaoUsers]);

  // Date details popover
  const [viewingDatesStudent, setViewingDatesStudent] = useState<StudentAttendanceStats | null>(null);

  const monthName = MONTH_NAMES[selectedMonth - 1] || '';

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const handleResetToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(now.getMonth() + 1, now.getFullYear());
  };

  // Submit manual check-in
  const handleSaveManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      setManualError('Por favor, selecione um aluno.');
      return;
    }

    try {
      setManualLoading(true);
      setManualError('');
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: manualStudentId,
          date: manualDate,
          notes: manualNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar check-in.');
      }

      setIsManualModalOpen(false);
      setManualStudentId('');
      setManualNotes('Registrado manualmente pelo administrador');
      await onRefresh();
    } catch (err: any) {
      setManualError(err.message || 'Erro ao registrar check-in.');
    } finally {
      setManualLoading(false);
    }
  };

  // Toggle checkin on specific date directly
  const handleToggleCheckinForStudent = async (studentId: string, date: string, isCurrentlyPresent: boolean) => {
    if (isReadOnly) return;
    try {
      if (isCurrentlyPresent) {
        const res = await fetch(`/api/checkin?user_id=${studentId}&date=${date}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
      } else {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: studentId,
            date,
            notes: 'Chamada do dia',
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
      }
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar presença.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.location.href = `/api/checkin/export?month=${selectedMonth}&year=${selectedYear}`;
  };

  // Generate Printable / Saveable PDF for Day or Month
  const handleGeneratePDF = (scope: 'dia' | 'mes' = activeSubTab === 'chamada_dia' ? 'dia' : 'mes') => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      window.print();
      return;
    }

    const emittedAt = new Date().toLocaleString('pt-BR');

    if (scope === 'dia') {
      const presentSet = new Set<string>();
      const checkinTimeMap = new Map<string, string>();
      dashboardData?.todayCheckins?.forEach((c) => {
        if (c.checkin_date === selectedDayDate) {
          presentSet.add(c.user_id);
          if (c.created_at) {
            checkinTimeMap.set(
              c.user_id,
              new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            );
          }
        }
      });

      const presentStudents = capoeiraStudents.filter((s) => presentSet.has(s.id));
      const absentStudents = capoeiraStudents.filter((s) => !presentSet.has(s.id));
      const formattedDay = formatDateShortBR(selectedDayDate) || selectedDayDate;

      const rowsHtml = capoeiraStudents
        .map((st, idx) => {
          const isPresent = presentSet.has(st.id);
          const timeStr = checkinTimeMap.get(st.id) || '-';
          return `
            <tr style="background:${isPresent ? '#f0fdf4' : '#ffffff'};">
              <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;">${idx + 1}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5be;font-weight:bold;">${st.name}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">"${st.nickname}"</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">${st.corda}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;">${st.phone}</td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:${isPresent ? '#15803d' : '#b91c1c'};">
                ${isPresent ? 'PRESENTE' : 'AUSENTE'}
              </td>
              <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;">${timeStr}</td>
            </tr>
          `;
        })
        .join('');

      printWin.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Chamada_ABADA_${selectedDayDate}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; }
            .header { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 20px; font-weight: 900; color: #065f46; margin: 0; }
            .subtitle { font-size: 13px; color: #475569; margin: 4px 0 0 0; }
            .summary { display: flex; gap: 16px; margin-bottom: 18px; }
            .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 16px; background: #f8fafc; }
            .box-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .box-val { font-size: 18px; font-weight: 900; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #0f172a; color: #ffffff; padding: 9px 10px; border: 1px solid #0f172a; text-align: left; text-transform: uppercase; font-size: 11px; }
            .footer { margin-top: 20px; font-size: 11px; color: #64748b; text-align: right; }
            @media print { .no-print { display: none !important; } body { margin: 10px; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:16px;padding:12px;background:#ecfdf5;border:1px solid #10b981;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:bold;color:#065f46;">Para salvar como arquivo PDF, escolha "Salvar como PDF" na janela de impressão.</span>
            <button onclick="window.print()" style="padding:8px 16px;background:#059669;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Imprimir / Salvar PDF</button>
          </div>
          <div class="header">
            <div>
              <h1 class="title">ABADÁ CAPOEIRA — LISTA DE CHAMADA DO DIA</h1>
              <p class="subtitle">Data do Treino: <strong>${formattedDay} (${selectedDayDate.split('-').reverse().join('/')})</strong></p>
            </div>
            <div style="text-align:right;font-size:11px;color:#475569;">
              Emitido em:<br/><strong>${emittedAt}</strong>
            </div>
          </div>
          <div class="summary">
            <div class="box"><div class="box-label">Total de Alunos</div><div class="box-val">${capoeiraStudents.length}</div></div>
            <div class="box"><div class="box-label">Presentes Hoje</div><div class="box-val" style="color:#15803d;">${presentStudents.length}</div></div>
            <div class="box"><div class="box-label">Ausentes</div><div class="box-val" style="color:#b91c1c;">${absentStudents.length}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:36px;text-align:center;">#</th>
                <th>Nome Completo</th>
                <th>Apelido</th>
                <th>Corda</th>
                <th>Telefone</th>
                <th style="text-align:center;">Status</th>
                <th style="text-align:center;">Horário</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">Sistema Oficial ABADÁ Capoeira — Controle de Portaria & Recepção</div>
          <script>setTimeout(() => { window.print(); }, 400);</script>
        </body>
        </html>
      `);
      printWin.document.close();
      return;
    }

    // Scope === 'mes' (Relatório Mensal Completo)
    const statsList = dashboardData?.studentsStats || [];
    const rowsHtml = statsList
      .map((st, idx) => {
        return `
          <tr style="background:${st.alertaFaltas ? '#fef2f2' : '#ffffff'};">
            <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;">${idx + 1}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;font-weight:bold;">${st.user.name}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;">"${st.user.nickname}"</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;">${st.user.corda}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#15803d;">${st.presencasMes}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:${st.alertaFaltas ? '#b91c1c' : '#334155'};">${st.faltasMes}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;">${st.frequenciaPct}%</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;text-align:center;">${st.presencasAno}</td>
            <td style="padding:8px 10px;border:1px solid #cbd5e1;font-weight:bold;color:${st.alertaFaltas ? '#b91c1c' : '#15803d'};">
              ${st.alertaFaltas ? 'ALERTA (>3 faltas)' : 'Regular'}
            </td>
          </tr>
        `;
      })
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Frequencia_ABADA_${monthName}_${selectedYear}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; }
          .header { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 20px; font-weight: 900; color: #065f46; margin: 0; }
          .subtitle { font-size: 13px; color: #475569; margin: 4px 0 0 0; }
          .summary { display: flex; gap: 16px; margin-bottom: 18px; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 16px; background: #f8fafc; }
          .box-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .box-val { font-size: 18px; font-weight: 900; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #0f172a; color: #ffffff; padding: 9px 10px; border: 1px solid #0f172a; text-align: left; text-transform: uppercase; font-size: 11px; }
          .footer { margin-top: 20px; font-size: 11px; color: #64748b; text-align: right; }
          @media print { .no-print { display: none !important; } body { margin: 10px; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:16px;padding:12px;background:#ecfdf5;border:1px solid #10b981;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:bold;color:#065f46;">Para salvar como arquivo PDF, escolha "Salvar como PDF" na janela de impressão.</span>
          <button onclick="window.print()" style="padding:8px 16px;background:#059669;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">Imprimir / Salvar PDF</button>
        </div>
        <div class="header">
          <div>
            <h1 class="title">ABADÁ CAPOEIRA — RELATÓRIO MENSAL DE FREQUÊNCIA</h1>
            <p class="subtitle">Mês de Referência: <strong>${monthName} de ${selectedYear}</strong></p>
          </div>
          <div style="text-align:right;font-size:11px;color:#475569;">
            Emitido em:<br/><strong>${emittedAt}</strong>
          </div>
        </div>
        <div class="summary">
          <div class="box"><div class="box-label">Aulas Realizadas / Previstas</div><div class="box-val">${dashboardData?.totalAulasOcorridas || 0} / ${dashboardData?.totalAulasMes || 0}</div></div>
          <div class="box"><div class="box-label">Total de Presenças</div><div class="box-val" style="color:#15803d;">${dashboardData?.totalCheckinsMes || 0}</div></div>
          <div class="box"><div class="box-label">Média / Aula</div><div class="box-val">${dashboardData?.mediaAlunosPorAula || 0}</div></div>
          <div class="box"><div class="box-label">Alunos em Alerta (&gt;3 faltas)</div><div class="box-val" style="color:#b91c1c;">${dashboardData?.alunosEmAlertaCount || 0}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">#</th>
              <th>Nome Completo</th>
              <th>Apelido</th>
              <th>Corda</th>
              <th style="text-align:center;">Presenças</th>
              <th style="text-align:center;">Faltas</th>
              <th style="text-align:center;">% Freq.</th>
              <th style="text-align:center;">Ano</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">Sistema Oficial ABADÁ Capoeira — Controle de Portaria & Recepção</div>
        <script>setTimeout(() => { window.print(); }, 400);</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // Reset Month Check-ins
  const handleResetMonthCheckins = async () => {
    if (isReadOnly) return;
    if (!confirm(`Tem certeza que deseja ZERAR todas as presenças e faltas de ${monthName}/${selectedYear}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/checkin?reset_month=1&month=${selectedMonth}&year=${selectedYear}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao zerar mês.');
      }
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao zerar mês.');
    }
  };

  // Open WhatsApp Recepção Modal
  const handleOpenWhatsAppModal = () => {
    setReportScope(activeSubTab === 'chamada_dia' ? 'dia' : 'mes');
    setSentRecepcaoIds([]);
    setIsWhatsAppModalOpen(true);
  };

  const toggleRecepcaoSelection = (id: string) => {
    setSelectedRecepcaoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Build formatted WhatsApp text for Day or Month
  const buildWhatsAppReportText = (recipientName?: string) => {
    const greeting = recipientName ? `Olá *${recipientName}* (Recepção)!` : `Olá Equipe de Recepção!`;

    if (reportScope === 'dia') {
      const presentSet = new Set<string>();
      dashboardData?.todayCheckins?.forEach((c) => {
        if (c.checkin_date === selectedDayDate) {
          presentSet.add(c.user_id);
        }
      });

      const presentStudents = capoeiraStudents.filter((s) => presentSet.has(s.id));
      const absentStudents = capoeiraStudents.filter((s) => !presentSet.has(s.id));
      const dateBR = selectedDayDate.split('-').reverse().join('/');

      let msg = `🥋 *CHAMADA DO DIA - ABADÁ CAPOEIRA*\n`;
      msg += `${greeting}\n`;
      msg += `📅 *Data da Aula:* ${dateBR} (${formatDateShortBR(selectedDayDate)})\n`;
      msg += `✅ *Presentes:* ${presentStudents.length} | ❌ *Ausentes:* ${absentStudents.length}\n\n`;

      if (customWhatsAppNotes.trim()) {
        msg += `📌 *Obs:* ${customWhatsAppNotes.trim()}\n\n`;
      }

      msg += `*LISTA DE PRESENTES (${presentStudents.length}):*\n`;
      if (presentStudents.length === 0) {
        msg += `_Nenhuma presença registrada nesta data._\n`;
      } else {
        presentStudents.forEach((s, idx) => {
          msg += `${idx + 1}. *${s.name}* ("${s.nickname}") - Corda ${s.corda}\n`;
        });
      }

      if (absentStudents.length > 0) {
        msg += `\n*AUSENTES (${absentStudents.length}):*\n`;
        absentStudents.forEach((s) => {
          msg += `• ${s.name} ("${s.nickname}")\n`;
        });
      }

      msg += `\n📄 _Você também pode visualizar/imprimir o PDF pelo painel da Recepção no App._`;
      return msg;
    }

    // Monthly Report
    const statsList = dashboardData?.studentsStats || [];
    let msg = `🥋 *RELATÓRIO MENSAL DE FREQUÊNCIA - ABADÁ CAPOEIRA*\n`;
    msg += `${greeting}\n`;
    msg += `📅 *Mês:* ${monthName} de ${selectedYear}\n`;
    msg += `📊 *Aulas Realizadas:* ${dashboardData?.totalAulasOcorridas || 0} de ${dashboardData?.totalAulasMes || 0}\n`;
    msg += `✅ *Total de Presenças:* ${dashboardData?.totalCheckinsMes || 0}\n\n`;

    if (customWhatsAppNotes.trim()) {
      msg += `📌 *Obs:* ${customWhatsAppNotes.trim()}\n\n`;
    }

    msg += `*RESUMO POR ALUNO:*\n`;
    statsList.forEach((st, idx) => {
      const alertFlag = st.alertaFaltas ? ' ⚠️' : '';
      msg += `${idx + 1}. *${st.user.name}* ("${st.user.nickname}"): ${st.presencasMes} pres. | ${st.faltasMes} faltas (${st.frequenciaPct}%)${alertFlag}\n`;
    });

    msg += `\n📄 _Relatório completo em PDF e Excel disponível no painel da Recepção._`;
    return msg;
  };

  const handleSendWhatsAppToPhone = (phone: string, name?: string, recepcaoId?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      alert('Número de WhatsApp inválido.');
      return;
    }
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const text = encodeURIComponent(buildWhatsAppReportText(name));
    if (recepcaoId) {
      setSentRecepcaoIds((prev) => (prev.includes(recepcaoId) ? prev : [...prev, recepcaoId]));
    }
    window.open(`https://wa.me/${finalPhone}?text=${text}`, '_blank');
  };

  // Filter students
  const filteredStats = useMemo(() => {
    if (!dashboardData?.studentsStats) return [];
    let list = dashboardData.studentsStats;

    if (filterAlertsOnly) {
      list = list.filter((s) => s.alertaFaltas);
    }

    if (!searchTerm.trim()) return list;

    const query = searchTerm.toLowerCase();
    return list.filter(
      (s) =>
        s.user.name.toLowerCase().includes(query) ||
        s.user.nickname.toLowerCase().includes(query) ||
        s.user.corda.toLowerCase().includes(query) ||
        s.user.phone.includes(query)
    );
  }, [dashboardData, searchTerm, filterAlertsOnly]);

  // Alert students count
  const alertStudents = useMemo(() => {
    if (!dashboardData?.studentsStats) return [];
    return dashboardData.studentsStats.filter((s) => s.alertaFaltas);
  }, [dashboardData]);

  // Today/Selected day checkins set
  const dayCheckinUserIds = useMemo(() => {
    const set = new Set<string>();
    dashboardData?.todayCheckins?.forEach((c) => {
      if (c.checkin_date === selectedDayDate) {
        set.add(c.user_id);
      }
    });
    return set;
  }, [dashboardData, selectedDayDate]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Top Header & Month Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/90 p-4 sm:p-5 rounded-3xl border border-emerald-500/30 backdrop-blur-md shadow-2xl w-full">
        
        {/* Title */}
        <div className="flex items-center space-x-3.5 w-full lg:w-auto">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 shrink-0">
            <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                Controle de Presença
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Segundas e Quartas
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Gestão de frequência e alertas de evasão
            </p>
          </div>
        </div>

        {/* Month Selector Carousel & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          
          <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetToCurrentMonth}
              className="px-2.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center space-x-1 shrink-0"
              title="Voltar ao mês atual"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoje</span>
            </button>

            {/* Month carousel */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 shadow-inner flex-1 sm:flex-initial justify-between">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 sm:px-3 py-1 text-center min-w-[100px] sm:min-w-[120px]">
                <span className="font-black text-amber-300 text-xs sm:text-sm block truncate">
                  {monthName} {selectedYear}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  {dashboardData?.totalAulasMes || 0} aulas
                </span>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Manual Check-in & Reset Month Buttons (Staff Only - Hidden for Recepção) */}
          {!isReadOnly ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(dashboardData?.totalCheckinsMes || 0) > 0 && (
                <button
                  onClick={handleResetMonthCheckins}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold text-xs transition-all shrink-0"
                  title="Zerar todas as presenças e faltas deste mês"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zerar Mês</span>
                </button>
              )}
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Presença Manual</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-extrabold shrink-0">
              <Eye className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Modo Recepção (Somente Leitura & Impressão)</span>
            </div>
          )}

        </div>

      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Aulas no Mês */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 sm:space-x-4 shadow-xl">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Aulas no Mês</p>
            <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">
              {dashboardData?.totalAulasOcorridas || 0}{' '}
              <span className="text-[10px] sm:text-xs text-slate-500 font-normal">/ {dashboardData?.totalAulasMes || 0}</span>
            </h3>
          </div>
        </div>

        {/* Total de Check-ins */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 sm:space-x-4 shadow-xl">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Presenças</p>
            <h3 className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">
              {dashboardData?.totalCheckinsMes || 0}
            </h3>
          </div>
        </div>

        {/* Média de Alunos por Aula */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3 sm:space-x-4 shadow-xl">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Média / Treino</p>
            <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">
              {dashboardData?.mediaAlunosPorAula || 0}
            </h3>
          </div>
        </div>

        {/* Alerta de Faltas (>3 faltas) */}
        <div 
          onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
          className={`p-4 sm:p-5 rounded-3xl border flex items-center space-x-3 sm:space-x-4 shadow-xl cursor-pointer transition-all ${
            alertStudents.length > 0
              ? 'bg-red-950/40 border-red-500/40 hover:border-red-500'
              : 'bg-slate-900/90 border-slate-800'
          }`}
          title="Clique para filtrar apenas os alunos em alerta"
        >
          <div className={`p-2.5 sm:p-3.5 rounded-2xl border shrink-0 ${
            alertStudents.length > 0 
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">Alerta (&gt;3 faltas)</p>
            <h3 className={`text-lg sm:text-2xl font-black mt-0.5 truncate ${alertStudents.length > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {alertStudents.length}{' '}
              <span className="text-[10px] sm:text-xs text-slate-500 font-normal">
                {alertStudents.length === 1 ? 'aluno' : 'alunos'}
              </span>
            </h3>
          </div>
        </div>

      </div>

      {/* Critical Alert Banner (>3 Faltas) */}
      {alertStudents.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/40 border border-red-500/50 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Atenção: {alertStudents.length} {alertStudents.length === 1 ? 'aluno ultrapassou' : 'alunos ultrapassaram'} 3 faltas em {monthName}!
                </h4>
                <p className="text-[11px] text-red-300/80">
                  Risco de evasão dos treinos de Capoeira.
                </p>
              </div>
            </div>

            <button
              onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                filterAlertsOnly
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30'
              }`}
            >
              {filterAlertsOnly ? 'Ver Todos os Alunos' : 'Filtrar Alunos em Alerta'}
            </button>
          </div>

          {/* Quick list of students in alert with WhatsApp link */}
          <div className="flex flex-wrap gap-2 pt-1">
            {alertStudents.map((s) => (
              <div
                key={s.user.id}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-red-500/30 text-xs"
              >
                <span className="font-extrabold text-white truncate max-w-[120px]">{s.user.name}</span>
                <span className="text-amber-400 font-semibold">&quot;{s.user.nickname}&quot;</span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[10px]">
                  {s.faltasMes} faltas
                </span>
                {s.user.phone && (
                  <a
                    href={getWhatsAppBirthdayLink(s.user.phone, s.user.name, s.user.nickname)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    title="Mandar mensagem no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Toolbar: Tabs, Search, Export & Email (Mobile Optimized) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-3xl border border-slate-800 backdrop-blur-md w-full">
        
        {/* Sub-Tabs: Geral vs Chamada do Dia */}
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('geral')}
            className={`py-2 px-3 rounded-2xl text-xs font-extrabold transition-all text-center ${
              activeSubTab === 'geral'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveSubTab('chamada_dia')}
            className={`py-2 px-3 rounded-2xl text-xs font-extrabold transition-all text-center ${
              activeSubTab === 'chamada_dia'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Chamada do Dia
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou apelido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Export, PDF & WhatsApp Recepção Buttons - 3 Equal Columns on Mobile */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
            title="Baixar planilha para abrir no Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Excel</span>
          </button>

          <button
            onClick={() => handleGeneratePDF(activeSubTab === 'chamada_dia' ? 'dia' : 'mes')}
            className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-sky-300 text-xs font-bold transition-all shadow-sm"
            title="Imprimir ou Salvar em PDF (Dia ou Mês)"
          >
            <Printer className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">PDF / Imprimir</span>
          </button>

          <button
            onClick={handleOpenWhatsAppModal}
            className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold transition-all shadow-sm"
            title="Enviar chamada e PDF para o WhatsApp da Recepção"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">WhatsApp Recepção</span>
          </button>
        </div>

      </div>

      {/* Main Content: Tab 1 - Visão Geral do Mês */}
      {activeSubTab === 'geral' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full">
          
          {/* MOBILE CARDS VIEW (Block on mobile, hidden on desktop: Zero horizontal scroll!) */}
          <div className="block md:hidden p-3 space-y-3">
            {filteredStats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhum aluno encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredStats.map((st) => {
                const cordInfo = getCordInfo(st.user.corda);

                return (
                  <div
                    key={st.user.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      st.alertaFaltas
                        ? 'bg-red-950/20 border-red-500/40 ring-1 ring-red-500/30'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    {/* Card Header: Avatar + Name + Corda Tag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs overflow-hidden shrink-0 shadow-sm"
                          style={{ border: `2px solid ${cordInfo.color}` }}
                        >
                          {st.user.avatar_url ? (
                            <img src={st.user.avatar_url} alt={st.user.nickname} className="w-full h-full object-cover" />
                          ) : (
                            <span className="bg-slate-900 w-full h-full flex items-center justify-center">
                              {st.user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-white text-sm truncate">
                            {st.user.name}
                          </h4>
                          <p className="text-amber-400 font-bold text-xs truncate">
                            &quot;{st.user.nickname}&quot;
                          </p>
                        </div>
                      </div>

                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm shrink-0"
                        style={{
                          backgroundColor: cordInfo.color,
                          color: cordInfo.textColor,
                          border: '1px solid rgba(0,0,0,0.15)',
                        }}
                      >
                        {st.user.corda}
                      </span>
                    </div>

                    {/* Stats 4-Grid for Mobile */}
                    <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800/80 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Presenças</span>
                        <span className="font-black text-emerald-400 text-sm">{st.presencasMes}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Faltas</span>
                        <span className={`font-black text-sm ${st.alertaFaltas ? 'text-red-400' : 'text-slate-300'}`}>
                          {st.faltasMes}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Freq. %</span>
                        <span className="font-black text-white text-sm">{st.frequenciaPct}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Ano</span>
                        <span className="font-bold text-amber-300 text-sm">{st.presencasAno}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          st.frequenciaPct >= 75
                            ? 'bg-emerald-500'
                            : st.frequenciaPct >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${st.frequenciaPct}%` }}
                      />
                    </div>

                    {/* Status Alert Banner */}
                    {st.alertaFaltas && (
                      <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-red-300 font-bold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>Alerta: {st.faltasMes} faltas no mês!</span>
                        </div>
                        {st.user.phone && (
                          <a
                            href={getWhatsAppBirthdayLink(st.user.phone, st.user.name, st.user.nickname)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center space-x-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className={`grid ${isReadOnly ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pt-1 border-t border-slate-900`}>
                      <button
                        onClick={() => setViewingDatesStudent(st)}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold text-center border border-slate-800 transition-all"
                      >
                        Ver Datas ({st.datasComparecidas.length})
                      </button>

                      {!isReadOnly && (
                        <button
                          onClick={() => {
                            setManualStudentId(st.user.id);
                            setIsManualModalOpen(true);
                          }}
                          className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold text-center border border-emerald-500/30 transition-all flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Presença</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP TABLE VIEW (Hidden on mobile, visible on md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Aluno / Apelido</th>
                  <th className="px-6 py-4">Graduação (Corda)</th>
                  <th className="px-6 py-4 text-center">Presenças ({monthName})</th>
                  <th className="px-6 py-4 text-center">Faltas no Mês</th>
                  <th className="px-6 py-4 text-center">% Frequência</th>
                  <th className="px-6 py-4 text-center">Total Ano</th>
                  <th className="px-6 py-4">Situação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Nenhum aluno encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredStats.map((st) => {
                    const cordInfo = getCordInfo(st.user.corda);

                    return (
                      <tr 
                        key={st.user.id} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          st.alertaFaltas ? 'bg-red-950/10' : ''
                        }`}
                      >
                        
                        {/* Student Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 shadow-sm"
                              style={{ border: `2px solid ${cordInfo.color}` }}
                            >
                              {st.user.avatar_url ? (
                                <img src={st.user.avatar_url} alt={st.user.nickname} className="w-full h-full object-cover" />
                              ) : (
                                <span className="bg-slate-950 w-full h-full flex items-center justify-center">
                                  {st.user.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-white text-sm block">
                                {st.user.name}
                              </span>
                              <span className="text-amber-400 font-semibold">
                                &quot;{st.user.nickname}&quot;
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cord */}
                        <td className="px-6 py-4">
                          <span 
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm inline-block"
                            style={{
                              backgroundColor: cordInfo.color,
                              color: cordInfo.textColor,
                              border: '1px solid rgba(0,0,0,0.15)',
                            }}
                          >
                            {st.user.corda}
                          </span>
                        </td>

                        {/* Presenças Mês */}
                        <td className="px-6 py-4 text-center font-extrabold text-emerald-400 text-sm">
                          {st.presencasMes}
                        </td>

                        {/* Faltas Mês */}
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-sm ${st.alertaFaltas ? 'text-red-400' : 'text-slate-300'}`}>
                            {st.faltasMes}
                          </span>
                        </td>

                        {/* % Frequência */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-extrabold text-white text-xs">
                              {st.frequenciaPct}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  st.frequenciaPct >= 75
                                    ? 'bg-emerald-500'
                                    : st.frequenciaPct >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${st.frequenciaPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Total Ano */}
                        <td className="px-6 py-4 text-center font-bold text-amber-300">
                          {st.presencasAno}
                        </td>

                        {/* Situação */}
                        <td className="px-6 py-4">
                          {st.alertaFaltas ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Alerta (&gt;3 faltas)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              <span>Regular</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setViewingDatesStudent(st)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                              title="Ver todas as datas em que o aluno compareceu"
                            >
                              Ver Datas ({st.datasComparecidas.length})
                            </button>

                            {!isReadOnly && (
                              <button
                                onClick={() => {
                                  setManualStudentId(st.user.id);
                                  setIsManualModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                                title="Adicionar presença manual para este aluno"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Main Content: Tab 2 - Chamada do Dia */}
      {activeSubTab === 'chamada_dia' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 w-full">
          
          {/* Day selection header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Chamada Rápida da Aula
              </h3>
              <p className="text-xs text-slate-400">
                {isReadOnly
                  ? 'Visualização da lista de presença do dia (somente leitura para Recepção)'
                  : 'Toque no aluno para marcar ou desmarcar presença na hora'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 shrink-0">Data:</span>
              <input
                type="date"
                value={selectedDayDate}
                onChange={(e) => setSelectedDayDate(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
              />
              <button
                onClick={() => handleGeneratePDF('dia')}
                className="px-3 py-1.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center space-x-1 shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF do Dia</span>
              </button>
            </div>
          </div>

          {/* Quick Roll Call Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {capoeiraStudents.map((st) => {
              const isPresent = dayCheckinUserIds.has(st.id);
              const cordInfo = getCordInfo(st.corda);

              return (
                <div
                  key={st.id}
                  onClick={() => !isReadOnly && handleToggleCheckinForStudent(st.id, selectedDayDate, isPresent)}
                  className={`p-3 rounded-2xl border transition-all ${isReadOnly ? 'cursor-default' : 'cursor-pointer'} flex items-center justify-between select-none ${
                    isPresent
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ border: `2px solid ${cordInfo.color}` }}
                    >
                      {st.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-extrabold truncate ${isPresent ? 'text-white' : 'text-slate-300'}`}>
                        {st.name}
                      </p>
                      <p className="text-[10px] text-amber-400 truncate font-semibold">
                        &quot;{st.nickname}&quot;
                      </p>
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-xl transition-all shrink-0 ${
                    isPresent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Modal: Manual Check-in */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Lançar Presença Manual</h3>
                  <p className="text-xs text-slate-400">Aluno sem celular ou sem internet</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualCheckin} className="p-5 space-y-4">
              {manualError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {manualError}
                </div>
              )}

              {/* Student selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Selecione o Aluno *
                </label>
                <select
                  required
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                >
                  <option value="">Selecione um integrante...</option>
                  {capoeiraStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} (&quot;{st.nickname}&quot;) - Corda: {st.corda}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Data do Treino *
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aluno sem celular / Treino especial"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {manualLoading ? 'Salvando...' : 'Confirmar Presença'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Send Attendance Report & PDF to Recepção WhatsApp */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg max-h-[90vh] bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Enviar Chamada para Recepção</h3>
                  <p className="text-xs text-slate-400">
                    Gere o PDF e envie pelo WhatsApp para a equipe da Recepção
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Step 1: Choose Report Type (Day vs Month) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  1. Qual lista você deseja enviar?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportScope('dia')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      reportScope === 'dia'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-extrabold block">Chamada do Dia</span>
                    <span className="text-[10px] text-emerald-300 font-semibold">
                      Data: {selectedDayDate.split('-').reverse().join('/')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportScope('mes')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      reportScope === 'mes'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-extrabold block">Relatório do Mês</span>
                    <span className="text-[10px] text-amber-300 font-semibold">
                      {monthName}/{selectedYear}
                    </span>
                  </button>
                </div>

                {reportScope === 'dia' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-xs text-slate-400">Alterar data da chamada:</span>
                    <input
                      type="date"
                      value={selectedDayDate}
                      onChange={(e) => setSelectedDayDate(e.target.value)}
                      className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Step 2: Generate PDF File */}
              <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>2. Arquivo PDF Oficial ({reportScope === 'dia' ? 'Chamada do Dia' : 'Frequência do Mês'})</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gere ou salve o PDF para anexar na conversa do WhatsApp
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGeneratePDF(reportScope)}
                  className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shrink-0 shadow-md transition-all"
                >
                  Baixar / Ver PDF
                </button>
              </div>

              {/* Step 3: Select Recepção Members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase">
                    3. Selecionar Pessoas da Recepção ({selectedRecepcaoIds.length}/{recepcaoUsers.length})
                  </label>
                  {recepcaoUsers.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRecepcaoIds(
                          selectedRecepcaoIds.length === recepcaoUsers.length
                            ? []
                            : recepcaoUsers.map((r) => r.id)
                        )
                      }
                      className="text-[11px] text-emerald-400 hover:underline font-bold"
                    >
                      {selectedRecepcaoIds.length === recepcaoUsers.length
                        ? 'Desmarcar todos'
                        : 'Selecionar todos'}
                    </button>
                  )}
                </div>

                {recepcaoUsers.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                    <p className="font-bold">Nenhuma pessoa cadastrada com a função &quot;RECEPÇÃO&quot; ainda.</p>
                    <p className="text-[11px] text-slate-400">
                      Vá na aba <strong>Alunos / Gestão</strong>, edite ou cadastre as pessoas da portaria/recepção e mude a Função delas para <strong>RECEPÇÃO</strong>. Elas aparecerão automaticamente aqui!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recepcaoUsers.map((rec) => {
                      const isSelected = selectedRecepcaoIds.includes(rec.id);
                      const wasSent = sentRecepcaoIds.includes(rec.id);
                      return (
                        <div
                          key={rec.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                            isSelected
                              ? 'bg-slate-950 border-emerald-500/40'
                              : 'bg-slate-950/40 border-slate-800 opacity-60'
                          }`}
                        >
                          <label className="flex items-center space-x-3 cursor-pointer min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRecepcaoSelection(rec.id)}
                              className="w-4 h-4 rounded accent-emerald-500"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold text-white block truncate">
                                {rec.name} (&quot;{rec.nickname}&quot;)
                              </span>
                              <span className="text-[11px] font-mono text-emerald-400 block">
                                WhatsApp: {rec.phone}
                              </span>
                            </div>
                          </label>

                          {isSelected && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppToPhone(rec.phone, rec.name, rec.id)}
                              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 shrink-0 transition-all ${
                                wasSent
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{wasSent ? 'Enviado ✓ (Reenviar)' : 'Enviar WhatsApp'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional Custom Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Observação na Mensagem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Liberar entrada dos alunos listados acima..."
                  value={customWhatsAppNotes}
                  onChange={(e) => setCustomWhatsAppNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500"
                />
              </div>

              {/* Optional Extra Phone Input */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase">
                  Ou enviar para outro número de WhatsApp avulso:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="DDD + Número (ex: 41999999999)"
                    value={extraWhatsAppPhone}
                    onChange={(e) => setExtraWhatsAppPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    disabled={!extraWhatsAppPhone.trim()}
                    onClick={() => handleSendWhatsAppToPhone(extraWhatsAppPhone, 'Recepção')}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs shrink-0 flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Concluído
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: View attended dates for a specific student */}
      {viewingDatesStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="min-w-0 flex-1 pr-2">
                <h4 className="text-base font-extrabold text-white truncate">
                  Presenças em {monthName}
                </h4>
                <p className="text-xs text-amber-400 font-bold truncate">
                  {viewingDatesStudent.user.name} (&quot;{viewingDatesStudent.user.nickname}&quot;)
                </p>
              </div>
              <button
                onClick={() => setViewingDatesStudent(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Datas confirmadas ({viewingDatesStudent.datasComparecidas.length} presenças):
              </p>
              {viewingDatesStudent.datasComparecidas.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Nenhuma presença registrada neste mês.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {viewingDatesStudent.datasComparecidas.map((d) => (
                    <div
                      key={d}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center justify-between"
                    >
                      <span>{formatDateShortBR(d)}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingDatesStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
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

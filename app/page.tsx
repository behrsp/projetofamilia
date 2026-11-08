'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, Song, InstrumentLesson, GroupEvent, PhotoItem, StudentRequest, AttendanceDashboardData } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { AuthForm } from '@/components/AuthForm';
import { CordLegendModal } from '@/components/CordLegendModal';
import { SongViewer } from '@/components/SongViewer';
import { SongFormModal } from '@/components/SongFormModal';
import { InstrumentPlayer } from '@/components/InstrumentPlayer';
import { EventCard } from '@/components/EventCard';
import { EventFormModal } from '@/components/EventFormModal';
import { PhotoGallery } from '@/components/PhotoGallery';
import { RequestsManager } from '@/components/RequestsManager';
import { ChatSupportModal } from '@/components/ChatSupportModal';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ProfileModal } from '@/components/ProfileModal';
import { BirthdaysCard } from '@/components/BirthdaysCard';
import { AttendanceDashboard } from '@/components/AttendanceDashboard';
import { StudentCheckinCard } from '@/components/StudentCheckinCard';
import { parseBirthdate, isBirthdayToday, MONTH_NAMES } from '@/lib/dateUtils';
import { Cake, Sparkles, ChevronRight, PartyPopper } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('musicas');

  // Modals state
  const [isCordModalOpen, setIsCordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Data states
  const [songs, setSongs] = useState<Song[]>([]);
  const [instruments, setInstruments] = useState<InstrumentLesson[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Checkin & Attendance states
  const [attendanceDashboard, setAttendanceDashboard] = useState<AttendanceDashboardData | null>(null);
  const [studentCheckinState, setStudentCheckinState] = useState<{
    isCheckedInToday: boolean;
    todayCheckinTime?: string;
    myMonthCount: number;
    myYearCount: number;
    isTodayClassDay: boolean;
    weekdayName: string;
  }>({
    isCheckedInToday: false,
    myMonthCount: 0,
    myYearCount: 0,
    isTodayClassDay: false,
    weekdayName: '',
  });

  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());

  // Check auth on load
  const checkAuth = async () => {
    try {
      // Trigger database init check
      await fetch('/api/init');

      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.role === 'RECEPCAO') {
          setActiveTab('presenca');
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch checkin data
  const fetchCheckinData = async (m = attendanceMonth, y = attendanceYear) => {
    try {
      const res = await fetch(`/api/checkin?month=${m}&year=${y}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.isStaff) {
        setAttendanceDashboard(data.dashboard);
      } else {
        setStudentCheckinState({
          isCheckedInToday: data.isCheckedInToday,
          todayCheckinTime: data.todayCheckin?.created_at,
          myMonthCount: data.myMonthCount,
          myYearCount: data.myYearCount,
          isTodayClassDay: data.isTodayClassDay,
          weekdayName: data.weekdayName,
        });
      }
    } catch (err) {
      console.error('Error fetching checkin data:', err);
    }
  };

  // Fetch data when user is authenticated
  const fetchData = async () => {
    if (!user) return;
    try {
      const [songsRes, instRes, evtRes, photoRes, reqRes, stRes] = await Promise.all([
        fetch('/api/songs').then((r) => r.json()).catch(() => ({})),
        fetch('/api/instruments').then((r) => r.json()).catch(() => ({})),
        fetch('/api/events').then((r) => r.json()).catch(() => ({})),
        fetch('/api/photos').then((r) => r.json()).catch(() => ({})),
        fetch('/api/requests').then((r) => r.json()).catch(() => ({})),
        fetch('/api/students').then((r) => r.json()).catch(() => ({})),
      ]);

      if (songsRes.songs) setSongs(songsRes.songs);
      if (instRes.instruments) setInstruments(instRes.instruments);
      if (evtRes.events) setEvents(evtRes.events);
      if (photoRes.photos) setPhotos(photoRes.photos);
      if (reqRes.requests) setRequests(reqRes.requests);
      if (stRes.students) setStudents(stRes.students);

      await fetchCheckinData();
    } catch (err) {
      console.error('Error fetching application data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, activeTab]);

  // Auth actions
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    const res = await fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar perfil.');
    }
    await checkAuth();
    await fetchData();
  };

  // Song Actions
  const handleSaveSong = async (songData: Partial<Song>) => {
    const method = editingSong ? 'PUT' : 'POST';
    const url = editingSong ? `/api/songs/${editingSong.id}` : '/api/songs';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(songData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar música.');
    }

    setEditingSong(null);
    await fetchData();
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta música?')) return;
    await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  // Instrument Actions
  const handleAddInstrument = async (data: any) => {
    const res = await fetch('/api/instruments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar vídeo.');
    }
    await fetchData();
  };

  const handleDeleteInstrument = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula em vídeo?')) return;
    await fetch(`/api/instruments/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  // Event Actions
  const handleSaveEvent = async (data: Partial<GroupEvent>) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar evento.');
    }
    await fetchData();
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleRsvp = async (eventId: string, status: 'VOU' | 'NAO_SEI' | 'NAO_VOU') => {
    await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchData();
  };

  // Photo Actions
  const handleAddPhoto = async (data: { title: string; photo_url: string }) => {
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao enviar foto.');
    }
    await fetchData();
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;
    await fetch(`/api/photos/${id}`, { method: 'DELETE' });
    await fetchData();
  };

  // Request Actions
  const handleAddRequest = async (data: any) => {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar pedido.');
    }
    await fetchData();
  };

  const handleRespondRequest = async (id: string, status: 'ACCEPTED' | 'REJECTED', reason: string) => {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, response_reason: reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar pedido.');
    }
    await fetchData();
  };

  // Student Admin Actions - Update whole student profile
  const handleAddStudent = async (data: any) => {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao cadastrar aluno.');
    }
    await fetchData();
  };

  const handleUpdateStudent = async (id: string, data: any) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar aluno.');
    }
    if (user && user.id === id) {
      await checkAuth();
    }
    await fetchData();
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir o cadastro deste aluno?')) return;
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erro ao excluir aluno.');
      return;
    }
    await fetchData();
  };

  // Compute Birthday information for Navbar badge & quick header
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentMonthName = MONTH_NAMES[now.getMonth()];

  const thisMonthBirthdays = useMemo(() => {
    return students.filter((s) => {
      if (s.role === 'RECEPCAO') return false;
      const parsed = parseBirthdate(s.birthdate);
      return parsed && parsed.month === currentMonthNum;
    });
  }, [students, currentMonthNum]);

  const todayBirthdays = useMemo(() => {
    return students.filter((s) => s.role !== 'RECEPCAO' && isBirthdayToday(s.birthdate, now));
  }, [students, now]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-bold text-sm tracking-wider">Carregando ABADÁ Capoeira...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        onLoginSuccess={(u) => {
          setUser(u);
          if (u.role === 'RECEPCAO') {
            setActiveTab('presenca');
          }
        }}
      />
    );
  }

  const isStaff = user.role === 'ADMIN' || user.role === 'PROFESSOR';
  const isRecepcao = user.role === 'RECEPCAO';
  const canViewPresenca = isStaff || isRecepcao;
  const effectiveTab = isRecepcao ? 'presenca' : activeTab;

  // Calculate cord counts for modal (excluding Recepção)
  const studentCordCounts: Record<string, number> = {};
  students.forEach((s) => {
    if (s.role !== 'RECEPCAO') {
      studentCordCounts[s.corda] = (studentCordCounts[s.corda] || 0) + 1;
    }
  });

  return (
    <div className={`min-h-screen flex flex-col bg-slate-950 text-slate-100 ${isRecepcao ? 'pb-10' : 'pb-24 lg:pb-10'} overflow-x-hidden w-full max-w-full`}>
      
      {/* Navigation Bar */}
      <Navbar
        user={user}
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenCordGuide={() => setIsCordModalOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        birthdayCount={thisMonthBirthdays.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
        
        {/* Student Check-in Card (Visible only to regular students) */}
        {!canViewPresenca && (
          <StudentCheckinCard
            user={user}
            isCheckedInToday={studentCheckinState.isCheckedInToday}
            todayCheckinTime={studentCheckinState.todayCheckinTime}
            isTodayClassDay={studentCheckinState.isTodayClassDay}
            weekdayName={studentCheckinState.weekdayName}
            myMonthCount={studentCheckinState.myMonthCount}
            myYearCount={studentCheckinState.myYearCount}
            onCheckinSuccess={async () => {
              await fetchCheckinData();
            }}
          />
        )}

        {/* Quick Birthday Banner when on other tabs (Hidden for Recepção) */}
        {!isRecepcao && effectiveTab !== 'aniversarios' && effectiveTab !== 'presenca' && effectiveTab !== 'dashboard' && (
          <div 
            onClick={() => setActiveTab('aniversarios')}
            className="cursor-pointer group rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 shadow-xl transition-all duration-300 flex items-center justify-between gap-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform shrink-0">
                <Cake className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Aniversariantes de {currentMonthName}
                  </span>
                  {todayBirthdays.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-500 text-white animate-pulse">
                      Hoje tem festa!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5 break-words">
                  {todayBirthdays.length > 0
                    ? `🎉 ${todayBirthdays.map((b) => b.nickname || b.name).join(', ')} faz aniversário hoje! Toque para conferir todos do mês.`
                    : `${thisMonthBirthdays.length} capoeiristas comemoram aniversário neste mês. Toque para ver o mural!`}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 shrink-0">
              <span>Abrir Mural</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}

        {/* Tab: Presença & Frequência (Admins, Professores e Recepção) */}
        {effectiveTab === 'presenca' && canViewPresenca && (
          <AttendanceDashboard
            students={students}
            userRole={user.role}
            dashboardData={attendanceDashboard}
            selectedMonth={attendanceMonth}
            selectedYear={attendanceYear}
            onMonthChange={(m, y) => {
              setAttendanceMonth(m);
              setAttendanceYear(y);
              fetchCheckinData(m, y);
            }}
            onRefresh={async () => {
              await fetchCheckinData(attendanceMonth, attendanceYear);
            }}
          />
        )}

        {/* Tab: Aniversariantes do Mês (Liberado para alunos, professores e admins) */}
        {!isRecepcao && effectiveTab === 'aniversarios' && (
          <BirthdaysCard
            students={students.filter((s) => s.role !== 'RECEPCAO')}
            isStandalone={true}
          />
        )}

        {/* Tab: Músicas */}
        {!isRecepcao && effectiveTab === 'musicas' && (
          <SongViewer
            songs={songs}
            user={user}
            onAddSong={() => {
              setEditingSong(null);
              setIsSongModalOpen(true);
            }}
            onEditSong={(song) => {
              setEditingSong(song);
              setIsSongModalOpen(true);
            }}
            onDeleteSong={handleDeleteSong}
          />
        )}

        {/* Tab: Instrumentos */}
        {!isRecepcao && effectiveTab === 'instrumentos' && (
          <InstrumentPlayer
            instruments={instruments}
            user={user}
            onAddInstrument={handleAddInstrument}
            onDeleteInstrument={handleDeleteInstrument}
          />
        )}

        {/* Tab: Eventos */}
        {!isRecepcao && effectiveTab === 'eventos' && (
          <EventCard
            events={events}
            user={user}
            onAddEvent={() => setIsEventModalOpen(true)}
            onDeleteEvent={handleDeleteEvent}
            onRsvp={handleRsvp}
          />
        )}

        {/* Tab: Fotos */}
        {!isRecepcao && effectiveTab === 'fotos' && (
          <PhotoGallery
            photos={photos}
            user={user}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        )}

        {/* Tab: Pedidos */}
        {!isRecepcao && effectiveTab === 'pedidos' && (
          <RequestsManager
            requests={requests}
            user={user}
            onAddRequest={handleAddRequest}
            onRespondRequest={handleRespondRequest}
          />
        )}

        {/* Tab: Graduação */}
        {!isRecepcao && effectiveTab === 'graduacao' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
              <h2 className="text-2xl font-extrabold text-white">Sistema de Graduações ABADÁ Capoeira</h2>
              <p className="text-sm text-slate-300 max-w-2xl mx-auto">
                Conheça todas as cordas, cores, simbolismos da natureza e a hierarquia oficial da escola ABADÁ-Capoeira.
              </p>
              <button
                onClick={() => setIsCordModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                Abrir Informativo das Cordas & Graduações
              </button>
            </div>
          </div>
        )}

        {/* Tab: Mensageiro Suporte */}
        {!isRecepcao && effectiveTab === 'mensageiro' && (
          <ChatSupportModal
            user={user}
            studentsList={students}
          />
        )}

        {/* Tab: Dashboard Alunos (Staff only) */}
        {!isRecepcao && effectiveTab === 'dashboard' && isStaff && (
          <AdminDashboard
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenCordGuide={() => setIsCordModalOpen(true)}
          />
        )}

      </main>

      {/* Global Modals */}
      <CordLegendModal
        isOpen={isCordModalOpen}
        onClose={() => setIsCordModalOpen(false)}
        studentCounts={studentCordCounts}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateProfile={handleUpdateProfile}
      />

      <SongFormModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        onSave={handleSaveSong}
        initialSong={editingSong}
      />

      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
      />

    </div>
  );
}

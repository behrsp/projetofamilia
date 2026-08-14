'use client';

import React, { useState, useEffect } from 'react';
import { User, Song, InstrumentLesson, GroupEvent, PhotoItem, StudentRequest } from '@/lib/types';
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

  // Check auth on load
  const checkAuth = async () => {
    try {
      // Trigger database init check
      await fetch('/api/init');

      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
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

  // Fetch data when user is authenticated
  const fetchData = async () => {
    if (!user) return;
    try {
      const [songsRes, instRes, evtRes, photoRes, reqRes] = await Promise.all([
        fetch('/api/songs').then((r) => r.json()),
        fetch('/api/instruments').then((r) => r.json()),
        fetch('/api/events').then((r) => r.json()),
        fetch('/api/photos').then((r) => r.json()),
        fetch('/api/requests').then((r) => r.json()),
      ]);

      if (songsRes.songs) setSongs(songsRes.songs);
      if (instRes.instruments) setInstruments(instRes.instruments);
      if (evtRes.events) setEvents(evtRes.events);
      if (photoRes.photos) setPhotos(photoRes.photos);
      if (reqRes.requests) setRequests(reqRes.requests);

      // Staff specific data
      if (user.role === 'ADMIN' || user.role === 'PROFESSOR') {
        const stRes = await fetch('/api/students').then((r) => r.json());
        if (stRes.students) setStudents(stRes.students);
      }
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

  // Student Admin Actions
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

  const handleUpdateStudent = async (id: string, data: Partial<User>) => {
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao atualizar aluno.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-emerald-400 font-bold text-sm tracking-wider">Carregando ABADÁ Capoeira...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onLoginSuccess={(u) => setUser(u)} />;
  }

  // Calculate cord counts for modal
  const studentCordCounts: Record<string, number> = {};
  students.forEach((s) => {
    studentCordCounts[s.corda] = (studentCordCounts[s.corda] || 0) + 1;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20 lg:pb-10">
      
      {/* Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenCordGuide={() => setIsCordModalOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab: Músicas */}
        {activeTab === 'musicas' && (
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
        {activeTab === 'instrumentos' && (
          <InstrumentPlayer
            instruments={instruments}
            user={user}
            onAddInstrument={handleAddInstrument}
            onDeleteInstrument={handleDeleteInstrument}
          />
        )}

        {/* Tab: Eventos */}
        {activeTab === 'eventos' && (
          <EventCard
            events={events}
            user={user}
            onAddEvent={() => setIsEventModalOpen(true)}
            onDeleteEvent={handleDeleteEvent}
            onRsvp={handleRsvp}
          />
        )}

        {/* Tab: Fotos */}
        {activeTab === 'fotos' && (
          <PhotoGallery
            photos={photos}
            user={user}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        )}

        {/* Tab: Pedidos */}
        {activeTab === 'pedidos' && (
          <RequestsManager
            requests={requests}
            user={user}
            onAddRequest={handleAddRequest}
            onRespondRequest={handleRespondRequest}
          />
        )}

        {/* Tab: Graduação */}
        {activeTab === 'graduacao' && (
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
        {activeTab === 'mensageiro' && (
          <ChatSupportModal
            user={user}
            studentsList={students}
          />
        )}

        {/* Tab: Dashboard Alunos (Staff only) */}
        {activeTab === 'dashboard' && (user.role === 'ADMIN' || user.role === 'PROFESSOR') && (
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

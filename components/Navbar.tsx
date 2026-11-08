'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { 
  Music, 
  Video, 
  Calendar, 
  Camera, 
  ClipboardList, 
  Award, 
  MessageSquare, 
  Users, 
  LogOut, 
  User as UserIcon,
  Cake,
  ClipboardCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenCordGuide: () => void;
  onLogout: () => void;
  unreadCount?: number;
  birthdayCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenCordGuide,
  onLogout,
  unreadCount = 0,
  birthdayCount = 0,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  const isRecepcao = user?.role === 'RECEPCAO';
  const canViewPresenca = isStaff || isRecepcao;

  // Desktop All Tabs
  const navItems = [
    { id: 'musicas', label: 'Músicas', mobileLabel: 'Músicas', icon: Music },
    { id: 'instrumentos', label: 'Instrumentos', mobileLabel: 'Aulas', icon: Video },
    { id: 'eventos', label: 'Eventos', mobileLabel: 'Eventos', icon: Calendar },
    { id: 'aniversarios', label: 'Aniversariantes', mobileLabel: 'Nívers', icon: Cake, badge: birthdayCount },
    { id: 'fotos', label: 'Fotos', mobileLabel: 'Fotos', icon: Camera },
    { id: 'pedidos', label: 'Pedidos', mobileLabel: 'Pedidos', icon: ClipboardList },
    { id: 'graduacao', label: 'Graduação', mobileLabel: 'Cordas', icon: Award },
    { id: 'mensageiro', label: 'Mensageiro', mobileLabel: 'Chat', icon: MessageSquare, badge: unreadCount },
  ];

  if (canViewPresenca) {
    navItems.push({ id: 'presenca', label: 'Chamada & Frequência', mobileLabel: 'Chamada', icon: ClipboardCheck });
  }
  if (isStaff) {
    navItems.push({ id: 'dashboard', label: 'Alunos / Gestão', mobileLabel: 'Gestão', icon: Users });
  }

  // Primary 4 tabs for mobile bottom bar
  const primaryMobileTabs = [
    { id: 'musicas', label: 'Músicas', icon: Music },
    { id: 'instrumentos', label: 'Aulas', icon: Video },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'aniversarios', label: 'Nívers', icon: Cake, badge: birthdayCount },
  ];

  // Secondary tabs inside the "Mais" Mobile Drawer
  const secondaryMobileTabs = [
    ...(canViewPresenca ? [
      { id: 'presenca', label: 'Chamada & Frequência', desc: 'Presenças, faltas, PDF e Excel', icon: ClipboardCheck, isStaffOnly: true },
    ] : []),
    ...(isStaff ? [
      { id: 'dashboard', label: 'Gestão de Alunos', desc: 'Cadastros, cordas e senhas', icon: Users, isStaffOnly: true },
    ] : []),
    { id: 'fotos', label: 'Fotos & Galeria', desc: 'Mural de fotos dos treinos', icon: Camera },
    { id: 'pedidos', label: 'Pedidos de Treino', desc: 'Solicite tutoriais e toques', icon: ClipboardList },
    { id: 'graduacao', label: 'Cordas ABADÁ', desc: 'Significados e hierarquia', icon: Award },
    { id: 'mensageiro', label: 'Mensageiro Suporte', desc: 'Chat direto com professores', icon: MessageSquare, badge: unreadCount },
  ];

  const isSecondaryActive = secondaryMobileTabs.some((t) => t.id === activeTab);
  const activeSecondaryItem = secondaryMobileTabs.find((t) => t.id === activeTab);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-emerald-500/20 shadow-xl w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          
          {/* Top Row: Logo & User Profile */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            
            {/* Logo & Title */}
            <div 
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group min-w-0"
              onClick={() => setActiveTab(isRecepcao ? 'presenca' : 'musicas')}
            >
              <div className="relative h-9 w-12 sm:h-11 sm:w-14 rounded-xl overflow-hidden p-1 border border-emerald-500/40 bg-slate-900 group-hover:border-emerald-400 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0">
                <img 
                  src="/abada-logo.png" 
                  alt="ABADÁ Capoeira" 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="min-w-0">
                <h1 className="font-extrabold text-sm sm:text-xl bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200 bg-clip-text text-transparent leading-tight truncate">
                  ABADÁ CAPOEIRA
                </h1>
                <p className="text-[9px] sm:text-[11px] text-emerald-400/80 font-semibold tracking-widest uppercase truncate">
                  {isRecepcao ? 'Painel Exclusivo da Recepção' : 'Acervo & Gestão'}
                </p>
              </div>
            </div>

            {/* User Profile & Actions (Always visible on the right) */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {user ? (
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <div
                    onClick={isRecepcao ? undefined : onOpenProfile}
                    className={`flex items-center space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 ${
                      isRecepcao ? '' : 'hover:border-emerald-500/50 cursor-pointer'
                    } transition-all text-left group`}
                    title={isRecepcao ? 'Recepção' : 'Ver Meu Perfil'}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate max-w-[130px]">
                        {user.name}
                      </p>
                      <p className={`text-[10px] font-semibold truncate max-w-[130px] ${
                        isRecepcao ? 'text-sky-400 uppercase font-extrabold' : 'text-amber-400'
                      }`}>
                        {isRecepcao ? 'Recepção' : user.corda}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Sair da conta"
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all shrink-0"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Second Row (Desktop Only): Navigation Tabs Bar - Hidden for Recepção */}
          {!isRecepcao && (
            <nav className="hidden lg:flex items-center flex-wrap gap-1.5 py-2 border-t border-slate-800/80">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-1 bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          )}

        </div>
      </header>

      {/* Mobile App Bottom Navigation Bar - Hidden for Recepção (Recepção only sees Chamada) */}
      {!isRecepcao && (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-emerald-500/20 px-1 py-1 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-2xl w-full max-w-full">
        <div className="grid grid-cols-5 w-full items-center">
          
          {primaryMobileTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileDrawerOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-300 bg-emerald-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 scale-105' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 truncate font-medium">
                  {item.label}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-0.5 right-2 bg-amber-500 text-slate-950 font-black text-[9px] min-w-[15px] h-3.5 flex items-center justify-center rounded-full animate-pulse shadow-md">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* 5th Button: Mais / Menu */}
          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              isSecondaryActive || isMobileDrawerOpen
                ? 'text-emerald-300 bg-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className={`w-5 h-5 ${isSecondaryActive || isMobileDrawerOpen ? 'text-emerald-400 scale-105' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 truncate font-medium">
              {isSecondaryActive ? (activeSecondaryItem?.label.split(' ')[0] || 'Mais') : 'Mais'}
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-2 bg-amber-500 text-slate-950 font-black text-[9px] min-w-[15px] h-3.5 flex items-center justify-center rounded-full animate-pulse shadow-md">
                {unreadCount}
              </span>
            )}
          </button>

        </div>
      </nav>
      )}

      {/* Mobile Drawer (Bottom Sheet) for Secondary Tabs */}
      {!isRecepcao && isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          
          {/* Backdrop Click to close */}
          <div 
            className="flex-1" 
            onClick={() => setIsMobileDrawerOpen(false)} 
          />

          {/* Sheet Container */}
          <div className="bg-slate-900 border-t border-emerald-500/40 rounded-t-3xl shadow-2xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto w-full">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Mais Opções do App</h3>
                  <p className="text-[11px] text-slate-400">Navegue pelas outras áreas e ferramentas</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="space-y-2">
              {secondaryMobileTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left ${
                      isActive
                        ? 'bg-emerald-500/20 text-white border border-emerald-500/40 shadow-lg'
                        : 'bg-slate-950/70 hover:bg-slate-800 text-slate-200 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${
                        isActive 
                          ? 'bg-emerald-500 text-slate-950' 
                          : item.isStaffOnly 
                          ? 'bg-amber-500/10 text-amber-400' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-sm">{item.label}</span>
                          {item.isStaffOnly && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300">
                              Gestão
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.badge && item.badge > 0 ? (
                        <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      ) : null}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions inside drawer */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenProfile();
                }}
                className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold"
              >
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span>Meu Perfil</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onLogout();
                }}
                className="flex items-center justify-center space-x-2 py-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

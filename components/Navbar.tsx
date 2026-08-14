'use client';

import React from 'react';
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
  User as UserIcon 
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenCordGuide: () => void;
  onLogout: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenCordGuide,
  onLogout,
  unreadCount = 0,
}) => {
  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  const navItems = [
    { id: 'musicas', label: 'Músicas', mobileLabel: 'Músicas', icon: Music },
    { id: 'instrumentos', label: 'Instrumentos', mobileLabel: 'Aulas', icon: Video },
    { id: 'eventos', label: 'Eventos', mobileLabel: 'Eventos', icon: Calendar },
    { id: 'fotos', label: 'Fotos', mobileLabel: 'Fotos', icon: Camera },
    { id: 'pedidos', label: 'Pedidos', mobileLabel: 'Pedidos', icon: ClipboardList },
    { id: 'graduacao', label: 'Graduação', mobileLabel: 'Cordas', icon: Award },
    { id: 'mensageiro', label: 'Mensageiro', mobileLabel: 'Chat', icon: MessageSquare, badge: unreadCount },
  ];

  if (isStaff) {
    navItems.push({ id: 'dashboard', label: 'Alunos / Gestão', mobileLabel: 'Gestão', icon: Users });
  }

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-emerald-500/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            
            {/* Logo & Title */}
            <div 
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group"
              onClick={() => setActiveTab('musicas')}
            >
              <div className="relative h-9 w-12 sm:h-12 sm:w-16 rounded-xl sm:rounded-2xl overflow-hidden p-1 border border-emerald-500/40 bg-slate-900 group-hover:border-emerald-400 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center">
                <img 
                  src="/abada-logo.png" 
                  alt="ABADÁ Capoeira" 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-base sm:text-2xl bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200 bg-clip-text text-transparent leading-tight">
                  ABADÁ CAPOEIRA
                </h1>
                <p className="text-[9px] sm:text-xs text-emerald-400/80 font-semibold tracking-widest uppercase">
                  Acervo & Gestão
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="ml-1 bg-amber-500 text-slate-950 font-extrabold text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {user ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenProfile}
                    className="flex items-center space-x-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                        {user.nickname || user.name}
                      </p>
                      <p className="text-[10px] text-amber-400 font-semibold">
                        Corda: {user.corda}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={onLogout}
                    title="Sair da conta"
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile App Bottom Navigation Bar (Fixed at actual bottom of mobile screen) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-emerald-500/20 px-1 py-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-1 flex-col items-center justify-center min-w-[62px] px-2 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-300 bg-emerald-500/20 font-bold border border-emerald-500/30 shadow-md shadow-emerald-500/10 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight font-medium">
                  {item.mobileLabel}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 right-1 bg-amber-500 text-slate-950 font-extrabold text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full animate-pulse shadow-md">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

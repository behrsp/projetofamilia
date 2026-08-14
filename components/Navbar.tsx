'use client';

import React from 'react';
import Image from 'next/image';
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
    { id: 'musicas', label: 'Músicas', icon: Music },
    { id: 'instrumentos', label: 'Instrumentos', icon: Video },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'fotos', label: 'Fotos', icon: Camera },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { id: 'graduacao', label: 'Graduação', icon: Award },
    { id: 'mensageiro', label: 'Mensageiro', icon: MessageSquare, badge: unreadCount },
  ];

  if (isStaff) {
    navItems.push({ id: 'dashboard', label: 'Alunos / Gestão', icon: Users });
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-emerald-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('musicas')}
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-emerald-500/50 group-hover:border-emerald-400 transition-all shadow-md shadow-emerald-500/20">
              <Image 
                src="/abada-logo.png" 
                alt="ABADÁ Capoeira" 
                fill 
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-lg sm:text-2xl bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200 bg-clip-text text-transparent">
                ABADÁ CAPOEIRA
              </h1>
              <p className="text-[10px] sm:text-xs text-emerald-400/80 font-medium tracking-wider uppercase">
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
                  className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all text-left group"
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
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
                  isActive ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 right-1 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1 rounded-full animate-bounce">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

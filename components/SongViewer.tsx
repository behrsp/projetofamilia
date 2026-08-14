'use client';

import React, { useState } from 'react';
import { Song, User } from '@/lib/types';
import { 
  Music, 
  Plus, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Search 
} from 'lucide-react';

interface SongViewerProps {
  songs: Song[];
  user: User | null;
  onAddSong: () => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (id: string) => void;
}

export const SongViewer: React.FC<SongViewerProps> = ({
  songs,
  user,
  onAddSong,
  onEditSong,
  onDeleteSong,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [fontSize, setFontSize] = useState<number>(20); // Default 20px
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.lyrics.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, autor ou trecho da letra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
          />
        </div>

        {/* Add Song Button (Staff Only) */}
        {isStaff && (
          <button
            onClick={onAddSong}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Cadastrar Música</span>
          </button>
        )}
      </div>

      {/* Song Grid */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
          <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Nenhuma música encontrada</h3>
          <p className="text-xs text-slate-500 mt-1">Tente buscar por outro termo ou cadastre novas músicas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className="flex flex-col justify-between p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-xl group hover:shadow-emerald-500/10"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {song.title}
                  </h3>
                  {isStaff && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditSong(song)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                        title="Editar música"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSong(song.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Excluir música"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-amber-400 mt-0.5">
                  Autor: {song.author}
                </p>

                {/* Lyrics Preview */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <p className="text-xs text-slate-300 italic line-clamp-4 whitespace-pre-line font-mono">
                    {song.lyrics}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                {song.link_url ? (
                  <a
                    href={song.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvir Áudio/Vídeo</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">Sem link externo</span>
                )}

                <button
                  onClick={() => setSelectedSong(song)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expandir Letra</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen / Expanded Lyrics Modal */}
      {selectedSong && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl ${isFullscreen ? 'p-0' : ''}`}>
          <div className={`relative w-full max-w-4xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isFullscreen ? 'h-full rounded-none border-none' : 'max-h-[90vh]'}`}>
            
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white">{selectedSong.title}</h2>
                <p className="text-xs text-amber-400 font-medium">Autor: {selectedSong.author}</p>
              </div>

              {/* Font Controls & Fullscreen */}
              <div className="flex items-center space-x-2">
                
                {/* Font Minus */}
                <button
                  onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                  title="Diminuir Fonte"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span>A-</span>
                </button>

                {/* Font Indicator */}
                <span className="text-xs text-slate-400 font-mono px-1">
                  {fontSize}px
                </span>

                {/* Font Plus */}
                <button
                  onClick={() => setFontSize((prev) => Math.min(48, prev + 2))}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                  title="Aumentar Fonte"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>A+</span>
                </button>

                {/* Toggle Fullscreen */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                  title={isFullscreen ? 'Sair do Modo Tela Cheia' : 'Modo Tela Cheia'}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                {/* Close Modal */}
                <button
                  onClick={() => setSelectedSong(null)}
                  className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lyrics Content area */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-950/60 scrollbar-thin scrollbar-thumb-emerald-500/40">
              {selectedSong.link_url && (
                <div className="mb-6 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Link de áudio/vídeo anexado:</span>
                  <a
                    href={selectedSong.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 text-xs text-emerald-400 hover:underline font-bold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir Link Externo</span>
                  </a>
                </div>
              )}

              <div
                className="whitespace-pre-line text-emerald-100 font-sans leading-relaxed tracking-wide transition-all"
                style={{ fontSize: `${fontSize}px` }}
              >
                {selectedSong.lyrics}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

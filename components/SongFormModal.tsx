'use client';

import React, { useState, useEffect } from 'react';
import { Song } from '@/lib/types';
import { X, Music, Save } from 'lucide-react';

interface SongFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (songData: Partial<Song>) => Promise<void>;
  initialSong?: Song | null;
}

export const SongFormModal: React.FC<SongFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSong,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialSong) {
      setTitle(initialSong.title);
      setAuthor(initialSong.author);
      setLyrics(initialSong.lyrics);
      setLinkUrl(initialSong.link_url || '');
    } else {
      setTitle('');
      setAuthor('');
      setLyrics('');
      setLinkUrl('');
    }
    setError('');
  }, [initialSong, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lyrics.trim()) {
      setError('Por favor, informe pelo menos o título e a letra.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        title,
        author: author || 'Tradicional ABADÁ',
        lyrics,
        link_url: linkUrl,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar música.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {initialSong ? 'Editar Música' : 'Cadastrar Nova Música'}
              </h2>
              <p className="text-xs text-slate-400">Somente professores e administradores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Título da Música *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Marinheiro Só / Aó Aó"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Autor / Mestre
            </label>
            <input
              type="text"
              placeholder="Ex: Mestre Camisa / Domínio Público"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Link de Áudio / Vídeo (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Lyrics Campo Grande */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Letra da Música (Campo Grande) *
            </label>
            <textarea
              rows={8}
              required
              placeholder="Digite ou cole aqui a letra completa da música..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono leading-relaxed"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Música'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

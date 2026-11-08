'use client';

import React, { useState } from 'react';
import { InstrumentLesson, InstrumentCategory, User } from '@/lib/types';
import { 
  Video, 
  Plus, 
  Download, 
  Trash2, 
  Upload, 
  Clock, 
  X, 
  Play, 
  Check 
} from 'lucide-react';

interface InstrumentPlayerProps {
  instruments: InstrumentLesson[];
  user: User | null;
  onAddInstrument: (data: { category: InstrumentCategory; title: string; video_url: string; duration: string }) => Promise<void>;
  onDeleteInstrument: (id: string) => Promise<void>;
}

export const InstrumentPlayer: React.FC<InstrumentPlayerProps> = ({
  instruments,
  user,
  onAddInstrument,
  onDeleteInstrument,
}) => {
  const [activeCategory, setActiveCategory] = useState<InstrumentCategory>('Berimbau');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<InstrumentCategory>('Berimbau');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';
  const categories: InstrumentCategory[] = ['Berimbau', 'Pandeiro', 'Atabaque', 'Agogô', 'Cuia'];

  const filteredInstruments = instruments.filter(
    (item) => item.category === activeCategory
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // File size sanity check (under 50MB for smooth client upload)
      if (file.size > 50 * 1024 * 1024) {
        setError('O vídeo deve ter no máximo 50MB e 2 minutos de duração.');
        return;
      }

      setVideoFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoPreview) {
      setError('Por favor, informe o título e selecione um vídeo.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAddInstrument({
        category,
        title,
        video_url: videoPreview,
        duration: 'máx 2 min',
      });
      setIsModalOpen(false);
      setTitle('');
      setVideoFile(null);
      setVideoPreview('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar vídeo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Tabs & Upload Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 p-3.5 sm:p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        
        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-initial text-center ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Upload Button */}
        {isStaff && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all shrink-0"
          >
            <Upload className="w-5 h-5" />
            <span>Postar Vídeo ({activeCategory})</span>
          </button>
        )}
      </div>

      {/* Instrument Video Cards */}
      {filteredInstruments.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
          <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Nenhum vídeo em {activeCategory}</h3>
          <p className="text-xs text-slate-500 mt-1">Os professores irão postar aulas em vídeo nesta categoria em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstruments.map((item) => (
            <div
              key={item.id}
              className="flex flex-col bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl hover:border-emerald-500/40 transition-all group"
            >
              {/* Video Player Container */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video
                  src={item.video_url}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card Footer */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{item.duration || 'Máx 2 min'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  
                  {/* Download Video Button */}
                  <a
                    href={item.video_url}
                    download={`abada-${item.category}-${item.title}.mp4`}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                    title="Baixar para seu dispositivo"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Baixar Vídeo</span>
                  </a>

                  {/* Delete Button (Staff Only) */}
                  {isStaff && (
                    <button
                      onClick={() => onDeleteInstrument(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      title="Excluir aula em vídeo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-slate-950 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Postar Vídeo de Instrumento</h3>
                  <p className="text-xs text-amber-400 font-medium">Duração máxima: 2 minutos</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoria do Instrumento
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InstrumentCategory)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Título da Aula / Toque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Toque de São Bento Grande de Angola"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Arquivo de Vídeo (Upload do Dispositivo) *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Selecione um arquivo de vídeo do seu celular ou computador (máx 2 min).
                </p>
              </div>

              {videoPreview && (
                <div className="mt-2 rounded-2xl overflow-hidden border border-slate-800 max-h-40 bg-black">
                  <video src={videoPreview} controls className="w-full h-full object-contain" />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading ? 'Enviando Vídeo...' : 'Publicar Vídeo'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

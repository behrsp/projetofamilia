'use client';

import React, { useState } from 'react';
import { PhotoItem, User } from '@/lib/types';
import { 
  Camera, 
  Plus, 
  Clock, 
  Trash2, 
  Upload, 
  X, 
  Maximize2 
} from 'lucide-react';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  user: User | null;
  onAddPhoto: (data: { title: string; photo_url: string }) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  user,
  onAddPhoto,
  onDeletePhoto,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isStaff = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photoUrl) {
      setError('Por favor, informe a legenda e selecione uma foto.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onAddPhoto({ title, photo_url: photoUrl });
      setIsModalOpen(false);
      setTitle('');
      setPhotoUrl('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar foto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white">Galeria de Fotos dos Treinos & Eventos</h2>
          <p className="text-xs text-amber-400 font-medium flex items-center space-x-1 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Retenção automática de 90 dias para economia de armazenamento</span>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Upload className="w-5 h-5" />
          <span>Postar Foto</span>
        </button>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">Nenhuma foto postada</h3>
          <p className="text-xs text-slate-500 mt-1">Seja o primeiro a postar registros dos treinos e rodas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-xl aspect-square flex flex-col justify-end"
            >
              {/* Photo Image */}
              <img
                src={item.photo_url}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Days left badge */}
              <div className="absolute top-3 left-3 z-10">
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-950/80 text-amber-300 border border-amber-400/30 backdrop-blur-md flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{item.days_left ?? 90}d restantes</span>
                </span>
              </div>

              {/* Delete button (Staff only) */}
              {isStaff && (
                <button
                  onClick={() => onDeletePhoto(item.id)}
                  className="absolute top-3 right-3 z-10 p-2 text-slate-300 hover:text-red-400 bg-slate-950/80 hover:bg-slate-900 rounded-full border border-slate-800 transition-all"
                  title="Excluir Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Title & Click to Expand */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>
                <button
                  onClick={() => setSelectedPhoto(item)}
                  className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 transition-all shrink-0 ml-2"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Postar Foto</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Legenda / Título da Foto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Treino de Roda no Parque"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Selecionar Foto (Dispositivo) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white"
                />
              </div>

              {photoUrl && (
                <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800">
                  <img src={photoUrl} alt="Prévia" className="w-full h-full object-cover" />
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
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Postar Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white bg-slate-900 rounded-full border border-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl border border-slate-800"
            />
            <p className="mt-4 text-center font-bold text-white text-base">
              {selectedPhoto.title}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

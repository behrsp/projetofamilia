'use client';

import React, { useState } from 'react';
import { GroupEvent } from '@/lib/types';
import { X, Calendar, Save, Image as ImageIcon } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<GroupEvent>) => Promise<void>;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !eventDate.trim()) {
      setError('Por favor, preencha o título, descrição e data do evento.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        title,
        description,
        event_date: eventDate,
        banner_url: bannerUrl,
      });
      onClose();
      setTitle('');
      setDescription('');
      setEventDate('');
      setBannerUrl('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Criar Evento do Grupo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Batizado & Troca de Cordas 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Data e Horário *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 25 de Outubro de 2026 - 15:00h"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Imagem do Banner (Upload do Dispositivo)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="w-full px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white"
            />
          </div>

          {bannerUrl && (
            <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-800">
              <img src={bannerUrl} alt="Prévia" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição do Evento *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Digite o local, orientações sobre vestimenta, programação e convidados..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Publicando...' : 'Publicar Evento'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

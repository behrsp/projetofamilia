'use client';

import React from 'react';
import { ABADA_CORDAS } from '@/lib/types';
import { X, Award, Info, Sparkles } from 'lucide-react';

interface CordLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentCounts?: Record<string, number>;
}

export const CordLegendModal: React.FC<CordLegendModalProps> = ({
  isOpen,
  onClose,
  studentCounts = {},
}) => {
  if (!isOpen) return null;

  const childSystem = [
    { age: '2 e 3 anos', corda: 'Pontas crua-amarela' },
    { age: '4 anos', corda: 'Pontas amarela' },
    { age: '5 anos', corda: 'Pontas amarela-laranja' },
    { age: '6 anos', corda: 'Pontas laranja' },
    { age: '7 anos', corda: 'Pontas laranja-azul' },
    { age: '8 anos', corda: 'Pontas azul' },
    { age: '9 anos', corda: 'Corda crua-amarela' },
    { age: '10 anos', corda: 'Corda amarela' },
    { age: '11 anos', corda: 'Corda crua-laranja' },
    { age: '12 anos', corda: 'Corda amarela-laranja' },
    { age: '13 anos', corda: 'Corda laranja' },
    { age: '14 anos', corda: 'Corda crua-azul' },
    { age: '15 anos', corda: 'Corda amarela-azul' },
    { age: '16 anos', corda: 'Corda laranja-azul' },
    { age: '17 anos', corda: 'Corda azul - Aluno Graduado' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Sistema de Graduações ABADÁ-Capoeira</h2>
              <p className="text-xs text-slate-400">Referência oficial: Natureza & Elementos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 scrollbar-thin scrollbar-thumb-emerald-500/30">
          
          {/* Introductory Concept */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-slate-300 text-sm leading-relaxed flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Nosso sistema de graduação na <strong>Abadá-Capoeira</strong> tem como referência a natureza. 
              Cada cor predominante representa um elemento com características distintas, relacionando-se com os reinos vegetal, animal e mineral.
            </p>
          </div>

          {/* Adult Cord List */}
          <div>
            <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Sistema de Graduação de Adultos</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ABADA_CORDAS.map((item, idx) => {
                const count = studentCounts[item.name] || 0;
                return (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-all group"
                  >
                    {/* Cord Color Pill */}
                    <div
                      className="w-8 h-8 rounded-full border border-slate-700 shadow-md shrink-0 flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: item.color, color: item.textColor }}
                      title={item.name}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                          {item.level}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {count} Aluno{count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Children Cord List */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-lg font-bold text-emerald-400 mb-4">
              Sistema de Graduação Infantil (2 a 17 anos)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {childSystem.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs"
                >
                  <span className="font-bold text-amber-300">{item.age}</span>
                  <span className="text-slate-300">{item.corda}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
          >
            Fechar Informativo
          </button>
        </div>

      </div>
    </div>
  );
};

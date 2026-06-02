import React, { useState } from 'react';
import { Badge } from '../types';
import { Icon } from './Icon';

interface BadgesGridProps {
  badges: Badge[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  return (
    <div className="bg-white border border-brand-malva-light/40 rounded-2xl p-6" id="badges-grid">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
          <Icon name="Crown" className="text-brand-malva" />
          Mis Insignias de Hábito
        </h2>
        <p className="text-xs text-brand-dark/60">Desbloquea insignias al registrar tus hábitos saludables. Cada insignia nueva aumenta tus puntos de canje.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {badges.map((badge) => {
          const isUnlocked = !!badge.unlockedAt;

          return (
            <button
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all relative group cursor-pointer focus:outline-none ${
                isUnlocked
                  ? 'border-brand-malva-light bg-gradient-to-b from-white to-brand-malva-light/20 shadow-sm hover:shadow-md'
                  : 'border-brand-malva-light/20 bg-slate-50 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Badge Visual Design */}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                isUnlocked
                  ? `bg-gradient-to-tr ${badge.color} text-brand-dark`
                  : 'bg-brand-malva-light/30 text-brand-dark/40'
              }`}>
                <Icon name={badge.icon} size={24} />
              </div>

              <span className={`text-xs font-bold leading-tight ${isUnlocked ? 'text-brand-dark font-extrabold' : 'text-brand-dark/40'}`}>
                {badge.name}
              </span>

              {isUnlocked ? (
                <span className="text-[9px] font-mono font-medium text-brand-dark/50 mt-1 block">
                  Desbloqueado
                </span>
              ) : (
                <div className="absolute top-2 right-2 text-brand-dark/40 p-0.5 bg-white/80 rounded-full border border-brand-malva-light/30">
                  <Icon name="Lock" size={10} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Badge Explanatory Tooltip Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl border border-brand-malva-light animate-in fade-in zoom-in duration-200">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
              selectedBadge.unlockedAt
                ? `bg-gradient-to-tr ${selectedBadge.color} text-brand-dark shadow-md`
                : 'bg-brand-malva-light/20 text-brand-dark/40 border border-brand-malva-light/50'
            }`}>
              <Icon name={selectedBadge.icon} size={36} />
            </div>

            <h3 className="font-bold text-brand-dark text-lg">{selectedBadge.name}</h3>
            
            <span className="text-[10px] uppercase font-mono tracking-wider text-brand-dark/60 mt-1 inline-block bg-brand-malva-light/40 px-2 py-0.5 rounded-full border border-brand-malva-light/55">
              Área: {selectedBadge.area.replace('_', ' ')}
            </span>

            <p className="text-brand-dark/80 text-xs mt-3 leading-relaxed">
              {selectedBadge.description}
            </p>

            {selectedBadge.unlockedAt ? (
              <div className="mt-4 p-2 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 border border-emerald-100">
                <Icon name="Check" size={12} />
                ¡Conseguido el {new Date(selectedBadge.unlockedAt).toLocaleDateString('es-ES')}!
              </div>
            ) : (
              <div className="mt-4 p-2 bg-brand-malva-light/20 text-brand-dark/60 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 border border-brand-malva-light/40">
                <Icon name="Lock" size={12} />
                Aún bloqueado. ¡Regístralo para ganarlo!
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2 bg-brand-dark hover:bg-brand-malva text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Volver al tablero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

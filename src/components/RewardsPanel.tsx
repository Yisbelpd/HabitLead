import React, { useState, useEffect } from 'react';
import { Reward } from '../types';
import { Icon } from './Icon';

interface RewardsPanelProps {
  rewards: Reward[];
  availableBadgesCount: number;
  onCanjear: (rewardId: string) => void;
}

export function RewardsPanel({ rewards, availableBadgesCount, onCanjear }: RewardsPanelProps) {
  const [activeReward, setActiveReward] = useState<Reward | null>(null);
  const [breathingState, setBreathingState] = useState<'idle' | 'inhale' | 'exhale'>('idle');
  const [breathingSeconds, setBreathingSeconds] = useState(0);

  // Simple breathing timer for the interactive meditation
  useEffect(() => {
    let timer: any = null;
    if (breathingState !== 'idle') {
      timer = setInterval(() => {
        setBreathingSeconds((prev) => {
          if (breathingState === 'inhale') {
            if (prev >= 4) {
              setBreathingState('exhale');
              return 0;
            }
            return prev + 1;
          } else { // exhale
            if (prev >= 6) {
              setBreathingState('inhale');
              return 0;
            }
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      setBreathingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [breathingState]);

  const startBreathing = () => {
    if (breathingState === 'idle') {
      setBreathingState('inhale');
      setBreathingSeconds(0);
    } else {
      setBreathingState('idle');
    }
  };

  const closeViewer = () => {
    setActiveReward(null);
    setBreathingState('idle');
  };

  return (
    <div className="bg-white border border-brand-malva-light/40 rounded-2xl p-6" id="rewards-panel">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
            <Icon name="Trophy" className="text-brand-malva" />
            Recompensas de Bienestar
          </h2>
          <p className="text-xs text-brand-dark/60">Canjea tus insignias acumuladas por incentivos para tu rutina.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-malva-light/30 text-brand-dark text-xs font-bold rounded-full border border-brand-malva-light/50 w-fit">
          <Icon name="Crown" size={13} className="animate-pulse text-brand-malva" />
          <span>{availableBadgesCount} acumuladas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const typeIcon = reward.type === 'podcast' ? 'Podcast' : reward.type === 'pdf_tips' ? 'FileText' : 'Sparkles';
          const canAfford = availableBadgesCount >= reward.cost;

          return (
            <div
              key={reward.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                reward.unlocked
                  ? 'border-brand-malva bg-gradient-to-tr from-white to-brand-malva-light/20'
                  : 'border-brand-malva-light/30 bg-brand-malva-light/5'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${reward.unlocked ? 'bg-brand-malva text-white shadow-sm' : 'bg-brand-malva-light/20 text-brand-dark/40'}`}>
                    <Icon name={typeIcon} size={18} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-brand-dark/60 font-bold px-2 py-0.5 rounded-full bg-white border border-brand-malva-light/35">
                    {reward.type === 'podcast' ? 'Podcast' : reward.type === 'pdf_tips' ? 'Tips' : 'Audio'}
                  </span>
                </div>

                <h3 className="font-bold text-brand-dark text-sm leading-snug">{reward.title}</h3>
                <p className="text-xs text-brand-dark/70 mt-1 line-clamp-2">{reward.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-malva-light/30 flex items-center justify-between">
                {reward.unlocked ? (
                  <button
                    onClick={() => setActiveReward(reward)}
                    className="w-full text-xs font-bold py-1.5 px-3 rounded-lg bg-brand-malva-light text-brand-dark hover:bg-brand-malva hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="BookOpen" size={13} />
                    Ver contenido
                  </button>
                ) : (
                  <>
                    <span className="text-xs font-bold text-brand-dark/80 flex items-center gap-1">
                      <Icon name="Crown" size={13} className="text-brand-malva" />
                      {reward.cost} insignias
                    </span>
                    <button
                      onClick={() => onCanjear(reward.id)}
                      disabled={!canAfford}
                      className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        canAfford
                          ? 'bg-brand-malva hover:bg-brand-dark text-white shadow-sm shadow-brand-malva/20'
                          : 'bg-slate-200/50 text-slate-400 border border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      <Icon name="Lock" size={12} />
                      Canjear
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Content Viewer inside application (No Mocks!) */}
      {activeReward && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-brand-malva-light animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className={`p-5 text-white flex items-center justify-between bg-gradient-to-r from-brand-dark to-brand-malva`}>
              <div className="flex items-center gap-2">
                <Icon name={activeReward.type === 'podcast' ? 'Podcast' : activeReward.type === 'pdf_tips' ? 'FileText' : 'Sparkles'} size={20} />
                <h3 className="font-bold text-sm sm:text-base leading-none text-white">{activeReward.content.title}</h3>
              </div>
              <button
                onClick={closeViewer}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition-colors cursor-pointer"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeReward.type === 'pdf_tips' && (
                <div className="space-y-3">
                  <p className="text-xs text-brand-dark/60 font-bold mb-2">Consejos del Especialista en Hábitos de Sueño:</p>
                  <div className="bg-brand-malva-light/20 rounded-xl p-4 border border-brand-malva-light/40">
                    {activeReward.content.text?.split('\n').map((line, i) => (
                      <p key={i} className="text-xs text-brand-dark mb-2 leading-relaxed font-medium">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {activeReward.type === 'podcast' && (
                <div className="space-y-4">
                  <div className="p-4 bg-brand-malva-light/25 border border-brand-malva-light/40 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg text-brand-malva shadow-sm">
                      <Icon name="Play" size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark">Reproducción Recomendada</h4>
                      <p className="text-xs text-brand-dark/60">Duración estimada: {activeReward.content.duration}</p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-dark/80 leading-relaxed bg-brand-malva-light/10 p-4 rounded-xl border border-brand-malva-light/20">
                    {activeReward.content.text}
                  </p>
                  <div className="flex justify-end pt-2">
                    <a
                      href={activeReward.content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-brand-malva hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-brand-malva/20"
                    >
                      Ir a Escuchar en Spotify
                    </a>
                  </div>
                </div>
              )}

              {activeReward.type === 'meditacion' && (
                <div className="flex flex-col items-center">
                  <p className="text-xs text-brand-dark/70 text-center mb-6 max-w-sm font-medium">
                    {activeReward.content.text}
                  </p>

                  {/* Meditation Circle Interactive Breathing Guide */}
                  <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                    {/* Pulsing Back Glow */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                      breathingState === 'inhale' ? 'scale-[1.3] bg-brand-malva/30' :
                      breathingState === 'exhale' ? 'scale-100 bg-brand-malva-light/40' : 'scale-75 bg-brand-malva-light/10'
                    }`} />

                    {/* Main Interactive Circle */}
                    <button
                      onClick={startBreathing}
                      className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-1000 outline-none focus:outline-none cursor-pointer ${
                        breathingState === 'inhale' ? 'scale-[1.1] bg-gradient-to-tr from-brand-malva to-brand-dark shadow-lg shadow-brand-malva/20' :
                        breathingState === 'exhale' ? 'scale-90 bg-gradient-to-tr from-brand-dark to-brand-malva' : 'bg-brand-malva hover:bg-brand-dark shadow-sm'
                      }`}
                    >
                      {breathingState === 'idle' ? (
                        <>
                          <Icon name="Play" size={24} />
                          <span className="text-[10px] uppercase font-extrabold tracking-wider mt-1">Iniciar</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs uppercase font-extrabold tracking-wider">
                            {breathingState === 'inhale' ? 'Inhala' : 'Exhala'}
                          </span>
                          <span className="text-2xl font-bold mt-1 font-mono">{breathingSeconds}s</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-brand-dark/60 italic text-center max-w-xs">
                    {breathingState === 'idle' 
                      ? 'Haz clic en el círculo para dar inicio a tu respiración rítmica.' 
                      : breathingState === 'inhale' ? 'Llena tus pulmones con aire fresco y expande tu abdomen...'
                      : 'Suelta todo el aire suavemente por la boca, liberando tensiones...'
                    }
                  </p>

                  {breathingState !== 'idle' && (
                    <button
                      onClick={startBreathing}
                      className="mt-6 px-3 py-1.5 bg-brand-malva-light/40 hover:bg-brand-malva-light/80 text-brand-dark text-xs rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Pausar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeViewer}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-brand-malva-light text-brand-dark text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

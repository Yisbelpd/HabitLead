import React, { useState } from 'react';
import { HabitArea, HabitLog } from '../types';
import { Icon } from './Icon';

interface HabitCardProps {
  key?: any;
  area: {
    id: HabitArea;
    name: string;
    icon: string;
    color: string;
    description: string;
    placeholder: string;
    options?: string[];
  };
  currentLogs?: HabitLog[];
  onSave: (areaId: HabitArea, value: string) => void;
  onClear: (logId: string) => void;
}

export function HabitCard({ area, currentLogs = [], onSave, onClear }: HabitCardProps) {
  const [customValue, setCustomValue] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const completedCount = currentLogs.length;
  const isCompleted = completedCount > 0;

  const handleSuggestionToggle = (option: string) => {
    const existingLog = currentLogs.find(log => log.value === option);
    if (existingLog) {
      onClear(existingLog.id);
    } else {
      onSave(area.id, option);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customValue.trim()) {
      onSave(area.id, customValue.trim());
      setCustomValue('');
      setShowCustomForm(false);
    }
  };

  // Color dynamic assignment based on our brand guidelines
  const isPink = area.color === 'pink';
  const colorClasses = isPink
    ? {
        borderActive: 'border-brand-malva bg-white shadow-xl shadow-brand-malva/5',
        badge: 'bg-brand-malva text-white font-bold',
        text: 'text-brand-malva',
        selectedOption: 'bg-brand-malva/10 border-brand-malva-light/60 text-brand-malva',
        unselectedOption: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700',
        primaryBtn: 'bg-brand-malva hover:bg-brand-dark hover:scale-[1.01] text-white'
      }
    : {
        borderActive: 'border-brand-dark bg-white shadow-xl shadow-brand-dark/5',
        badge: 'bg-brand-dark text-white font-bold',
        text: 'text-brand-dark',
        selectedOption: 'bg-brand-dark/10 border-brand-malva-light/30 text-brand-dark',
        unselectedOption: 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700',
        primaryBtn: 'bg-brand-dark hover:bg-brand-malva hover:scale-[1.01] text-white'
      };

  return (
    <div
      id={`habit-card-${area.id}`}
      className={`p-5 rounded-2xl border transition-all duration-300 ${
        isCompleted 
          ? `${colorClasses.borderActive}` 
          : 'border-zinc-200 bg-white shadow-sm hover:border-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3">
          <div className={`p-3 rounded-xl transition-colors ${isCompleted ? colorClasses.badge : 'bg-zinc-100 text-zinc-500'}`}>
            <Icon name={area.icon} size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-950 leading-tight">{area.name}</h3>
              {completedCount > 0 && (
                <span className="text-[10px] bg-brand-malva-light/50 text-brand-dark font-extrabold px-2 py-0.5 rounded-full select-none">
                  {completedCount} completado{completedCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{area.description}</p>
          </div>
        </div>
      </div>

      {/* Habits/Options checklist */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hábitos recomendados:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {area.options?.map((option, i) => {
            const isOptionChecked = currentLogs.some(log => log.value === option);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionToggle(option)}
                className={`text-xs p-2.5 rounded-xl border font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                  isOptionChecked ? colorClasses.selectedOption : colorClasses.unselectedOption
                }`}
              >
                <span className="truncate pr-1">{option}</span>
                <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  isOptionChecked 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-white border-zinc-300'
                }`}>
                  {isOptionChecked && <Icon name="Check" size={10} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Logged Entries List */}
      {currentLogs.filter(log => !area.options?.includes(log.value)).length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Hábitos personalizados hoy:</p>
          <div className="space-y-1.5">
            {currentLogs
              .filter(log => !area.options?.includes(log.value))
              .map((log) => (
                <div key={log.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-100 p-2 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-700 truncate">{log.value}</span>
                  </div>
                  <button
                    onClick={() => onClear(log.id)}
                    className="p-1 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 rounded transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Custom habit addition input / form */}
      <div className="mt-4 pt-3 border-t border-zinc-100">
        {!showCustomForm ? (
          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="w-full py-2 border border-dashed border-zinc-300 hover:border-zinc-400 text-zinc-500 hover:text-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50 transition-all"
          >
            <Icon name="Plus" size={13} />
            Añadir hábito personalizado
          </button>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={area.placeholder}
              className="flex-1 text-xs px-3 py-2 border border-zinc-300 focus:border-brand-malva rounded-xl focus:outline-none placeholder:text-zinc-400 text-zinc-950 bg-white transition-all"
              required
              autoFocus
            />
            <button
              type="submit"
              className={`text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-sm ${colorClasses.primaryBtn}`}
            >
              Añadir
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomForm(false);
                setCustomValue('');
              }}
              className="text-xs px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

    </div>
  );
}

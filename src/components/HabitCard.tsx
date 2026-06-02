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
  currentLog: HabitLog | null;
  onSave: (areaId: HabitArea, value: string) => void;
  onClear: (logId: string) => void;
}

export function HabitCard({ area, currentLog, onSave, onClear }: HabitCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const isCompleted = !!currentLog;

  const handleQuickSelect = (option: string) => {
    onSave(area.id, option);
    setIsEditing(false);
    setCustomValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customValue.trim()) {
      onSave(area.id, customValue.trim());
      setIsEditing(false);
      setCustomValue('');
    }
  };

  // Color dynamic assignment based on our brand guidelines
  const isPink = area.color === 'pink';
  const colorClasses = isPink
    ? {
        border: 'border-brand-malva-light/60 hover:border-brand-malva',
        bg: 'bg-brand-malva-light/10',
        badge: 'bg-brand-malva-light text-brand-dark font-semibold',
        text: 'text-brand-malva',
        primaryBtn: 'bg-brand-malva hover:bg-brand-dark text-white shadow-sm',
        iconBg: 'bg-brand-malva-light/20',
        borderCompleted: 'border-brand-malva bg-gradient-to-br from-white to-brand-malva-light/20'
      }
    : {
        border: 'border-brand-malva-light hover:border-brand-dark',
        bg: 'bg-brand-malva-light/15',
        badge: 'bg-brand-dark text-white font-semibold',
        text: 'text-brand-dark',
        primaryBtn: 'bg-brand-dark hover:bg-brand-malva text-white shadow-sm',
        iconBg: 'bg-brand-malva-light/10',
        borderCompleted: 'border-brand-malva-light bg-gradient-to-br from-white to-brand-malva-light/25'
      };

  return (
    <div
      id={`habit-card-${area.id}`}
      className={`p-5 rounded-2xl border transition-all duration-300 ${
        isCompleted 
          ? `${colorClasses.borderCompleted} shadow-sm shadow-brand-malva-light/30` 
          : 'border-brand-malva-light/40 bg-white hover:shadow-md hover:shadow-brand-malva-light/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className={`p-3 rounded-xl ${isCompleted ? colorClasses.badge : 'bg-brand-malva-light/30 text-brand-dark/70'} transition-colors`}>
            <Icon name={area.icon} size={22} />
          </div>
          <div>
            <h3 className="font-bold text-brand-dark leading-tight">{area.name}</h3>
            <p className="text-xs text-brand-dark/60 mt-0.5">{area.description}</p>
          </div>
        </div>

        {isCompleted ? (
          <button
            id={`btn-clear-${area.id}`}
            onClick={() => onClear(currentLog.id)}
            className="text-xs text-brand-dark/60 hover:text-brand-dark p-1.5 bg-brand-malva-light/30 hover:bg-brand-malva-light/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Eliminar registro de hoy"
          >
            <Icon name="X" size={14} />
            <span className="hidden sm:inline">Deshacer</span>
          </button>
        ) : (
          !isEditing && (
            <button
              id={`btn-start-${area.id}`}
              onClick={() => setIsEditing(true)}
              className={`text-brand-dark hover:text-white hover:bg-brand-malva px-3 py-1.5 text-xs font-bold rounded-xl border border-brand-malva-light/70 transition-all flex items-center gap-1.5 cursor-pointer`}
            >
              <Icon name="Plus" size={14} />
              Registrar
            </button>
          )
        )}
      </div>

      {isCompleted && (
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-white border border-brand-malva-light/30">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${isPink ? 'bg-brand-malva text-white' : 'bg-brand-dark text-white'}`}>
              <Icon name="Check" size={12} />
            </div>
            <span className="text-sm font-semibold text-brand-dark">{currentLog.value}</span>
          </div>
          <span className="text-[10px] font-mono text-brand-dark/50 bg-brand-malva-light/20 px-1.5 py-0.5 rounded">Cumplido</span>
        </div>
      )}

      {!isCompleted && isEditing && (
        <div className="mt-4 pt-3 border-t border-brand-malva-light/40">
          <p className="text-xs font-bold text-brand-dark/70 mb-2">Sugerencias rápidas:</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {area.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => handleQuickSelect(option)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-malva-light/20 hover:bg-brand-malva-light/40 border border-brand-malva-light/40 text-brand-dark hover:text-brand-dark font-medium transition-all text-left cursor-pointer"
              >
                {option}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={area.placeholder}
              className="flex-1 text-xs px-3 py-2 border border-brand-malva-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-malva-light focus:border-brand-malva placeholder:text-brand-dark/30 text-brand-dark bg-white transition-all"
              required
            />
            <button
              type="submit"
              className={`text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer ${colorClasses.primaryBtn}`}
            >
              Grabar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs px-2 py-2 rounded-xl bg-brand-malva-light/30 hover:bg-brand-malva-light/60 text-brand-dark transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

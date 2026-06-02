export type HabitArea = 'productiva' | 'actividad_fisica' | 'meditacion' | 'alimentacion' | 'sueno';

export interface HabitLog {
  id: string;
  area: HabitArea;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: string; // Specific detail (e.g. "Yoga", "8 horas", "2L agua")
  timestamp: number;
}

export interface Badge {
  id: string;
  name: string;
  area: HabitArea;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string; // YYYY-MM-DD
}

export interface Reward {
  id: string;
  title: string;
  type: 'podcast' | 'pdf_tips' | 'meditacion';
  description: string;
  cost: number; // Cost in badges
  unlocked: boolean;
  content: {
    title: string;
    text?: string;
    url?: string;
    duration?: string;
  };
}

export interface DailyStats {
  date: string;
  completedAreas: HabitArea[];
}

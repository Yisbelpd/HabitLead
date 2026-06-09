import { Badge, Reward, HabitArea } from './types';

export const HABIT_AREAS: { id: HabitArea; name: string; icon: string; color: string; description: string; placeholder: string; options?: string[] }[] = [
  {
    id: 'productiva',
    name: 'Área Productiva',
    icon: 'Briefcase',
    color: 'lavender',
    description: 'Enfoque, organización o proyectos personales.',
    placeholder: 'Ej. 30 min de lectura, estudio, planificación del día...',
    options: ['Planificación del día', '25 min de Enfoque (Pomodoro)', 'Lectura técnica/personal', 'Organización de tareas']
  },
  {
    id: 'actividad_fisica',
    name: 'Actividad Física',
    icon: 'Dumbbell',
    color: 'pink',
    description: 'Movimiento saludable y conexión con el cuerpo.',
    placeholder: 'Ej. Pilates, Yoga, HIIT, Running...',
    options: ['Pilates en casa', 'Vinyasa Yoga', 'HIIT cardiovascular', 'Running (trote ligero)', 'Estiramientos intensos']
  },
  {
    id: 'meditacion',
    name: 'Meditación',
    icon: 'Sparkles',
    color: 'lavender',
    description: 'Pausa mental, respiración consciente y presencia.',
    placeholder: 'Ej. 10 minutos de respiración profunda...',
    options: ['Respiración guiada (5 min)', 'Meditación de gratitud', 'Atención plena en sonidos', 'Escaneo corporal completo']
  },
  {
    id: 'alimentacion',
    name: 'Alimentación',
    icon: 'Heart',
    color: 'pink',
    description: 'Nutrir tu cuerpo de forma consciente y equilibrada.',
    placeholder: 'Ej. Tomé 2L de agua, comí 3 porciones de verduras...',
    options: ['Hidratación completa (2L+)', 'Desayuno balanceado sin procesados', 'Evitar picar entre horas', 'Plato con abundantes vegetales']
  },
  {
    id: 'sueno',
    name: 'Hábitos de Sueño',
    icon: 'Moon',
    color: 'lavender',
    description: 'Descanso profundo, higiene del sueño y desconexión.',
    placeholder: 'Ej. Dormí 8 horas, dejé pantallas 1h antes...',
    options: ['Dejar pantallas 1h antes', 'Dormir entre 7 y 8 horas', 'Infusión relajante antes de dormir', 'Habitación oscura y fresca']
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge_productiva',
    name: 'Creador de Enfoque',
    area: 'productiva',
    description: 'Registra tu hábito productivo por primera vez.',
    icon: 'Brain',
    color: 'from-purple-100 to-indigo-200'
  },
  {
    id: 'badge_fisica',
    name: 'Cuerpo en Movimiento',
    area: 'actividad_fisica',
    description: 'Inicia tu registro de actividad física (Yoga, Pilates, etc.).',
    icon: 'Zap',
    color: 'from-pink-100 to-rose-200'
  },
  {
    id: 'badge_meditacion',
    name: 'Mente Serena',
    area: 'meditacion',
    description: 'Dedica unos minutos a la calma interior.',
    icon: 'Wind',
    color: 'from-purple-100 to-lavender-200'
  },
  {
    id: 'badge_alimentacion',
    name: 'Nutrición Consciente',
    area: 'alimentacion',
    description: 'Presta atención a lo que ingresa en tu cuerpo.',
    icon: 'Salad',
    color: 'from-pink-100 to-orange-100'
  },
  {
    id: 'badge_sueno',
    name: 'Descanso Sagrado',
    area: 'sueno',
    description: 'Mejora las condiciones de tu noche y despierta renovado.',
    icon: 'CloudMoon',
    color: 'from-indigo-100 to-purple-100'
  },
  {
    id: 'badge_perfeccion',
    name: 'Bienestar Total',
    area: 'meditacion', // Representing balance
    description: 'Consigue completar las 5 áreas saludables en un solo día.',
    icon: 'Crown',
    color: 'from-pink-200 via-lavender-200 to-purple-200'
  }
];

export const INITIAL_REWARDS: Reward[] = [
  {
    id: 'reward_podcast_1',
    title: 'Podcast: Diseña tu mañana ideal',
    type: 'podcast',
    description: 'Audios inspiracionales sobre hacks científicos para estructurar tus primeras horas del día.',
    cost: 3,
    unlocked: false,
    requiredBadgeId: 'badge_streak_7',
    content: {
      title: 'Hacks de Mañana con Ciencia Auténtica',
      duration: '18:40 min',
      text: 'Este episodio de podcast recomendado aborda cómo la liberación natural de cortisol y la luz solar de la mañana regulan tu energía. Te recomendamos escuchar "Ritmo Circadiano y Productividad" en Spotify/YouTube. Tip clave: Evita mirar el móvil los primeros 30 minutos de tu día.',
      url: 'https://open.spotify.com'
    }
  },
  {
    id: 'reward_pdf_tips',
    title: 'Guía PDF: Higiene del Sueño Profundo',
    type: 'pdf_tips',
    description: 'Documento completo con 10 tips prácticos para vencer el insomnio sin recurrir a suplementos.',
    cost: 5,
    unlocked: false,
    requiredBadgeId: 'badge_checkins_30',
    content: {
      title: '10 Claves para el Descanso Regenerativo',
      text: '1. Mantén un horario fijo para levantarte, incluso los fines de semana.\n2. Disminuye la intensidad de las luces de tu hogar a partir de las 8:00 PM.\n3. Evita bebidas estimulantes como el café después de las 2:00 PM.\n4. La temperatura ideal para dormir es de 18-20°C.\n5. Haz respiraciones 4-7-8 al acostarte.\n6. No trabajes desde la cama.\n7. Utiliza bombillas de luz cálida.\n8. Haz de tu dormitorio un santuario analógico.\n9. Los baños tibios antes de dormir inducen el sueño de forma natural.\n10. Si no te duermes en 20 minutos, levántate y haz algo tranquilo.'
    }
  },
  {
    id: 'reward_med_guiada',
    title: 'Audio: Meditación Guiada "Calma Instantánea"',
    type: 'meditacion',
    description: 'Una pista de audio relajante diseñada para resetear tu sistema nervioso en momentos de estrés.',
    cost: 4,
    unlocked: false,
    requiredBadgeId: 'badge_full_balance',
    content: {
      title: 'Sesión de Respiración Diafragmática Coherente',
      duration: '5:00 min',
      text: 'Respira con el círculo visual en pantalla. Inhala durante 4 segundos... mantén el aire... exhala durante 6 segundos. Repite este ciclo de frecuencia cardíaca coherente para disipar la adrenalina acumulada. Hemos activado un temporizador interactivo de relajación para ti.'
    }
  }
];

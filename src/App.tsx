import React, { useState, useEffect } from 'react';
import { HabitArea, HabitLog, Badge, Reward } from './types';
import { HABIT_AREAS, INITIAL_BADGES, INITIAL_REWARDS } from './data';
import { HabitCard } from './components/HabitCard';
import { BadgesGrid } from './components/BadgesGrid';
import { RewardsPanel } from './components/RewardsPanel';
import { Icon } from './components/Icon';
import { Home } from 'lucide-react';

export default function App() {
  // Today's date from environment settings
  const TODAY_STR = '2026-05-30';

  // State
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [username, setUsername] = useState<string>('Invitado');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showNotification, setShowNotification] = useState<{ show: boolean; title: string; desc: string } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('salud_habit_logs');
    const savedRewards = localStorage.getItem('salud_rewards');
    const savedName = localStorage.getItem('salud_username');
    const savedEmail = localStorage.getItem('salud_user_email');

    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedRewards) {
      setRewards(JSON.parse(savedRewards));
    } else {
      setRewards(INITIAL_REWARDS);
    }
    if (savedEmail) {
      setUserEmail(savedEmail);
      setEmailInput(savedEmail);
    }
    if (savedName) {
      setUsername(savedName);
      setNameInput(savedName);
    } else {
      setNameInput(username);
    }
  }, []);

  // Sync state to localStorage
  const saveLogs = (newLogs: HabitLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('salud_habit_logs', JSON.stringify(newLogs));
  };

  const saveRewards = (newRewards: Reward[]) => {
    setRewards(newRewards);
    localStorage.setItem('salud_rewards', JSON.stringify(newRewards));
  };

  const saveUsername = (newName: string) => {
    setUsername(newName);
    localStorage.setItem('salud_username', newName);
  };

  const saveUserEmail = (newEmail: string) => {
    setUserEmail(newEmail);
    localStorage.setItem('salud_user_email', newEmail);
  };

  // Helper lists of dates for selection (past 5 days + today)
  const AVAILABLE_DATES = [
    { label: 'Lun 26', date: '2026-05-26' },
    { label: 'Mar 27', date: '2026-05-27' },
    { label: 'Mié 28', date: '2026-05-28' },
    { label: 'Jue 29', date: '2026-05-29' },
    { label: 'Vie 30 (Hoy)', date: '2026-05-30' }
  ];

  // Helper list to map area logs of the selected date
  const currentLogsMap = logs.filter(log => log.date === selectedDate);

  // Badge unlock calculation
  const getUnlockedBadges = (): Badge[] => {
    return INITIAL_BADGES.map(badge => {
      // Find if this area has ever been completed at least once in history
      if (badge.id === 'badge_perfeccion') {
        // Special badge: Has completed all 5 areas on any single date
        // Find if there is any date where logged areas count is 5
        const logsByDate: { [key: string]: Set<HabitArea> } = {};
        logs.forEach(l => {
          if (!logsByDate[l.date]) {
            logsByDate[l.date] = new Set<HabitArea>();
          }
          logsByDate[l.date].add(l.area);
        });
        
        let perfectDate: string | undefined = undefined;
        for (const [date, areas] of Object.entries(logsByDate)) {
          if (areas.size === 5) {
            perfectDate = date;
            break;
          }
        }

        return {
          ...badge,
          unlockedAt: perfectDate
        };
      } else {
        const matchingLog = logs.find(log => log.area === badge.area);
        return {
          ...badge,
          unlockedAt: matchingLog ? matchingLog.date : undefined
        };
      }
    });
  };

  const unlockedBadges = getUnlockedBadges();
  const unlockedBadgesCount = unlockedBadges.filter(b => !!b.unlockedAt).length;

  // Calculamos las recompensas ya canjeadas para deducir el balance disponible
  const redeemedCost = rewards
    .filter(r => r.unlocked)
    .reduce((sum, r) => sum + r.cost, 0);

  const availableBadgesCount = Math.max(0, unlockedBadgesCount - redeemedCost);

  // Handler for adding/updating helper log
  const handleSaveHabit = (areaId: HabitArea, value: string) => {
    const existingLogIndex = logs.findIndex(log => log.date === selectedDate && log.area === areaId);
    
    let updatedLogs = [...logs];
    if (existingLogIndex >= 0) {
      updatedLogs[existingLogIndex] = {
        ...updatedLogs[existingLogIndex],
        value,
        timestamp: Date.now()
      };
    } else {
      const newLog: HabitLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        area: areaId,
        date: selectedDate,
        completed: true,
        value,
        timestamp: Date.now()
      };
      updatedLogs.push(newLog);
    }

    saveLogs(updatedLogs);

    // Dynamic toast alerts when a badge is unlocked for the very first time!
    // Check if performing this action triggers a new badge unlock
    const previousUnlockedCount = unlockedBadges.filter(b => !!b.unlockedAt).length;
    
    // Quick recalculation with updated logs
    const tempUnlocked = INITIAL_BADGES.map(badge => {
      if (badge.id === 'badge_perfeccion') {
        const logsByDate: { [key: string]: Set<HabitArea> } = {};
        updatedLogs.forEach(l => {
          if (!logsByDate[l.date]) logsByDate[l.date] = new Set<HabitArea>();
          logsByDate[l.date].add(l.area);
        });
        let perfectDate: string | undefined = undefined;
        for (const [date, areas] of Object.entries(logsByDate)) {
          if (areas.size === 5) {
            perfectDate = date;
            break;
          }
        }
        return { ...badge, unlockedAt: perfectDate };
      } else {
        const matchingLog = updatedLogs.find(log => log.area === badge.area);
        return { ...badge, unlockedAt: matchingLog ? matchingLog.date : undefined };
      }
    });
    const currentUnlockedCount = tempUnlocked.filter(b => !!b.unlockedAt).length;

    if (currentUnlockedCount > previousUnlockedCount) {
      // Find the newly unlocked badge
      const newUnlockedBadge = tempUnlocked.find((b, i) => !!b.unlockedAt && !unlockedBadges[i].unlockedAt);
      if (newUnlockedBadge) {
        setShowNotification({
          show: true,
          title: `¡Insignia Desbloqueada: ${newUnlockedBadge.name}!`,
          desc: newUnlockedBadge.description
        });
        setTimeout(() => setShowNotification(null), 5000);
      }
    }
  };

  const handleClearHabit = (logId: string) => {
    const updated = logs.filter(log => log.id !== logId);
    saveLogs(updated);
  };

  // Handler for redeeming a reward
  const handleCanjearReward = (rewardId: string) => {
    const targetReward = rewards.find(r => r.id === rewardId);
    if (!targetReward) return;

    if (availableBadgesCount >= targetReward.cost) {
      const updated = rewards.map(r => {
        if (r.id === rewardId) {
          return { ...r, unlocked: true };
        }
        return r;
      });
      saveRewards(updated);
      
      // Notify conversion success
      setShowNotification({
        show: true,
        title: '¡Canje Exitoso!',
        desc: `Has desbloqueado "${targetReward.title}". Puedes leer e interactuar con su contenido desde el catálogo.`
      });
      setTimeout(() => setShowNotification(null), 4500);
    }
  };

  // Profile management
  const handleSaveName = () => {
    if (nameInput.trim()) {
      saveUsername(nameInput.trim());
      setIsEditingName(false);
    }
  };

  // Complete reset to restart
  const handleResetApp = () => {
    if (confirm('¿Estás seguro de reiniciar todos tus datos de hábitos y recompensas?')) {
      localStorage.removeItem('salud_habit_logs');
      localStorage.removeItem('salud_rewards');
      localStorage.removeItem('salud_username');
      localStorage.removeItem('salud_user_email');
      setLogs([]);
      setRewards(INITIAL_REWARDS);
      setUsername('Invitado');
      setNameInput('Invitado');
      setUserEmail('');
      setEmailInput('');
      setEmailError('');
      setSelectedDate(TODAY_STR);
      setShowNotification({
        show: true,
        title: 'Datos Reiniciados',
        desc: 'Tu tablero se encuentra completamente limpio para comenzar de nuevo.'
      });
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salud_user_email');
    setUserEmail('');
    setEmailInput('');
    setEmailError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setEmailError('El correo de Gmail es obligatorio.');
      return;
    }
    if (!cleanEmail.includes('@')) {
      setEmailError('Por favor introduce un correo válido.');
      return;
    }
    if (!cleanEmail.toLowerCase().endsWith('@gmail.com')) {
      setEmailError('Debe ser un correo con terminación @gmail.com.');
      return;
    }

    setEmailError('');
    const prefix = cleanEmail.split('@')[0];
    const defaultUsername = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    
    saveUserEmail(cleanEmail);
    // If username is currently Default/Invitado, replace with defaultUsername
    if (username === 'Invitado') {
      saveUsername(defaultUsername);
      setNameInput(defaultUsername);
    }

    setShowNotification({
      show: true,
      title: '¡Acceso Correcto!',
      desc: `Bienvenido de vuelta. Tu sesión ha sido iniciada de forma segura.`
    });
    setTimeout(() => setShowNotification(null), 4000);
  };

  // Stats calculation
  const completedTodayCount = currentLogsMap.length;
  const progressPercentage = Math.round((completedTodayCount / 5) * 100);

  // Consecutive active record streak calculation
  const getStreakCount = (): number => {
    const datesWithLogs = Array.from(new Set(logs.map(l => l.date))).sort();
    if (datesWithLogs.length === 0) return 0;
    
    // Quick reverse scan to count consecutive days
    let streak = 0;
    const sortedDates = datesWithLogs.reverse(); // descending
    // Let's check from TODAY
    let checkDateString = TODAY_STR;
    
    // If there is no activity today, verify if there was yesterday to preserve streak
    const hasToday = logs.some(l => l.date === TODAY_STR);
    if (!hasToday) {
      const yesterday = '2026-05-29';
      const hasYesterday = logs.some(l => l.date === yesterday);
      if (hasYesterday) {
        checkDateString = yesterday;
      } else {
        return 0; // Broke streak
      }
    }

    const parseDateObj = (str: string) => {
      const parts = str.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };

    let checkDate = parseDateObj(checkDateString);

    while (true) {
      const formatted = checkDate.toISOString().split('T')[0];
      const hadLogsThisDay = logs.some(l => l.date === formatted);
      if (hadLogsThisDay) {
        streak++;
        // Go 1 day back
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = getStreakCount();
  const shouldShowLanding = !userEmail;

  return (
    <div className="min-h-screen bg-meditation-gradient text-white pb-12 font-sans selection:bg-brand-malva-light/35 selection:text-brand-dark">
      
      {/* Visual Floating Notifications Container */}
      {showNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full bg-white border border-brand-malva rounded-2xl shadow-xl shadow-black/30 p-4 flex gap-3 animate-in fade-in slide-in-from-top-4 duration-300 text-brand-dark">
          <div className="p-2 bg-brand-malva-light/30 text-brand-dark rounded-xl h-fit">
            <Icon name="Crown" size={20} className="animate-bounce text-brand-malva" />
          </div>
          <div>
            <h4 className="font-bold text-brand-dark text-sm">{showNotification.title}</h4>
            <p className="text-xs text-brand-dark/70 mt-0.5 leading-relaxed font-semibold">{showNotification.desc}</p>
          </div>
          <button onClick={() => setShowNotification(null)} className="ml-auto text-brand-dark/40 hover:text-brand-dark self-start cursor-pointer">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {shouldShowLanding ? (
        /* Welcome / Login Landing Screen */
        <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 transition-all duration-500">
          
          {/* Logo container */}
          <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-2xl mb-8 relative hover:scale-105 transition-all">
            <div className="absolute inset-0 bg-brand-malva/20 rounded-3xl blur-md animate-pulse" />
            <svg className="w-24 h-24 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer soft circle drop boundary */}
              <circle cx="50" cy="50" r="44" stroke="url(#logo-stroke-grad)" strokeWidth="1.5" strokeOpacity="0.15" />
              
              {/* Central vertical stem */}
              <path d="M50 32V75" stroke="url(#logo-stroke-grad)" strokeWidth="5.5" strokeLinecap="round" />
              
              {/* Left cradle leaf outer curve */}
              <path d="M47 67C43 67 40 59 40 42C40 36 41 33 41 30" stroke="url(#logo-stroke-grad)" strokeWidth="3" strokeLinecap="round" />
              
              {/* Left cradle leaf inner curve */}
              <path d="M47 57C44 54 42 47 42 38V30" stroke="url(#logo-stroke-grad)" strokeWidth="3" strokeLinecap="round" />
              
              {/* Right cradle leaf outer curve */}
              <path d="M53 67C57 67 60 59 60 42C60 36 59 33 59 30" stroke="url(#logo-stroke-grad)" strokeWidth="3" strokeLinecap="round" />
              
              {/* Right cradle leaf inner curve */}
              <path d="M53 57C56 54 58 47 58 38V30" stroke="url(#logo-stroke-grad)" strokeWidth="3" strokeLinecap="round" />
              
              {/* Back center pointed petal of the Tulip */}
              <path d="M50 18C47 21 46 24 46 26C50 24 50 24 54 26C54 24 53 21 50 18Z" fill="url(#logo-stroke-grad)" fillOpacity="0.55" stroke="url(#logo-stroke-grad)" strokeWidth="2.5" strokeLinejoin="round" />
              
              {/* Left Tulip Petal */}
              <path d="M50 41C44 41 44 26 49 19C47 26 49 34 50 41Z" fill="url(#logo-stroke-grad)" fillOpacity="0.8" stroke="url(#logo-stroke-grad)" strokeWidth="2.5" strokeLinejoin="round" />
              
              {/* Right Tulip Petal overlapping */}
              <path d="M50 41C56 41 56 26 51 19C53 26 51 34 50 41Z" fill="url(#logo-stroke-grad)" fillOpacity="0.9" stroke="url(#logo-stroke-grad)" strokeWidth="2.5" strokeLinejoin="round" />
              
              <defs>
                <linearGradient id="logo-stroke-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#F8F2F8" />
                  <stop offset="75%" stopColor="#E6D7E6" />
                  <stop offset="100%" stopColor="#D4BCD4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Title & Slogan */}
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 text-center">
            HabitLead
          </h1>
          <p className="text-xs font-mono tracking-widest text-brand-malva-light/90 uppercase font-extrabold mb-5 text-center">
            Lidera tu Bienestar • Hábitos Saludables
          </p>

          {/* Subtitle / Description */}
          <p className="text-sm text-brand-malva-light/80 max-w-md text-center leading-relaxed mb-10 font-medium">
            El espacio ideal para registrar tu hidratación, movimiento, sueño, paz mental y alimentación balanceada. Desbloquea insignias exclusivas de la paleta y canjea contenidos de meditación de forma offline.
          </p>

          {/* Onboarding Glassmorphism Login Card */}
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/80 text-brand-dark">
            <h2 className="text-lg font-bold text-brand-dark mb-1 flex items-center gap-2 justify-center">
              <Icon name="Unlock" className="text-brand-malva" size={18} />
              Ingresar a mi Registro
            </h2>
            <p className="text-xs text-brand-dark/60 text-center mb-6">
              Sincroniza y resguarda tu tablero de bienestar con tu correo electrónico de Google.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  Correo de Gmail
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/40 pointer-events-none">
                    <Icon name="Mail" size={15} />
                  </span>
                  <input
                    type="text"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="tu-correo@gmail.com"
                    className="w-full pl-10 pr-3 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva focus:ring-1 focus:ring-brand-malva text-brand-dark placeholder:text-brand-dark/45 transition-colors"
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-500 font-bold mt-2 flex items-center gap-1 justify-center bg-red-50 py-1.5 px-3 rounded-lg border border-red-100">
                    <Icon name="AlertCircle" size={12} />
                    {emailError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-meditation-gradient text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-dark/15"
              >
                <Icon name="LogIn" size={14} />
                Comenzar mi Registro
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-brand-malva-light/60 text-center">
              <div className="flex justify-center gap-4 text-brand-dark/50">
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <Icon name="Shield" size={11} className="text-emerald-700" />
                  Privado
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <Icon name="Zap" size={11} className="text-amber-600" />
                  Inmediato
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <Icon name="Heart" size={11} className="text-rose-600" />
                  Holístico
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Primary App Dashboard */
        <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-in fade-in duration-300">
          
          {/* Navigation Bar Header */}
          <header className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 mb-8" id="app-header">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center text-white shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-malva/10" />
                <svg className="w-8 h-8 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Central vertical stem */}
                  <path d="M50 32V75" stroke="url(#header-logo-stroke)" strokeWidth="6" strokeLinecap="round" />
                  
                  {/* Left cradle leaf outer curve */}
                  <path d="M47 67C43 67 40 59 40 42C40 36 41 33 41 30" stroke="url(#header-logo-stroke)" strokeWidth="4.5" strokeLinecap="round" />
                  
                  {/* Left cradle leaf inner curve */}
                  <path d="M47 57C44 54 42 47 42 38V30" stroke="url(#header-logo-stroke)" strokeWidth="4.5" strokeLinecap="round" />
                  
                  {/* Right cradle leaf outer curve */}
                  <path d="M53 67C57 67 60 59 60 42C60 36 59 33 59 30" stroke="url(#header-logo-stroke)" strokeWidth="4.5" strokeLinecap="round" />
                  
                  {/* Right cradle leaf inner curve */}
                  <path d="M53 57C56 54 58 47 58 38V30" stroke="url(#header-logo-stroke)" strokeWidth="4.5" strokeLinecap="round" />
                  
                  {/* Back center pointed petal of the Tulip */}
                  <path d="M50 18C47 21 46 24 46 26C50 24 50 24 54 26C54 24 53 21 50 18Z" fill="url(#header-logo-stroke)" fillOpacity="0.55" stroke="url(#header-logo-stroke)" strokeWidth="3" strokeLinejoin="round" />
                  
                  {/* Left Tulip Petal */}
                  <path d="M50 41C44 41 44 26 49 19C47 26 49 34 50 41Z" fill="url(#header-logo-stroke)" fillOpacity="0.8" stroke="url(#header-logo-stroke)" strokeWidth="3" strokeLinejoin="round" />
                  
                  {/* Right Tulip Petal overlapping */}
                  <path d="M50 41C56 41 56 26 51 19C53 26 51 34 50 41Z" fill="url(#header-logo-stroke)" fillOpacity="0.9" stroke="url(#header-logo-stroke)" strokeWidth="3" strokeLinejoin="round" />
                  
                  <defs>
                    <linearGradient id="header-logo-stroke" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="35%" stopColor="#F8F2F8" />
                      <stop offset="75%" stopColor="#E6D7E6" />
                      <stop offset="100%" stopColor="#D4BCD4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        maxLength={18}
                        className="text-sm font-bold border-b border-brand-malva-light focus:outline-none px-1 py-0.5 bg-transparent w-28 text-white"
                      />
                      <button onClick={handleSaveName} className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer" title="Guardar">
                        <Icon name="Check" size={14} />
                      </button>
                      <button onClick={() => { setIsEditingName(false); setNameInput(username); }} className="text-white/60 hover:text-white p-0.5 cursor-pointer" title="Cancelar">
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-base font-bold text-white">{username} • HabitLead</h1>
                      <button onClick={() => setIsEditingName(true)} className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer" title="Editar nombre">
                        <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded hover:bg-white/30 transition-all font-semibold">Editar</span>
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-brand-malva-light/75 font-semibold">{userEmail || 'vista-previa@habitlead.com'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              {/* Botón para regresar a la página de inicio (Hacer Logout de forma visual) */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white hover:text-brand-malva-light font-bold text-xs transition-all cursor-pointer shadow-sm"
                title="Volver a la Página de Inicio (Cerrar Sesión)"
              >
                <Home size={13} className="text-brand-malva-light" />
                <span>Página de Inicio</span>
              </button>

              {/* Real Streaks Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white font-bold text-xs transition-transform hover:scale-102">
                <Icon name="Zap" size={14} className="text-brand-malva-light fill-brand-malva-light/20" />
                <span>Racha: {currentStreak} {currentStreak === 1 ? 'día' : 'días'}</span>
              </div>

              <button
                onClick={handleResetApp}
                className="p-2 text-white/40 hover:text-red-400 hover:bg-white/15 rounded-xl transition-all cursor-pointer"
                title="Reiniciar todos mis datos"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </header>

          {/* Hero Section Banner with Calendar Picker & Daily ring progress */}
          <section className="bg-black/25 border border-white/10 text-white rounded-3xl p-6 md:p-8 mb-8 shadow-xl shadow-black/15 overflow-hidden relative" id="hero-progress">
            {/* Subtle Aesthetic Glow Accents in Brand Background */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-brand-malva/20 rounded-full blur-[80px]" />
            <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-brand-malva-light/10 rounded-full blur-[60px]" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
              {/* Visual Progress ring */}
              <div className="md:col-span-8 space-y-4">
                <span className="text-[10px] font-mono tracking-widest uppercase text-brand-malva-light font-bold bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
                  Mi progreso diario
                </span>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                  ¿Qué hábitos saludables cultivarás hoy?
                </h2>
                <p className="text-xs text-brand-malva-light/85 max-w-md leading-relaxed font-medium">
                  Cada área cuenta en tu salud holística. Completa hoy las 5 metas y desbloquearás la insignia <span className="text-white font-extrabold underline decoration-brand-malva-light decoration-2">Bienestar Total</span>.
                </p>

                {/* Progress Bar & Value Display */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-end text-xs">
                    <span className="text-brand-malva-light font-bold">{completedTodayCount} de 5 completados</span>
                    <span className="text-brand-malva-light font-mono font-bold text-sm bg-white/10 px-2 py-0.5 rounded border border-white/10">{progressPercentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-brand-malva-light to-white transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Calendar & Streak selector */}
              <div className="md:col-span-4 bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-between">
                <span className="text-[10px] font-mono text-brand-malva-light/70 mb-3 font-semibold">Historial de la semana</span>
                <div className="flex gap-1 sm:gap-1.5 w-full justify-between mb-4">
                  {AVAILABLE_DATES.map((d) => {
                    const loggedOnThatDay = logs.filter(l => l.date === d.date);
                    const isDateSelected = selectedDate === d.date;
                    const score = loggedOnThatDay.length;

                    return (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDate(d.date)}
                        className={`flex-1 flex flex-col items-center p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
                          isDateSelected
                            ? 'bg-white/15 border-white text-white shadow-inner scale-102'
                            : 'bg-black/20 border-white/10 text-brand-malva-light/65 hover:text-white'
                        }`}
                      >
                        <span className="text-[8px] sm:text-[9px] font-bold leading-none block mb-1 sm:mb-1.5">{d.label.split(' ')[0]}</span>
                        {/* Small visual logs indicator counter inside circle */}
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${
                          score === 5 
                            ? 'bg-gradient-to-tr from-brand-malva-light to-white text-brand-dark animate-pulse'
                            : score > 0 
                              ? 'bg-white/20 text-white border border-white/30' 
                              : 'bg-white/5 text-white/30'
                        }`}>
                          {score}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="w-full text-center">
                  <p className="text-[10px] text-brand-malva-light/80 font-semibold">
                    Viendo logs del:{' '}
                    <span className="text-white font-bold block mt-0.5">
                      {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Master Active Habits Cards Dashboard (5 areas list) */}
          <section className="space-y-6 mb-8" id="habits-dashboard">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Tus Hábitos del Día</h2>
                <p className="text-xs text-brand-malva-light/80 font-medium">Presiona "Registrar" en cada área para registrar tu actividad realizada hoy.</p>
              </div>
              
              <div className="text-[11px] font-bold text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-malva-light animate-pulse" />
                <span>Actualizado hoy</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HABIT_AREAS.map((area) => {
                const currentLog = currentLogsMap.find(log => log.area === area.id) || null;
                return (
                  <HabitCard
                    key={area.id}
                    area={area}
                    currentLog={currentLog}
                    onSave={handleSaveHabit}
                    onClear={handleClearHabit}
                  />
                );
              })}
            </div>
          </section>

          {/* Unlocked Badges Lockers Grid Section */}
          <section className="mb-8" id="badges-section">
            <BadgesGrid badges={unlockedBadges} />
          </section>

          {/* Dynamic Rewards Exchange Marketplace Panel */}
          <section className="mb-4" id="rewards-section">
            <RewardsPanel
              rewards={rewards}
              availableBadgesCount={availableBadgesCount}
              onCanjear={handleCanjearReward}
            />
          </section>

          <footer className="text-center text-xs text-white/40 mt-12 pt-6 border-t border-white/10">
            <p>© 2026 Registro de Hábitos Saludables • Hecho para fomentar el bienestar diario.</p>
            <p className="text-[10px] text-white/30 mt-1">Paleta Gris y Malvas • Almacenamiento local seguro</p>
          </footer>

        </div>
      )}

    </div>
  );
}

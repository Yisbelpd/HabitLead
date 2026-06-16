import React, { useState, useEffect } from 'react';
import { HabitArea, HabitLog, Badge, Reward } from './types';
import { HABIT_AREAS, INITIAL_BADGES, INITIAL_REWARDS } from './data';
import { HabitCard } from './components/HabitCard';
import { BadgesGrid } from './components/BadgesGrid';
import { RewardsPanel } from './components/RewardsPanel';
import { WalletBadges } from './components/WalletBadges';
import { Icon } from './components/Icon';
import { Home, ListTodo, Award, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import logroBienestarImg from './assets/images/logro_bienestar_1780981006929.png';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaWalletButton } from './components/SolanaWalletButton';
import { 
  syncStateToWallet, 
  loadWalletState, 
  ensureWalletProfile, 
  LocalBadge 
} from './lib/walletPersistence';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth,
  loginWithGoogle, 
  logoutUser, 
  setupUserInFirestore, 
  getUserProfile, 
  recordDailyProgress, 
  fetchProgressHistory 
} from './lib/firebaseService';
import { EmailAuth } from './components/EmailAuth';
import { saveCustomUserProgress, fetchCustomUserProgress } from './lib/customAuthService';

export default function App() {
  const { publicKey, connected } = useWallet();

  // Dynamic state to hold current date (updates on midnight / intervals)
  const [currentDateObj, setCurrentDateObj] = useState<Date>(new Date());

  // Dynamic dates based on the actual system date (keeps the calendar updated at all times)
  const getTodayStr = (refDate: Date = currentDateObj): string => {
    const year = refDate.getFullYear();
    const month = String(refDate.getMonth() + 1).padStart(2, '0');
    const day = String(refDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = (refDate: Date = currentDateObj): string => {
    const prev = new Date(refDate.getTime());
    prev.setDate(prev.getDate() - 1);
    const year = prev.getFullYear();
    const month = String(prev.getMonth() + 1).padStart(2, '0');
    const day = String(prev.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const TODAY_STR = getTodayStr(currentDateObj);
  const YESTERDAY_STR = getYesterdayStr(currentDateObj);

  // State
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [customUserSession, setCustomUserSession] = useState<{ email: string; name: string; id: string } | null>(() => {
    const saved = localStorage.getItem('salud_custom_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [username, setUsername] = useState<string>(() => {
    const savedCustom = localStorage.getItem('salud_custom_user_session');
    if (savedCustom) {
      try {
        return JSON.parse(savedCustom).name;
      } catch (e) {}
    }
    const savedName = localStorage.getItem('salud_username');
    return savedName || 'Invitado';
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    const savedCustom = localStorage.getItem('salud_custom_user_session');
    if (savedCustom) {
      try {
        return JSON.parse(savedCustom).email;
      } catch (e) {}
    }
    return localStorage.getItem('salud_user_email') || '';
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(username);
  const [emailInput, setEmailInput] = useState(userEmail);
  const [emailError, setEmailError] = useState('');
  const [showNotification, setShowNotification] = useState<{ show: boolean; title: string; desc: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [walletBadges, setWalletBadges] = useState<LocalBadge[]>([]);

  // Listen to Google Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUserInstance) => {
      if (firebaseUserInstance) {
        setFirebaseUser(firebaseUserInstance);
        setUserEmail(firebaseUserInstance.email || '');
        setEmailInput(firebaseUserInstance.email || '');
        
        try {
          const profile = await getUserProfile(firebaseUserInstance.uid);
          const name = profile?.name || firebaseUserInstance.displayName || firebaseUserInstance.email?.split('@')[0] || 'Miembro HabitLead';
          setUsername(name);
          setNameInput(name);
          setWalletBadges([]); // Reset Solana adapter badges if Google Auth is active
          
          // Re-populate historical HabitLogs with clean reconstructed state
          const history = await fetchProgressHistory(firebaseUserInstance.uid);
          if (history.length > 0) {
            const reconstructedLogs: HabitLog[] = [];
            history.forEach((record, outerIndex) => {
              record.completedHabits.forEach((area, index) => {
                reconstructedLogs.push({
                  id: `firebase_${record.date}_${area}`,
                  area: area as HabitArea,
                  date: record.date,
                  completed: true,
                  value: 'Sincronizado de Firebase',
                  timestamp: new Date(record.date).getTime() + (outerIndex * 100) + index
                });
              });
            });
            setLogs(reconstructedLogs);
          } else {
            setLogs([]);
          }
        } catch (error) {
          console.error("Error reading setup profiles:", error);
        }
      } else {
        setFirebaseUser(null);
        if (!connected) {
          // If custom email auth is holding the active session, preserve it
          if (customUserSession) {
            setUserEmail(customUserSession.email);
            setEmailInput(customUserSession.email);
            setUsername(customUserSession.name);
            setNameInput(customUserSession.name);
            return;
          }
          // Fall back to local guest profile if no other wallet is active
          const savedEmail = localStorage.getItem('salud_user_email');
          if (savedEmail) {
            setUserEmail(savedEmail);
            setEmailInput(savedEmail);
            const savedName = localStorage.getItem('salud_username');
            setUsername(savedName || 'Invitado');
            setNameInput(savedName || 'Invitado');
            const savedLogs = localStorage.getItem('salud_habit_logs');
            setLogs(savedLogs ? JSON.parse(savedLogs) : []);
          } else {
            setUserEmail('');
            setEmailInput('');
            setUsername('Invitado');
            setNameInput('Invitado');
            setLogs([]);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [connected]);

  // Load custom email user's history logs from Firestore
  useEffect(() => {
    if (customUserSession) {
      const loadHistory = async () => {
        try {
          const history = await fetchCustomUserProgress(customUserSession.id);
          if (history.length > 0) {
            const reconstructedLogs: HabitLog[] = [];
            history.forEach((record, outerIndex) => {
              record.completedHabits.forEach((area: any, index: number) => {
                reconstructedLogs.push({
                  id: `custom_firebase_${record.date}_${area}`,
                  area: area as HabitArea,
                  date: record.date,
                  completed: true,
                  value: 'Sincronizado de Firebase',
                  timestamp: new Date(record.date).getTime() + (outerIndex * 100) + index
                });
              });
            });
            setLogs(reconstructedLogs);
          }
        } catch (err) {
          console.error("Error loading custom user history:", err);
        }
      };
      loadHistory();
    }
  }, [customUserSession]);

  // Sincronización automática de calendario: chequea cada 20 segundos si cambió el día para actualizar las fechas al instante
  useEffect(() => {
    const checkDayInterval = setInterval(() => {
      const now = new Date();
      const currentDayStr = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;
      const systemDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      if (currentDayStr !== systemDayStr) {
        console.log(`[Calendario] Cambio de fecha detectado: ${currentDayStr} -> ${systemDayStr}. Sincronizando...`);
        setCurrentDateObj(now);
        
        // Si el usuario tenía seleccionado el "hoy" desactualizado, se lo actualizamos al nuevo "hoy"
        if (selectedDate === currentDayStr) {
          setSelectedDate(systemDayStr);
        }

        setShowNotification({
          show: true,
          title: '📅 Calendario Sincronizado',
          desc: `Tu tablero de hábitos se ha actualizado automáticamente al nuevo día de hoy: ${systemDayStr}.`
        });
        setTimeout(() => setShowNotification(null), 5000);
      }
    }, 20000);

    return () => clearInterval(checkDayInterval);
  }, [currentDateObj, selectedDate]);

  // Load from localStorage on mount & when wallet switches (Only when Firebase isn't the active user session)
  useEffect(() => {
    if (auth.currentUser) return;

    if (customUserSession) {
      const userId = customUserSession.id;
      setUserEmail(customUserSession.email);
      setEmailInput(customUserSession.email);
      setUsername(customUserSession.name);
      setNameInput(customUserSession.name);

      const savedLogs = localStorage.getItem(`salud_habit_logs_${userId}`);
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (e) {
          setLogs([]);
        }
      } else {
        setLogs([]);
      }

      const savedRewards = localStorage.getItem(`salud_rewards_${userId}`);
      if (savedRewards) {
        setRewards(JSON.parse(savedRewards));
      } else {
        setRewards(INITIAL_REWARDS);
      }
      return;
    }

    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const truncated = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
      setUserEmail(`${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}@solana.wallet`);
      
      // Load or Create profile structured data
      ensureWalletProfile(walletAddress);

      const savedName = localStorage.getItem(`salud_username_${walletAddress}`);
      const fallbackName = `Miembro ${truncated}`;
      setUsername(savedName || fallbackName);
      setNameInput(savedName || fallbackName);

      // Load wallet-specific state via structured loader
      const { appLogs, badges } = loadWalletState(walletAddress, HABIT_AREAS);
      setLogs(appLogs);
      setWalletBadges(badges);

      const savedRewards = localStorage.getItem(`salud_rewards_${walletAddress}`);
      if (savedRewards) {
        setRewards(JSON.parse(savedRewards));
      } else {
        setRewards(INITIAL_REWARDS);
      }
    } else {
      setWalletBadges([]);
      const savedEmail = localStorage.getItem('salud_user_email');
      if (savedEmail) {
        setUserEmail(savedEmail);
        setEmailInput(savedEmail);

        const savedName = localStorage.getItem('salud_username');
        if (savedName) {
          setUsername(savedName);
          setNameInput(savedName);
        } else {
          setUsername('Invitado');
          setNameInput('Invitado');
        }

        const savedLogs = localStorage.getItem('salud_habit_logs');
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        } else {
          setLogs([]);
        }

        const savedRewards = localStorage.getItem('salud_rewards');
        if (savedRewards) {
          setRewards(JSON.parse(savedRewards));
        } else {
          setRewards(INITIAL_REWARDS);
        }
      } else {
        setUserEmail('');
        setUsername('Invitado');
        setNameInput('Invitado');
        setLogs([]);
        setRewards(INITIAL_REWARDS);
      }
    }
  }, [connected, publicKey, customUserSession]);

  // Sync state to Cloud Firestore (with LocalStorage fallbacks/backups)
  const saveLogs = async (newLogs: HabitLog[]) => {
    setLogs(newLogs);
    
    if (customUserSession) {
      const userId = customUserSession.id;
      const dayLogs = newLogs.filter(l => l.date === selectedDate && l.completed);
      const completedHabits = dayLogs.map(l => l.area);
      const badgeIds = getUnlockedBadges(newLogs).filter(b => b.unlockedAt).map(b => b.id);
      const currentStreak = getStreakCount(newLogs);

      try {
        await saveCustomUserProgress(userId, {
          date: selectedDate,
          completedHabits,
          badges: badgeIds,
          currentStreak,
          userId
        });
      } catch (err) {
        console.error("Error updating progress in firebase for custom user:", err);
      }

      localStorage.setItem(`salud_habit_logs_${userId}`, JSON.stringify(newLogs));
    } else if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const dayLogs = newLogs.filter(l => l.date === selectedDate && l.completed);
      const completedHabits = dayLogs.map(l => l.area);
      const badgeIds = getUnlockedBadges(newLogs).filter(b => b.unlockedAt).map(b => b.id);
      const currentStreak = getStreakCount(newLogs);
      
      try {
        await recordDailyProgress(userId, {
          date: selectedDate,
          completedHabits,
          badges: badgeIds,
          currentStreak
        });
      } catch (err) {
        console.error("Error updating progress in firebase:", err);
      }
      
      localStorage.setItem(`salud_habit_logs_${userId}`, JSON.stringify(newLogs));
    } else if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      // Use helper to save structured logs & compute badges
      const { badges } = syncStateToWallet(walletAddress, newLogs, HABIT_AREAS);
      setWalletBadges(badges);
      
      // Re-save backwards-compatible array format
      localStorage.setItem(`salud_habit_logs_${walletAddress}`, JSON.stringify(newLogs));
    } else {
      localStorage.setItem('salud_habit_logs', JSON.stringify(newLogs));
    }
  };

  const saveRewards = (newRewards: Reward[]) => {
    setRewards(newRewards);
    const key = connected && publicKey ? `salud_rewards_${publicKey.toString()}` : 'salud_rewards';
    localStorage.setItem(key, JSON.stringify(newRewards));
  };

  const saveUsername = async (newName: string) => {
    setUsername(newName);
    
    if (auth.currentUser) {
      localStorage.setItem(`salud_username_${auth.currentUser.uid}`, newName);
      try {
        await setupUserInFirestore(auth.currentUser, newName);
      } catch (err) {
        console.error("Firestore user profile name error:", err);
      }
    } else {
      const key = connected && publicKey ? `salud_username_${publicKey.toString()}` : 'salud_username';
      localStorage.setItem(key, newName);
    }

    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const profileKey = `habitLead_profile_${walletAddress}`;
      const saved = localStorage.getItem(profileKey);
      if (saved) {
        try {
          const profile = JSON.parse(saved);
          profile.username = newName;
          localStorage.setItem(profileKey, JSON.stringify(profile));
        } catch(e){}
      }
    }
  };

  const saveUserEmail = (newEmail: string) => {
    setUserEmail(newEmail);
    localStorage.setItem('salud_user_email', newEmail);
  };

  // Helper lists of dates for selection - dynamically computed based on today's actual date
  const getDynamicDates = (refDate: Date = currentDateObj) => {
    const list = [];
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(refDate.getTime());
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayLabel = weekdays[d.getDay()];
      const dayNum = d.getDate();
      const label = i === 0 ? `${dayLabel} ${dayNum} (Hoy)` : `${dayLabel} ${dayNum}`;
      
      list.push({ label, date: dateStr });
    }
    return list;
  };

  const AVAILABLE_DATES = getDynamicDates(currentDateObj);

  // Helper list to map area logs of the selected date
  const currentLogsMap = logs.filter(log => log.date === selectedDate);

  // Badge unlock calculation
  const getUnlockedBadges = (customLogs: HabitLog[] = logs): Badge[] => {
    return INITIAL_BADGES.map(badge => {
      // Find if this area has ever been completed at least once in history
      if (badge.id === 'badge_perfeccion') {
        // Special badge: Has completed all 5 areas on any single date
        // Find if there is any date where logged areas count is 5
        const logsByDate: { [key: string]: Set<HabitArea> } = {};
        customLogs.forEach(l => {
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
        const matchingLog = customLogs.find(log => log.area === badge.area);
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
    const cleanValue = value.trim();
    if (!cleanValue) return;

    // Check if we already have this exact habit logged for this area on this date
    const alreadyRegistered = logs.some(log => log.date === selectedDate && log.area === areaId && log.value === cleanValue);
    if (alreadyRegistered) return;

    const newLog: HabitLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      area: areaId,
      date: selectedDate,
      completed: true,
      value: cleanValue,
      timestamp: Date.now()
    };
    const updatedLogs = [...logs, newLog];

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

    // Check if the user completed all 5 areas for the selected date on this save
    const previousCompletedCount = new Set(currentLogsMap.map(log => log.area)).size;
    const updatedCurrentLogs = updatedLogs.filter(log => log.date === selectedDate);
    const newCompletedCount = new Set(updatedCurrentLogs.map(log => log.area)).size;

    if (newCompletedCount === 5 && previousCompletedCount < 5) {
      // Trigger beautiful dual-burst confetti!
      const duration = 1.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#a855f7', '#ec4899', '#3b82f6', '#fbbf24']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#a855f7', '#ec4899', '#3b82f6', '#fbbf24']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();

      // Show achievement celebration modal
      setShowCelebration(true);
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
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      saveUsername(trimmed);
      setIsEditingName(false);
    }
  };

  // Google Single Sign-In authentication with Firebase
  const handleGoogleSignIn = async () => {
    try {
      const user = await loginWithGoogle();
      // Provision user properties safely in Firestore (split-collection style)
      await setupUserInFirestore(user, user.displayName || user.email?.split('@')[0] || 'Miembro HabitLead');
      
      const profile = await getUserProfile(user.uid);
      const name = profile?.name || user.displayName || user.email?.split('@')[0] || 'Miembro HabitLead';
      
      setUsername(name);
      setNameInput(name);
      setUserEmail(user.email || '');
      setFirebaseUser(user);
      
      // Attempt two-way data sync: fetch their Firestore list
      const history = await fetchProgressHistory(user.uid);
      if (history.length > 0) {
        const reconstructedLogs: HabitLog[] = [];
        history.forEach((record, outerIndex) => {
          record.completedHabits.forEach((area, index) => {
            reconstructedLogs.push({
              id: `firebase_${record.date}_${area}`,
              area: area as HabitArea,
              date: record.date,
              completed: true,
              value: 'Sincronizado de Firebase',
              timestamp: new Date(record.date).getTime() + (outerIndex * 100) + index
            });
          });
        });
        setLogs(reconstructedLogs);
      } else {
        // Migration flow: sync standard local guest tracking logs to Firestore on their first cloud login!
        const savedLogs = localStorage.getItem('salud_habit_logs');
        if (savedLogs) {
          try {
            const parsed = JSON.parse(savedLogs) as HabitLog[];
            if (parsed.length > 0) {
              setLogs(parsed);
              const distinctDates = Array.from(new Set(parsed.map(x => x.date)));
              for (const dateStr of distinctDates) {
                const dayLogs = parsed.filter(l => l.date === dateStr && l.completed);
                const completedHabits = dayLogs.map(l => l.area);
                // Compute corresponding badge list
                const badgeIds = INITIAL_BADGES.map(badge => {
                  if (badge.id === 'badge_perfeccion') {
                    const logsByDate: { [key: string]: Set<HabitArea> } = {};
                    parsed.forEach(l => {
                      if (!logsByDate[l.date]) logsByDate[l.date] = new Set<HabitArea>();
                      logsByDate[l.date].add(l.area);
                    });
                    let perfectDate: string | undefined = undefined;
                    for (const [d, areas] of Object.entries(logsByDate)) {
                      if (areas.size === 5) { perfectDate = d; break; }
                    }
                    return perfectDate ? badge.id : '';
                  } else {
                    const mathing = parsed.find(log => log.area === badge.area);
                    return mathing ? badge.id : '';
                  }
                }).filter(id => !!id);

                await recordDailyProgress(user.uid, {
                  date: dateStr,
                  completedHabits,
                  badges: badgeIds,
                  currentStreak: getStreakCount(parsed)
                });
              }
            }
          } catch (e) {
            console.error("Failed to migrate guess logs to Firestore:", e);
          }
        }
      }

      setShowNotification({
        show: true,
        title: '¡Ingreso Exitoso!',
        desc: `Bienvenido(a) ${name}. Tu progreso se ha sincronizado en tiempo real.`
      });
      setTimeout(() => setShowNotification(null), 4000);
    } catch (error) {
      console.error("Google sign in failure:", error);
      setShowNotification({
        show: true,
        title: 'Error de Autenticación',
        desc: 'No se pudo iniciar sesión con Google Firebase.'
      });
      setTimeout(() => setShowNotification(null), 4000);
    }
  };

  const handleCustomLoginSuccess = async (user: { email: string; name: string; id: string }) => {
    setCustomUserSession(user);
    localStorage.setItem('salud_custom_user_session', JSON.stringify(user));
    setUserEmail(user.email);
    setUsername(user.name);
    setNameInput(user.name);
    setEmailInput(user.email);

    // Initial progress sync for this custom user
    try {
      const history = await fetchCustomUserProgress(user.id);
      if (history.length > 0) {
        const reconstructedLogs: HabitLog[] = [];
        history.forEach((record, outerIndex) => {
          record.completedHabits.forEach((area: any, index: number) => {
            reconstructedLogs.push({
              id: `custom_firebase_${record.date}_${area}`,
              area: area as HabitArea,
              date: record.date,
              completed: true,
              value: 'Sincronizado de Firebase',
              timestamp: new Date(record.date).getTime() + (outerIndex * 100) + index
            });
          });
        });
        setLogs(reconstructedLogs);
        localStorage.setItem(`salud_habit_logs_${user.id}`, JSON.stringify(reconstructedLogs));
      } else {
        // Migration flow: sync standard local guest tracking logs to Firestore on their first cloud login!
        const savedLogs = localStorage.getItem('salud_habit_logs');
        if (savedLogs) {
          try {
            const parsed = JSON.parse(savedLogs) as HabitLog[];
            if (parsed.length > 0) {
              setLogs(parsed);
              const distinctDates = Array.from(new Set(parsed.map(x => x.date)));
              for (const dateStr of distinctDates) {
                const dayLogs = parsed.filter(l => l.date === dateStr && l.completed);
                const completedHabits = dayLogs.map(l => l.area);
                // Compute corresponding badge list
                const badgeIds = getUnlockedBadges(parsed).filter(b => b.unlockedAt).map(b => b.id);

                await saveCustomUserProgress(user.id, {
                  date: dateStr,
                  completedHabits,
                  badges: badgeIds,
                  currentStreak: getStreakCount(parsed),
                  userId: user.id
                });
              }
              localStorage.setItem(`salud_habit_logs_${user.id}`, JSON.stringify(parsed));
            } else {
              setLogs([]);
            }
          } catch (e) {
            console.error("Failed to migrate guest logs to Firestore for custom user:", e);
            setLogs([]);
          }
        } else {
          setLogs([]);
        }
      }
    } catch (err) {
      console.error("Error fetching custom user progress:", err);
    }
  };

  // Complete reset to restart
  const handleResetApp = async () => {
    if (confirm('¿Estás seguro de reiniciar todos tus datos de hábitos y recompensas?')) {
      if (customUserSession) {
        const userId = customUserSession.id;
        localStorage.removeItem(`salud_habit_logs_${userId}`);
        localStorage.removeItem(`salud_rewards_${userId}`);
        localStorage.removeItem(`salud_username_${userId}`);
        localStorage.removeItem('salud_custom_user_session');
        setCustomUserSession(null);
        setLogs([]);
        setRewards(INITIAL_REWARDS);
        setUsername('Invitado');
        setNameInput('Invitado');
        setUserEmail('');
        setEmailInput('');
      } else if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        localStorage.removeItem(`salud_habit_logs_${userId}`);
        localStorage.removeItem(`salud_rewards_${userId}`);
        localStorage.removeItem(`salud_username_${userId}`);
        setLogs([]);
        setRewards(INITIAL_REWARDS);
        setUsername('Invitado');
        setNameInput('Invitado');
        setUserEmail('');
        setEmailInput('');
        setFirebaseUser(null);
        try {
          await logoutUser();
        } catch (e) {
          console.error("Failed standard logout during reset:", e);
        }
      } else if (connected && publicKey) {
        const walletAddress = publicKey.toString();
        localStorage.removeItem(`salud_habit_logs_${walletAddress}`);
        localStorage.removeItem(`salud_rewards_${walletAddress}`);
        localStorage.removeItem(`salud_username_${walletAddress}`);
        localStorage.removeItem(`habitLead_profile_${walletAddress}`);
        localStorage.removeItem(`habitLead_habits_${walletAddress}`);
        localStorage.removeItem(`habitLead_logs_${walletAddress}`);
        localStorage.removeItem(`habitLead_badges_${walletAddress}`);
        setLogs([]);
        setWalletBadges([]);
        setRewards(INITIAL_REWARDS);
        const truncated = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        setUsername(`Miembro ${truncated}`);
        setNameInput(`Miembro ${truncated}`);
      } else {
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
      }
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

  const handleLogout = async () => {
    if (auth.currentUser) {
      try {
        await logoutUser();
      } catch (err) {
        console.error("Firebase logout error:", err);
      }
    }
    localStorage.removeItem('salud_custom_user_session');
    setCustomUserSession(null);
    localStorage.removeItem('salud_user_email');
    setUserEmail('');
    setEmailInput('');
    setEmailError('');
    setFirebaseUser(null);
    setUsername('Invitado');
    setNameInput('Invitado');
    setLogs([]);
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
      desc: `Bienvenido de vuelta. Tu sesión ha sido iniciada de forma segura (Modo Local). Para guardar en la nube de Firebase, utiliza el botón de Google.`
    });
    setTimeout(() => setShowNotification(null), 5000);
  };

  // Stats calculation
  const completedTodayCount = new Set(currentLogsMap.map(log => log.area)).size;
  const progressPercentage = Math.round((completedTodayCount / 5) * 100);

  // Consecutive active record streak calculation
  const getStreakCount = (customLogs: HabitLog[] = logs): number => {
    const datesWithLogs = Array.from(new Set(customLogs.map(l => l.date))).sort();
    if (datesWithLogs.length === 0) return 0;
    
    // Quick reverse scan to count consecutive days
    let streak = 0;
    const sortedDates = datesWithLogs.reverse(); // descending
    // Let's check from TODAY
    let checkDateString = TODAY_STR;
    
    // If there is no activity today, verify if there was yesterday to preserve streak
    const hasToday = customLogs.some(l => l.date === TODAY_STR);
    if (!hasToday) {
      const yesterday = YESTERDAY_STR;
      const hasYesterday = customLogs.some(l => l.date === yesterday);
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
      const hadLogsThisDay = customLogs.some(l => l.date === formatted);
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

  // Bottom menu active section navigation based on scroll position
  const [activeSection, setActiveSection] = useState<'inicio' | 'habitos' | 'insignias' | 'recompensas'>('inicio');

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Smooth scrolling to the element
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (shouldShowLanding) return;

    const sections = [
      { id: 'app-header', name: 'inicio' },
      { id: 'habits-dashboard', name: 'habitos' },
      { id: 'badges-section', name: 'insignias' },
      { id: 'rewards-section', name: 'recompensas' },
    ];

    const handleScroll = () => {
      let current = 'inicio';
      // Use window.scrollY with offset to highlight navigation slightly before reaching section
      const scrollPosition = window.scrollY + 220;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = section.name;
          }
        }
      }
      setActiveSection(current as any);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldShowLanding]);

  return (
    <div className="min-h-screen text-white pb-32 font-sans selection:bg-brand-malva-light/35 selection:text-brand-dark">
      {/* High-performance GPU Accelerated Fixed Background Layer to prevent viewport repainting lags on mobile */}
      <div className="fixed inset-0 bg-meditation-gradient pointer-events-none z-[-1] transform-gpu" />
      
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

          {/* Primary High-Fidelity Email & Password Authenticator */}
          <EmailAuth 
            onLoginSuccess={handleCustomLoginSuccess}
            onNotification={(title, desc) => {
              setShowNotification({ show: true, title, desc });
              setTimeout(() => setShowNotification(null), 4000);
            }}
          />

          {/* Alternative Auth Provider Card (Google SSO & Solana Wallet) */}
          <div className="bg-white/10 rounded-3xl p-6 max-w-sm w-full shadow-xl border border-white/15 text-white mt-4 text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-malva-light mb-4">
              U otras opciones corporativas
            </h3>

            {/* REAL GOOGLE SIGN-IN VIA FIREBASE AUTH */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full py-3 bg-white hover:bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2.5 cursor-pointer shadow-md mb-4"
            >
              <svg className="w-4 h-4 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.7 0 3.2.58 4.4 1.71l3.3-3.3C17.7 1.58 15 1 12 1 7.37 1 3.42 3.66 1.48 7.5l3.86 3C6.26 7.42 8.9 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.45 12.27c0-.77-.07-1.54-.19-2.27H12v4.51h6.43c-.28 1.47-1.12 2.71-2.37 3.55l3.7 2.87c2.16-2 3.69-4.96 3.69-8.66z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.34 14.5c-.24-.73-.38-1.51-.38-2.5s.14-1.77.38-2.5L1.48 6.5C.53 8.35 0 10.42 0 12.5s.53 4.15 1.48 6l3.86-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.08.73-2.47 1.16-4.26 1.16-3.1 0-5.74-2.38-6.66-5.46l-3.86 3C3.42 20.34 7.37 23 12 23z"
                />
              </svg>
              <span>Acceder con Google</span>
            </button>

            {/* Separador elegante para Wallet Adapter */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative px-3 text-[8.5px] font-bold text-brand-malva-light bg-brand-dark/15 tracking-widest uppercase">
                O Conecta tu Wallet Web3
              </span>
            </div>

            {/* Solana Wallet Adapter Selector */}
            <div className="flex justify-center">
              <SolanaWalletButton />
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex justify-center gap-4 text-white/60">
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <Icon name="Shield" size={11} className="text-emerald-400" />
                Seguro
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <Icon name="Zap" size={11} className="text-amber-400" />
                Sincronizado
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

          {/* Tarjeta de Gestión de Wallet Solana */}
          <div className="mb-8 p-5 bg-gradient-to-r from-zinc-950/60 to-black/40 border border-white/10 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                <h3 className="font-extrabold text-xs text-purple-300 uppercase tracking-widest leading-none">HabitLead Solana Integration</h3>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed font-semibold max-w-md">
                Tus datos de bienestar se asocian de forma descentralizada con tu wallet. ¡Phantom y Solflare soportados!
              </p>
            </div>
            <div className="w-full sm:w-80">
              <SolanaWalletButton />
            </div>
          </div>

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
                const logsForArea = currentLogsMap.filter(log => log.area === area.id);
                return (
                  <HabitCard
                    key={area.id}
                    area={area}
                    currentLogs={logsForArea}
                    onSave={handleSaveHabit}
                    onClear={handleClearHabit}
                  />
                );
              })}
            </div>
          </section>

          {/* Unlocked Badges Lockers Grid Section */}
          <section className="mb-8" id="badges-section">
            {connected && publicKey && (
              <WalletBadges
                walletAddress={publicKey.toString()}
                totalCheckins={logs.length}
                currentStreak={currentStreak}
                badges={walletBadges}
                onBadgeVerified={() => {
                  console.log("Incentive badge verified, reloading state...");
                  const { badges } = loadWalletState(publicKey.toString(), HABIT_AREAS);
                  setWalletBadges(badges);
                }}
              />
            )}
            <BadgesGrid badges={unlockedBadges} />
          </section>

          {/* Dynamic Rewards Exchange Marketplace Panel */}
          <section className="mb-4" id="rewards-section">
            <RewardsPanel
              rewards={rewards}
              availableBadgesCount={availableBadgesCount}
              onCanjear={handleCanjearReward}
              walletBadges={walletBadges}
            />
          </section>

          <footer className="text-center text-xs text-white/40 mt-12 pt-6 border-t border-white/10">
            <p>© 2026 Registro de Hábitos Saludables • Hecho para fomentar el bienestar diario.</p>
            <p className="text-[10px] text-white/30 mt-1">Paleta Gris y Malvas • Almacenamiento local seguro</p>
          </footer>

        </div>
      )}

      {/* Barra de menú inferior responsive con alta legibilidad y contraste */}
      {!shouldShowLanding && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-sm bg-brand-mid-dark/95 backdrop-blur-xl border border-brand-malva/30 rounded-2xl p-1.5 flex items-center justify-between shadow-2xl transition-all duration-350">
          <button
            onClick={() => {
              scrollToSection('app-header');
              setActiveSection('inicio');
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all duration-250 cursor-pointer ${
              activeSection === 'inicio'
                ? 'bg-gradient-to-tr from-brand-malva-light to-white text-zinc-950 shadow-md scale-102 font-extrabold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home size={15} />
            <span>Inicio</span>
          </button>
          
          <button
            onClick={() => {
              scrollToSection('habits-dashboard');
              setActiveSection('habitos');
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all duration-250 cursor-pointer ${
              activeSection === 'habitos'
                ? 'bg-gradient-to-tr from-brand-malva-light to-white text-zinc-950 shadow-md scale-102 font-extrabold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListTodo size={15} />
            <span>Hábitos</span>
          </button>

          <button
            onClick={() => {
              scrollToSection('badges-section');
              setActiveSection('insignias');
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all duration-250 cursor-pointer ${
              activeSection === 'insignias'
                ? 'bg-gradient-to-tr from-brand-malva-light to-white text-zinc-950 shadow-md scale-102 font-extrabold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award size={15} />
            <span>Insignias</span>
          </button>

          <button
            onClick={() => {
              scrollToSection('rewards-section');
              setActiveSection('recompensas');
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[9px] sm:text-[10px] font-bold transition-all duration-250 cursor-pointer ${
              activeSection === 'recompensas'
                ? 'bg-gradient-to-tr from-brand-malva-light to-white text-zinc-950 shadow-md scale-102 font-extrabold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gift size={15} />
            <span>Recompensas</span>
          </button>
        </div>
      )}

      {/* Modal de Logro Completo / Celebración de los 5 Hábitos */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm overflow-hidden bg-gradient-to-b from-[#3a2c42] to-[#1c1421] border border-brand-malva/40 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center gap-5 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            {/* Elegant glowing background rings */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-malva-light/20 rounded-full blur-3xl pointer-events-none" />
            
            {/* The achievement image with golden gradient borders */}
            <div className="relative z-10 w-36 h-36 rounded-2xl overflow-hidden border-2 border-brand-malva-light/40 bg-zinc-900/40 p-2 flex items-center justify-center shadow-inner shadow-black/80">
              <img
                src={logroBienestarImg}
                alt="Logro Bienestar"
                className="w-full h-full object-contain transform-gpu scale-102"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Achievement text with high readability */}
            <div className="space-y-2 z-10">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold text-xs tracking-widest uppercase">
                <Icon name="Crown" size={14} className="text-amber-400" />
                <span>Excelente Liderazgo</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight">
                ¡Día de Perfección Alcanzado!
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-semibold max-w-[280px] mx-auto">
                Has registrado hábitos en las 5 secciones hoy. Sigue nutriendo tu disciplina, cuerpo, mente, y bienestar.
              </p>
            </div>

            {/* Inspiring quote */}
            <div className="w-full p-3.5 bg-white/5 border border-white/5 rounded-2xl italic text-[11px] text-brand-malva-light font-medium tracking-tight">
              "El liderazgo comienza por uno mismo, y cada pequeña victoria diaria edifica el camino hacia la grandeza."
            </div>

            {/* Accept / Dismiss Button */}
            <button
              onClick={() => {
                setShowCelebration(false);
                // Also trigger a sweet small secondary confetti explosion for satisfying feedback!
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#A78BFA', '#F472B6', '#FBBF24']
                });
              }}
              className="w-full z-10 py-3.5 bg-gradient-to-r from-brand-malva to-brand-dark hover:from-brand-malva-light hover:to-brand-malva active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-brand-malva/20 cursor-pointer transition-all duration-200 uppercase tracking-widest"
            >
              Continuar con mi día
            </button>
            
            {/* Close icon button */}
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

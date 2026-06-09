import { HabitArea, HabitLog } from '../types';

export interface LocalProfile {
  wallet_address: string;
  created_at: string;
  last_login_at: string;
}

export interface LocalHabit {
  id: string;
  wallet_address: string;
  name: string;
  category: string;
  created_at: string;
}

export interface LocalHabitLog {
  id: string;
  wallet_address: string;
  habit_id: string;
  category: string;
  completed_at: string; // YYYY-MM-DD format
}

export interface LocalBadge {
  id: string;
  name: string;
  description: string;
  status: 'locked' | 'unlocked';
  progress: number; // 0 - 100
  unlocked_at: string | null;
  wallet_address: string;
}

/**
 * Ensures a profile exists for the connected wallet, updating last_login_at.
 */
export function ensureWalletProfile(walletAddress: string): LocalProfile {
  const key = `habitLead_profile_${walletAddress}`;
  const saved = localStorage.getItem(key);
  const nowStr = new Date().toISOString();
  
  if (saved) {
    try {
      const profile: LocalProfile = JSON.parse(saved);
      profile.last_login_at = nowStr;
      localStorage.setItem(key, JSON.stringify(profile));
      return profile;
    } catch (e) {
      // Fallback
    }
  }

  const newProfile: LocalProfile = {
    wallet_address: walletAddress,
    created_at: nowStr,
    last_login_at: nowStr,
  };
  localStorage.setItem(key, JSON.stringify(newProfile));
  return newProfile;
}

/**
 * Retrieves the habits associated with a wallet. 
 * Seeds with default recommendations from HABIT_AREAS if empty.
 */
export function getOrCreateWalletHabits(walletAddress: string, defaultAreas: any[]): LocalHabit[] {
  const key = `habitLead_habits_${walletAddress}`;
  const saved = localStorage.getItem(key);
  
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
  }

  // Seed default habits
  const seededHabits: LocalHabit[] = [];
  let habitIdCounter = 1;
  defaultAreas.forEach((area) => {
    if (area.options) {
      area.options.forEach((option: string) => {
        seededHabits.push({
          id: `seed-habit-${habitIdCounter++}`,
          wallet_address: walletAddress,
          name: option,
          category: area.id,
          created_at: new Date().toISOString()
        });
      });
    }
  });

  localStorage.setItem(key, JSON.stringify(seededHabits));
  return seededHabits;
}

/**
 * Saves habits list for the wallet
 */
export function saveWalletHabits(walletAddress: string, habits: LocalHabit[]): void {
  const key = `habitLead_habits_${walletAddress}`;
  localStorage.setItem(key, JSON.stringify(habits));
}

/**
 * Logic to map standard app logs array to wallet-based habitLogs and habits
 */
export function syncStateToWallet(
  walletAddress: string,
  appLogs: HabitLog[],
  defaultAreas: any[]
): { habits: LocalHabit[]; logs: LocalHabitLog[]; badges: LocalBadge[] } {
  // 1. Get current habits
  const habits = getOrCreateWalletHabits(walletAddress, defaultAreas);
  const habitsMap = new Map(habits.map((h) => [h.name + '_' + h.category, h]));
  let updatedHabits = [...habits];
  let customIdCounter = Date.now();

  // 2. Map appLogs to habitLogs, adding habits if they don't exist
  const walletLogs: LocalHabitLog[] = appLogs.map((log) => {
    const habitName = log.value || `Hábito de ${log.area}`;
    const mapKey = habitName + '_' + log.area;
    
    let correspondingHabit = habitsMap.get(mapKey);
    if (!correspondingHabit) {
      // Create a custom habit entry on the fly
      correspondingHabit = {
        id: `custom-habit-${customIdCounter++}`,
        wallet_address: walletAddress,
        name: habitName,
        category: log.area,
        created_at: new Date(log.timestamp).toISOString()
      };
      updatedHabits.push(correspondingHabit);
      habitsMap.set(mapKey, correspondingHabit);
    }

    return {
      id: log.id,
      wallet_address: walletAddress,
      habit_id: correspondingHabit.id,
      category: log.area,
      completed_at: log.date
    };
  });

  // Save updated habits and logs
  saveWalletHabits(walletAddress, updatedHabits);
  localStorage.setItem(`habitLead_logs_${walletAddress}`, JSON.stringify(walletLogs));

  // 3. Compute dynamic badges for the wallet
  const badges = calculateWalletBadges(walletAddress, updatedHabits, walletLogs, appLogs);
  localStorage.setItem(`habitLead_badges_${walletAddress}`, JSON.stringify(badges));

  return { habits: updatedHabits, logs: walletLogs, badges };
}

/**
 * Load app logs from the wallet-specific keys (for seamless startup fallback)
 */
export function loadWalletState(
  walletAddress: string,
  defaultAreas: any[]
): { appLogs: HabitLog[]; badges: LocalBadge[] } {
  ensureWalletProfile(walletAddress);
  const habits = getOrCreateWalletHabits(walletAddress, defaultAreas);
  
  const keyLogs = `habitLead_logs_${walletAddress}`;
  const savedLogs = localStorage.getItem(keyLogs);
  let walletLogs: LocalHabitLog[] = [];
  
  if (savedLogs) {
    try {
      walletLogs = JSON.parse(savedLogs);
    } catch (e) {
      // Fallback
    }
  }

  // Map back to HabitLog[] array for client UI compatibility
  const habitsIdMap = new Map(habits.map(h => [h.id, h]));
  const appLogs: HabitLog[] = walletLogs.map((wl) => {
    const correspondingHabit = habitsIdMap.get(wl.habit_id);
    const habitName = correspondingHabit ? correspondingHabit.name : `Hábito de ${wl.category}`;
    
    return {
      id: wl.id,
      area: wl.category as HabitArea,
      date: wl.completed_at,
      completed: true,
      value: habitName,
      timestamp: new Date(wl.completed_at).getTime() || Date.now()
    };
  });

  // Compute badges
  const badges = calculateWalletBadges(walletAddress, habits, walletLogs, appLogs);
  localStorage.setItem(`habitLead_badges_${walletAddress}`, JSON.stringify(badges));

  return { appLogs, badges };
}

/**
 * Compute the 3 demo badges based on physical constraints
 */
export function calculateWalletBadges(
  walletAddress: string,
  habits: LocalHabit[],
  walletLogs: LocalHabitLog[],
  appLogs: HabitLog[]
): LocalBadge[] {
  // Simple check-ins count
  const totalCheckins = walletLogs.length;

  // 1. 7-Day Streak calculation
  const streakDays = calculateStreak(appLogs);
  const streakProgress = Math.round(Math.min((streakDays / 7) * 100, 100));
  const hasStreakUnlk = streakDays >= 7;

  // 2. 30 Check-ins calculation
  const checkinsProgress = Math.round(Math.min((totalCheckins / 30) * 100, 100));
  const hasCheckinsUnlk = totalCheckins >= 30;

  // 3. Full Balance (must complete each category at least once ever)
  const uniqueCategories = new Set(walletLogs.map((l) => l.category));
  const balanceProgress = Math.round((uniqueCategories.size / 5) * 100);
  const hasBalanceUnlk = uniqueCategories.size === 5;

  const getLocalDateStr = () => new Date().toISOString().split('T')[0];

  return [
    {
      id: 'badge_streak_7',
      name: '7-Day Streak',
      description: 'Completa al menos un hábito durante 7 días consecutivos.',
      status: hasStreakUnlk ? 'unlocked' : 'locked',
      progress: streakProgress,
      unlocked_at: hasStreakUnlk ? getLocalDateStr() : null,
      wallet_address: walletAddress
    },
    {
      id: 'badge_checkins_30',
      name: '30 Check-ins',
      description: 'Alcanza un total acumulado de 30 check-ins en la plataforma.',
      status: hasCheckinsUnlk ? 'unlocked' : 'locked',
      progress: checkinsProgress,
      unlocked_at: hasCheckinsUnlk ? getLocalDateStr() : null,
      wallet_address: walletAddress
    },
    {
      id: 'badge_full_balance',
      name: 'Full Balance',
      description: 'Completa cada una de las 5 categorías de bienestar al menos una vez.',
      status: hasBalanceUnlk ? 'unlocked' : 'locked',
      progress: balanceProgress,
      unlocked_at: hasBalanceUnlk ? getLocalDateStr() : null,
      wallet_address: walletAddress
    }
  ];
}

/**
 * Calculates streak count from logs
 */
function calculateStreak(logs: HabitLog[]): number {
  const datesWithLogs = Array.from(new Set(logs.map(l => l.date))).sort();
  if (datesWithLogs.length === 0) return 0;

  // Today & Yesterday formats
  const getTodayStr = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const getYesterdayStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const TODAY_STR = getTodayStr();
  const YESTERDAY_STR = getYesterdayStr();

  let streak = 0;
  let checkDateString = TODAY_STR;
  
  const hasToday = logs.some(l => l.date === TODAY_STR);
  if (!hasToday) {
    const hasYesterday = logs.some(l => l.date === YESTERDAY_STR);
    if (hasYesterday) {
      checkDateString = YESTERDAY_STR;
    } else {
      return 0; // Streak is 0
    }
  }

  const parseDateObj = (str: string) => {
    const parts = str.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const checkDate = parseDateObj(checkDateString);

  while (true) {
    const formatted = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    const hadLogsThisDay = logs.some(l => l.date === formatted);
    if (hadLogsThisDay) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

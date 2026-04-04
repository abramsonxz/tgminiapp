import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInCalendarDays, isBefore, parseISO } from 'date-fns';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  xpEarned?: number;
  categoryId?: string;
  reminder?: string; // ISO datetime string for reminder
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AvatarData {
  id: string;
  emoji: string;
  name: string;
  requiredLevel: number;
  gradient: string;
  glowColor: string;
}

export interface GameState {
  tasks: Task[];
  categories: Category[];
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  lastCompletedDate?: string;
  achievements: string[];
  achievementDates: Record<string, string>;
  selectedAvatar: string;
  newlyUnlocked: string | null;
}

interface TaskStore extends GameState {
  addTask: (title: string, description: string, difficulty: Difficulty, categoryId?: string, reminder?: string) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  addCategory: (name: string, emoji: string) => void;
  deleteCategory: (id: string) => void;
  updateCategory: (id: string, name: string, emoji: string) => void;
  setAvatar: (avatarId: string) => void;
  dismissNewAchievement: () => void;
  updateTaskReminder: (id: string, reminder: string) => void;
  resetAll: () => void;
}

const XP_MAP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

// ==================== PROGRESSIVE XP SYSTEM ====================

export function getXpForLevel(level: number): number {
  return 50 + (level - 1) * 10;
}

export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 5 * (level - 1) * (level + 8);
}

export function getLevelFromXp(totalXp: number): number {
  const t = totalXp / 5;
  const level = Math.floor((-7 + Math.sqrt(81 + 4 * t)) / 2);
  return Math.max(1, level);
}

export function getLevelInfo(totalXp: number) {
  const level = getLevelFromXp(totalXp);
  const xpForNext = getXpForLevel(level);
  const cumulativeXp = getCumulativeXpForLevel(level);
  const xpInLevel = totalXp - cumulativeXp;
  const progress = Math.min(100, (xpInLevel / xpForNext) * 100);
  return { level, xpForNext, xpInLevel, progress, totalXp };
}

// ==================== ACHIEVEMENTS ====================

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_task', name: 'Первый шаг', desc: 'Заверши первую задачу', icon: '🎯', rarity: 'common' },
  { id: 'ten_tasks', name: 'В потоке', desc: 'Заверши 10 задач', icon: '📝', rarity: 'common' },
  { id: 'fifty_tasks', name: 'Машина', desc: 'Заверши 50 задач', icon: '⚙️', rarity: 'rare' },
  { id: 'hundred_tasks', name: 'Легенда задач', desc: 'Заверши 100 задач', icon: '💯', rarity: 'epic' },
  { id: 'streak_3', name: 'Трёхдневка', desc: 'Держи серию 3 дня', icon: '📅', rarity: 'common' },
  { id: 'streak_7', name: 'Неделя огня', desc: 'Серия 7 дней подряд', icon: '🔥', rarity: 'rare' },
  { id: 'streak_14', name: 'Две недели', desc: 'Серия 14 дней подряд', icon: '💫', rarity: 'epic' },
  { id: 'streak_30', name: 'Месяц железа', desc: 'Серия 30 дней подряд', icon: '💪', rarity: 'legendary' },
  { id: 'xp_100', name: 'Centurion', desc: 'Набери 100 XP', icon: '⚡', rarity: 'common' },
  { id: 'xp_500', name: 'XP Hunter', desc: 'Набери 500 XP', icon: '🌟', rarity: 'rare' },
  { id: 'xp_1000', name: 'XP Master', desc: 'Набери 1000 XP', icon: '👑', rarity: 'epic' },
  { id: 'xp_5000', name: 'XP Legend', desc: 'Набери 5000 XP', icon: '🏆', rarity: 'legendary' },
  { id: 'level_5', name: 'Охотник', desc: 'Достигни 5 уровня', icon: '🏹', rarity: 'common' },
  { id: 'level_10', name: 'Страж', desc: 'Достигни 10 уровня', icon: '🔰', rarity: 'rare' },
  { id: 'level_20', name: 'Воин', desc: 'Достигни 20 уровня', icon: '🗡️', rarity: 'epic' },
  { id: 'hard_five', name: 'Непреклонный', desc: 'Заверши 5 сложных задач', icon: '🔴', rarity: 'rare' },
  { id: 'cat_three', name: 'Организатор', desc: 'Создай 3 типа задач', icon: '📁', rarity: 'common' },
  { id: 'daily_three', name: 'Продуктивный день', desc: 'Заверши 3 задачи за день', icon: '📅', rarity: 'common' },
];

// ==================== AVATARS ====================

export const ALL_AVATARS: AvatarData[] = [
  { id: 'novice', emoji: '⭐', name: 'Новобранец', requiredLevel: 1, gradient: 'from-slate-400 via-gray-400 to-zinc-500', glowColor: 'rgba(161,161,170,0.5)' },
  { id: 'hunter', emoji: '🏹', name: 'Охотник', requiredLevel: 5, gradient: 'from-amber-300 via-yellow-400 to-amber-500', glowColor: 'rgba(251,191,36,0.5)' },
  { id: 'guardian', emoji: '🔰', name: 'Страж', requiredLevel: 10, gradient: 'from-emerald-400 via-green-400 to-lime-400', glowColor: 'rgba(52,211,153,0.5)' },
  { id: 'warrior', emoji: '🗡️', name: 'Воин', requiredLevel: 20, gradient: 'from-blue-400 via-cyan-400 to-teal-400', glowColor: 'rgba(34,211,238,0.5)' },
  { id: 'veteran', emoji: '🛡️', name: 'Ветеран', requiredLevel: 30, gradient: 'from-violet-400 via-purple-500 to-fuchsia-500', glowColor: 'rgba(168,85,247,0.5)' },
  { id: 'master', emoji: '⚔️', name: 'Мастер', requiredLevel: 40, gradient: 'from-red-400 via-rose-500 to-pink-500', glowColor: 'rgba(244,63,94,0.5)' },
  { id: 'legend', emoji: '👑', name: 'Легенда', requiredLevel: 50, gradient: 'from-yellow-300 via-amber-400 to-orange-500', glowColor: 'rgba(251,191,36,0.6)' },
];

// ==================== ACHIEVEMENT CHECKING ====================

function checkAchievements(state: GameState): string[] {
  const now = new Date().toISOString();
  const newUnlocks: string[] = [];
  const level = getLevelFromXp(state.totalXp);
  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = state.tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt.startsWith(today)
  ).length;
  const hardCompleted = state.tasks.filter((t) => t.completed && t.difficulty === 'hard').length;

  const checks: Record<string, boolean> = {
    first_task: state.totalCompleted >= 1,
    ten_tasks: state.totalCompleted >= 10,
    fifty_tasks: state.totalCompleted >= 50,
    hundred_tasks: state.totalCompleted >= 100,
    streak_3: state.bestStreak >= 3,
    streak_7: state.bestStreak >= 7,
    streak_14: state.bestStreak >= 14,
    streak_30: state.bestStreak >= 30,
    xp_100: state.totalXp >= 100,
    xp_500: state.totalXp >= 500,
    xp_1000: state.totalXp >= 1000,
    xp_5000: state.totalXp >= 5000,
    level_5: level >= 5,
    level_10: level >= 10,
    level_20: level >= 20,
    hard_five: hardCompleted >= 5,
    cat_three: state.categories.length >= 3,
    daily_three: completedToday >= 3,
  };

  for (const [id, unlocked] of Object.entries(checks)) {
    if (unlocked && !state.achievements.includes(id)) {
      newUnlocks.push(id);
    }
  }

  return newUnlocks;
}

// ==================== STORE ====================

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: [],
      totalXp: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCompleted: 0,
      lastCompletedDate: undefined,
      achievements: [],
      achievementDates: {},
      selectedAvatar: 'novice',
      newlyUnlocked: null,

      addTask: (title, description, difficulty, categoryId, reminder) => {
        const newTask: Task = {
          id: uuidv4(),
          title,
          description,
          difficulty,
          completed: false,
          createdAt: new Date().toISOString(),
          categoryId: categoryId || undefined,
          reminder: reminder || undefined,
        };
        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
        // Check category achievement
        const s = get();
        const newUnlocks = checkAchievements({ ...s, tasks: [newTask, ...s.tasks] });
        if (newUnlocks.length > 0) {
          const dates = { ...s.achievementDates };
          const now = new Date().toISOString();
          newUnlocks.forEach((id) => { dates[id] = now; });
          set((state) => ({
            achievements: [...state.achievements, ...newUnlocks],
            achievementDates: dates,
            newlyUnlocked: newUnlocks[newUnlocks.length - 1],
          }));
        }
      },

      completeTask: (id) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task || task.completed) return;

        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        const xp = XP_MAP[task.difficulty];

        let newStreak = state.currentStreak;
        let newBestStreak = state.bestStreak;

        if (state.lastCompletedDate) {
          const lastDate = new Date(state.lastCompletedDate);
          const daysDiff = differenceInCalendarDays(now, lastDate);
          if (daysDiff === 0) {
            newStreak = state.currentStreak;
          } else if (daysDiff === 1) {
            newStreak = state.currentStreak + 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        if (newStreak > newBestStreak) {
          newBestStreak = newStreak;
        }

        const updatedState: Partial<GameState> = {
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, completed: true, completedAt: now.toISOString(), xpEarned: xp }
              : t
          ),
          totalXp: state.totalXp + xp,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalCompleted: state.totalCompleted + 1,
          lastCompletedDate: todayStr,
        };

        // Check achievements with the updated state
        const newStateForCheck: GameState = { ...state, ...updatedState };
        const newUnlocks = checkAchievements(newStateForCheck);

        if (newUnlocks.length > 0) {
          const dates = { ...state.achievementDates };
          const isoNow = now.toISOString();
          newUnlocks.forEach((id) => { dates[id] = isoNow; });
          updatedState.achievements = [...state.achievements, ...newUnlocks];
          updatedState.achievementDates = dates;
          updatedState.newlyUnlocked = newUnlocks[newUnlocks.length - 1];
        }

        set((s) => ({ ...s, ...updatedState }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter((t) => !t.completed),
        }));
      },

      addCategory: (name, emoji) => {
        const newCategory: Category = {
          id: uuidv4(),
          name,
          emoji,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
        // Check category-related achievements
        const s = get();
        const newUnlocks = checkAchievements({ ...s, categories: [...s.categories, newCategory] });
        if (newUnlocks.length > 0) {
          const dates = { ...s.achievementDates };
          const now = new Date().toISOString();
          newUnlocks.forEach((id) => { dates[id] = now; });
          set((state) => ({
            achievements: [...state.achievements, ...newUnlocks],
            achievementDates: dates,
            newlyUnlocked: newUnlocks[newUnlocks.length - 1],
          }));
        }
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          tasks: state.tasks.map((t) =>
            t.categoryId === id ? { ...t, categoryId: undefined } : t
          ),
        }));
      },

      updateCategory: (id, name, emoji) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, name, emoji } : c
          ),
        }));
      },

      setAvatar: (avatarId) => {
        set({ selectedAvatar: avatarId });
      },

      dismissNewAchievement: () => {
        set({ newlyUnlocked: null });
      },

      updateTaskReminder: (id, reminder) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, reminder: reminder || undefined } : t
          ),
        }));
      },

      resetAll: () => {
        set({
          tasks: [],
          categories: [],
          totalXp: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalCompleted: 0,
          lastCompletedDate: undefined,
          achievements: [],
          achievementDates: {},
          selectedAvatar: 'novice',
          newlyUnlocked: null,
        });
      },
    }),
    {
      name: 'taskquest-storage',
    }
  )
);

// ==================== HELPERS ====================

export function isTaskOverdue(task: Task): boolean {
  if (task.completed || !task.reminder) return false;
  return isBefore(parseISO(task.reminder), new Date());
}

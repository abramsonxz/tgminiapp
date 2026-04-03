import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInCalendarDays } from 'date-fns';

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
}

export interface GameState {
  tasks: Task[];
  categories: Category[];
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  lastCompletedDate?: string;
}

interface TaskStore extends GameState {
  addTask: (title: string, description: string, difficulty: Difficulty, categoryId?: string) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  addCategory: (name: string, emoji: string) => void;
  deleteCategory: (id: string) => void;
  updateCategory: (id: string, name: string, emoji: string) => void;
  resetAll: () => void;
}

const XP_MAP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

// ==================== PROGRESSIVE XP SYSTEM ====================
// Level 1: 50 XP, Level 2: 60 XP, Level 3: 70 XP, ...
// XP needed for level N = 50 + (N - 1) * 10
// Cumulative XP to reach level N = 5 * (N-1) * (N+8)

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

      addTask: (title, description, difficulty, categoryId) => {
        const newTask: Task = {
          id: uuidv4(),
          title,
          description,
          difficulty,
          completed: false,
          createdAt: new Date().toISOString(),
          categoryId: categoryId || undefined,
        };
        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));
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

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: true,
                  completedAt: now.toISOString(),
                  xpEarned: xp,
                }
              : t
          ),
          totalXp: state.totalXp + xp,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalCompleted: state.totalCompleted + 1,
          lastCompletedDate: todayStr,
        }));
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

      resetAll: () => {
        set({
          tasks: [],
          categories: [],
          totalXp: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalCompleted: 0,
          lastCompletedDate: undefined,
        });
      },
    }),
    {
      name: 'taskquest-storage',
    }
  )
);

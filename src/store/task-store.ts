import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInCalendarDays, isToday, isYesterday } from 'date-fns';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  xpEarned?: number;
}

export interface GameState {
  tasks: Task[];
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  lastCompletedDate?: string;
}

interface TaskStore extends GameState {
  addTask: (title: string, description: string, difficulty: Difficulty) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  getCurrentLevel: () => number;
  getLevelProgress: () => number;
  getXpForLevel: (level: number) => number;
  getXpForDifficulty: (difficulty: Difficulty) => number;
}

const XP_MAP: Record<Difficulty, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      totalXp: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCompleted: 0,
      lastCompletedDate: undefined,

      addTask: (title, description, difficulty) => {
        const newTask: Task = {
          id: uuidv4(),
          title,
          description,
          difficulty,
          completed: false,
          createdAt: new Date().toISOString(),
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

        // Calculate streak
        let newStreak = state.currentStreak;
        let newBestStreak = state.bestStreak;

        if (state.lastCompletedDate) {
          const lastDate = new Date(state.lastCompletedDate);
          const daysDiff = differenceInCalendarDays(now, lastDate);

          if (daysDiff === 0) {
            // Same day — streak stays the same
            newStreak = state.currentStreak;
          } else if (daysDiff === 1) {
            // Consecutive day — increment streak
            newStreak = state.currentStreak + 1;
          } else {
            // Streak broken — reset to 1
            newStreak = 1;
          }
        } else {
          // First completion ever
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

      getCurrentLevel: () => {
        const { totalXp } = get();
        return Math.floor(totalXp / 50) + 1;
      },

      getLevelProgress: () => {
        const { totalXp } = get();
        return (totalXp % 50) / 50 * 100;
      },

      getXpForLevel: (level: number) => {
        return level * 50;
      },

      getXpForDifficulty: (difficulty: Difficulty) => {
        return XP_MAP[difficulty];
      },
    }),
    {
      name: 'taskquest-storage',
    }
  )
);

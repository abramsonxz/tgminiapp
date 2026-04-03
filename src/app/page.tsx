'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Plus,
  Trash2,
  Check,
  Flame,
  Trophy,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  useTaskStore,
  type Difficulty,
} from '@/store/task-store';

// --- Confetti Particle ---
function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6', '#ec4899'];
  const color = colors[index % colors.length];
  const startX = 50 + (Math.random() - 0.5) * 80;
  const endX = startX + (Math.random() - 0.5) * 120;
  const rotation = Math.random() * 720 - 360;
  const delay = Math.random() * 0.3;
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      className="absolute"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        top: '40%',
        left: `${startX}%`,
      }}
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
      animate={{
        opacity: 0,
        y: [0, -60, 200],
        x: [0, (endX - startX) * 0.5, endX - startX],
        rotate: rotation,
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

// --- XP Popup ---
function XpPopup({ xp, show }: { xp: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
          <motion.div
            className="bg-emerald-500 text-white font-bold text-2xl px-8 py-4 rounded-2xl shadow-2xl"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6" />
              <span>+{xp} XP</span>
              <Zap className="w-6 h-6" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Level Up Popup ---
function LevelUpPopup({ level, show }: { level: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
          <motion.div
            className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-center px-10 py-6 rounded-2xl shadow-2xl"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Trophy className="w-10 h-10 mx-auto mb-2" />
            </motion.div>
            <div className="text-lg">Новый уровень!</div>
            <div className="text-3xl mt-1">Уровень {level}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Difficulty Config ---
const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; xp: number; color: string; bg: string; border: string; ring: string }
> = {
  easy: {
    label: 'Легко',
    xp: 10,
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950/50',
    border: 'border-emerald-300 dark:border-emerald-700',
    ring: 'ring-emerald-500',
  },
  medium: {
    label: 'Средне',
    xp: 25,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950/50',
    border: 'border-amber-300 dark:border-amber-700',
    ring: 'ring-amber-500',
  },
  hard: {
    label: 'Сложно',
    xp: 50,
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950/50',
    border: 'border-rose-300 dark:border-rose-700',
    ring: 'ring-rose-500',
  },
};

// --- Main Page ---
export default function Home() {
  const {
    tasks,
    totalXp,
    currentStreak,
    bestStreak,
    totalCompleted,
    addTask,
    completeTask,
    deleteTask,
    clearCompleted,
  } = useTaskStore();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [showDescription, setShowDescription] = useState(false);
  const [telegramUser, setTelegramUser] = useState<string>('Герой');
  const [xpPopup, setXpPopup] = useState<{ show: boolean; xp: number }>({
    show: false,
    xp: 0,
  });
  const [levelUpPopup, setLevelUpPopup] = useState<{
    show: boolean;
    level: number;
  }>({ show: false, level: 0 });
  const [activeTab, setActiveTab] = useState('all');

  const xpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const levelUpTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Telegram Web App initialization
  useEffect(() => {
    const checkTelegram = () => {
      const tg = (window as unknown as { Telegram?: { WebApp?: Record<string, unknown> } }).Telegram?.WebApp;
      if (tg) {
        (tg.ready as () => void)();
        (tg.expand as () => void)();
        const initData = tg.initDataUnsafe as Record<string, Record<string, string>> | undefined;
        const user = initData?.user;
        if (user?.first_name) {
          setTelegramUser(user.first_name);
        }
        // Apply Telegram theme
        const theme = tg.themeParams as Record<string, string> | undefined;
        if (theme) {
          const root = document.documentElement;
          if (theme.bg_color) {
            root.style.setProperty('--background', theme.bg_color);
            root.style.setProperty('--card', theme.bg_color);
          }
          if (theme.text_color) {
            root.style.setProperty('--foreground', theme.text_color);
            root.style.setProperty('--card-foreground', theme.text_color);
          }
          if (theme.hint_color) {
            root.style.setProperty('--muted-foreground', theme.hint_color);
          }
          if (theme.button_color) {
            root.style.setProperty('--primary', theme.button_color);
          }
          if (theme.button_text_color) {
            root.style.setProperty('--primary-foreground', theme.button_text_color);
          }
        }
      }
    };
    // Small delay to ensure Telegram script loads
    const timer = setTimeout(checkTelegram, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate level
  const currentLevel = Math.floor(totalXp / 50) + 1;
  const levelProgress = (totalXp % 50) / 50 * 100;
  const xpInLevel = totalXp % 50;
  const xpNeeded = 50;

  // Level up is handled in handleCompleteTask below

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (xpTimeoutRef.current) clearTimeout(xpTimeoutRef.current);
      if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
    };
  }, []);

  const handleAddTask = useCallback(() => {
    if (!taskTitle.trim()) return;
    addTask(taskTitle.trim(), taskDescription.trim(), selectedDifficulty);
    setTaskTitle('');
    setTaskDescription('');
    setShowDescription(false);
  }, [taskTitle, taskDescription, selectedDifficulty, addTask]);

  const handleCompleteTask = useCallback(
    (id: string, xp: number) => {
      const prevLevel = Math.floor(totalXp / 50) + 1;
      completeTask(id);
      const newTotalXp = totalXp + xp;
      const newLevel = Math.floor(newTotalXp / 50) + 1;
      setXpPopup({ show: true, xp });
      if (xpTimeoutRef.current) clearTimeout(xpTimeoutRef.current);
      xpTimeoutRef.current = setTimeout(() => {
        setXpPopup((p) => ({ ...p, show: false }));
      }, 1200);
      if (newLevel > prevLevel) {
        setLevelUpPopup({ show: true, level: newLevel });
        if (levelUpTimeoutRef.current) clearTimeout(levelUpTimeoutRef.current);
        levelUpTimeoutRef.current = setTimeout(() => {
          setLevelUpPopup((p) => ({ ...p, show: false }));
        }, 2000);
      }
    },
    [completeTask, totalXp]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !showDescription) {
        e.preventDefault();
        handleAddTask();
      }
    },
    [handleAddTask, showDescription]
  );

  // Filter tasks
  const filteredTasks =
    activeTab === 'active'
      ? tasks.filter((t) => !t.completed)
      : activeTab === 'completed'
        ? tasks.filter((t) => t.completed)
        : tasks;

  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="min-h-dvh bg-background">
      {/* Confetti container */}
      <XpPopup xp={xpPopup.xp} show={xpPopup.show} />
      <LevelUpPopup level={levelUpPopup.level} show={levelUpPopup.show} />

      <div className="mx-auto max-w-lg px-4 pb-24 pt-4">
        {/* Header */}
        <motion.header
          className="flex items-center justify-between py-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
              <Sword className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                TaskQuest
              </h1>
              <p className="text-xs text-muted-foreground">
                Привет, <span className="font-medium text-foreground">{telegramUser}</span>!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5">
            <Flame className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {currentStreak}
            </span>
          </div>
        </motion.header>

        {/* Stats Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl">
            <CardContent className="p-5">
              {/* Level badge */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      '0 0 15px rgba(255,255,255,0.3)',
                      '0 0 30px rgba(255,255,255,0.5)',
                      '0 0 15px rgba(255,255,255,0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-2xl font-black">{currentLevel}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    УР
                  </span>
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-100">
                      Опыт: {xpInLevel} / {xpNeeded} XP
                    </span>
                    <span className="text-xs font-medium text-emerald-200">
                      Уровень {currentLevel}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      className="h-full rounded-full bg-white/90"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                  <Target className="mx-auto h-4 w-4 text-emerald-200" />
                  <div className="mt-1 text-lg font-bold">{totalCompleted}</div>
                  <div className="text-[10px] text-emerald-200">Задач выполнено</div>
                </div>
                <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                  <Flame className="mx-auto h-4 w-4 text-emerald-200" />
                  <div className="mt-1 text-lg font-bold">{currentStreak}</div>
                  <div className="text-[10px] text-emerald-200">Текущая серия</div>
                </div>
                <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                  <Trophy className="mx-auto h-4 w-4 text-emerald-200" />
                  <div className="mt-1 text-lg font-bold">{bestStreak}</div>
                  <div className="text-[10px] text-emerald-200">Лучшая серия</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Task Section */}
        <motion.div
          className="mt-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold text-sm">Добавить задачу</span>
              </div>

              <Input
                placeholder="Название задачи..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="mb-3 h-11 border-border/50 bg-muted/50"
              />

              {/* Description toggle */}
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="mb-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDescription ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {showDescription ? 'Скрыть описание' : 'Добавить описание'}
              </button>

              <AnimatePresence>
                {showDescription && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-3"
                  >
                    <Textarea
                      placeholder="Описание (необязательно)..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      className="min-h-[60px] border-border/50 bg-muted/50 resize-none"
                      rows={2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Difficulty selector */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Сложность:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
                    const cfg = DIFFICULTY_CONFIG[diff];
                    const isSelected = selectedDifficulty === diff;
                    return (
                      <button
                        key={diff}
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2.5 transition-all duration-200 min-h-[56px] ${
                          isSelected
                            ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                            : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="text-sm font-semibold">{cfg.label}</span>
                        <span className="flex items-center gap-0.5 text-[11px] font-medium">
                          <Zap className="h-3 w-3" />
                          +{cfg.xp} XP
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleAddTask}
                disabled={!taskTitle.trim()}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          className="mt-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Filter tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-10 bg-muted/80">
              <TabsTrigger value="all" className="flex-1 text-xs">
                Все ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1 text-xs">
                Активные ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 text-xs">
                Выполненные ({completedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-3">
              <TaskList
                tasks={filteredTasks}
                onComplete={handleCompleteTask}
                onDelete={deleteTask}
              />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Clear completed */}
        <AnimatePresence>
          {completedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4"
            >
              <Button
                variant="outline"
                onClick={clearCompleted}
                className="w-full h-11 border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить выполненные ({completedCount})
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Task List Component ---
function TaskList({
  tasks,
  onComplete,
  onDelete,
}: {
  tasks: ReturnType<typeof useTaskStore.getState>['tasks'];
  onComplete: (id: string, xp: number) => void;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 font-semibold text-foreground">Нет задач</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Создай свою первую задачу!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={onComplete}
            onDelete={onDelete}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Task Card Component ---
function TaskCard({
  task,
  onComplete,
  onDelete,
  index,
}: {
  task: ReturnType<typeof useTaskStore.getState>['tasks'][0];
  onComplete: (id: string, xp: number) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const cfg = DIFFICULTY_CONFIG[task.difficulty];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        layout: { duration: 0.3 },
      }}
    >
      <Card
        className={`overflow-hidden border transition-all duration-300 ${
          task.completed
            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-border/50 hover:border-border'
        }`}
      >
        <CardContent className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Complete button */}
            <div className="mt-0.5 flex-shrink-0">
              {task.completed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-4 w-4" />
                </div>
              ) : (
                <button
                  onClick={() => onComplete(task.id, DIFFICULTY_CONFIG[task.difficulty].xp)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-transparent hover:border-emerald-500 hover:text-emerald-500 transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-90"
                  aria-label="Отметить выполненной"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Task content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-medium text-sm leading-tight ${
                    task.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}
                >
                  {task.title}
                </h3>
              </div>

              {task.description && (
                <p
                  className={`mt-1 text-xs leading-relaxed ${
                    task.completed ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'
                  }`}
                >
                  {task.description}
                </p>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0 h-5 border-current/20 ${cfg.color} ${task.completed ? 'opacity-50' : ''}`}
                >
                  {cfg.label}
                </Badge>

                <span
                  className={`flex items-center gap-0.5 text-[11px] font-medium ${cfg.color} ${
                    task.completed ? 'opacity-50' : ''
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  +{cfg.xp} XP
                </span>

                {task.completed && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0 h-5 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                  >
                    Выполнено ✓
                  </Badge>
                )}
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={() => onDelete(task.id)}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-90"
              aria-label="Удалить задачу"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Check, Flame, Trophy, Zap, Sparkles, Target,
  ChevronDown, ChevronRight, Pencil, Tag, Settings, RotateCcw,
  Star, Shield, Gamepad2, Swords, Scroll, Medal, Crown,
  Moon, Sun, Waves, FlameKindling, Monitor, X, Gem, Heart,
  SwordsIcon, Palette, Lock, Clock, Bell, Award, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTaskStore, type Difficulty, type Category, getLevelInfo, getXpForLevel, ALL_ACHIEVEMENTS, ALL_AVATARS, type Achievement, isTaskOverdue } from '@/store/task-store';

// ════════════════════════════════════════════════════════════
//                    TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════
export type ThemeId = 'cyber' | 'light' | 'neon' | 'ocean' | 'sunset';
type GameMode = 'game' | 'minimal';

// ════════════════════════════════════════════════════════════
//                    COLOR THEME SYSTEM
// ════════════════════════════════════════════════════════════
const THEMES: { id: ThemeId; name: string; emoji: string; icon: typeof Monitor; desc: string; preview: string }[] = [
  { id: 'cyber', name: 'Кибер', emoji: '🟢', icon: Monitor, desc: 'Тёмная тема с зелёным неоном', preview: 'from-emerald-600 to-cyan-700' },
  { id: 'light', name: 'Светлая', emoji: '☀️', icon: Sun, desc: 'Чистая и минималистичная', preview: 'from-sky-100 to-emerald-100' },
  { id: 'neon', name: 'Неон', emoji: '💜', icon: Moon, desc: 'Яркие неоновые цвета', preview: 'from-purple-600 to-pink-600' },
  { id: 'ocean', name: 'Океан', emoji: '🌊', icon: Waves, desc: 'Глубокие синие тона', preview: 'from-blue-700 to-indigo-800' },
  { id: 'sunset', name: 'Закат', emoji: '🌅', icon: FlameKindling, desc: 'Тёплые оранжевые оттенки', preview: 'from-orange-600 to-rose-700' },
];

function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>('cyber');
  useEffect(() => {
    const saved = localStorage.getItem('taskquest-theme') as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) setThemeState(saved);
  }, []);
  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('taskquest-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  return { theme, setTheme };
}

// ════════════════════════════════════════════════════════════
//                    GAME MODE SYSTEM
// ════════════════════════════════════════════════════════════
function useGameMode() {
  const [mode, setModeState] = useState<GameMode>('game');
  const gameMode = mode === 'game';

  useEffect(() => {
    const saved = localStorage.getItem('taskquest-mode') as GameMode | null;
    if (saved === 'minimal') setModeState('minimal');
  }, []);

  const setMode = useCallback((m: GameMode) => {
    setModeState(m);
    localStorage.setItem('taskquest-mode', m);
    document.documentElement.setAttribute('data-mode', m);
  }, []);

  return { gameMode, mode, setMode };
}

// ════════════════════════════════════════════════════════════
//                    GAME CONSTANTS
// ════════════════════════════════════════════════════════════
const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; xp: number; color: string; gradient: string; border: string; icon: string; tag: string }> = {
  easy:   { label: 'Легко',   xp: 10, color: 'text-emerald-400',   gradient: 'from-emerald-500/20 to-emerald-600/5',   border: 'border-l-emerald-400', icon: '🟢', tag: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Средне',  xp: 25, color: 'text-amber-400',    gradient: 'from-amber-500/20 to-amber-600/5',     border: 'border-l-amber-400',   icon: '🟡', tag: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  hard:   { label: 'Сложно',  xp: 50, color: 'text-rose-400',     gradient: 'from-rose-500/20 to-rose-600/5',       border: 'border-l-rose-400',    icon: '🔴', tag: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

function getRank(level: number) {
  if (level >= 50) return { name: 'Легенда',  emoji: '👑', gradient: 'from-yellow-300 via-amber-400 to-orange-500', border: 'border-yellow-400/30', glow: 'rgba(251,191,36,0.4)' };
  if (level >= 40) return { name: 'Мастер',   emoji: '⚔️', gradient: 'from-red-400 via-rose-500 to-pink-500',    border: 'border-rose-400/30',   glow: 'rgba(244,63,94,0.4)' };
  if (level >= 30) return { name: 'Ветеран',  emoji: '🛡️', gradient: 'from-violet-400 via-purple-500 to-fuchsia-500', border: 'border-purple-400/30', glow: 'rgba(168,85,247,0.4)' };
  if (level >= 20) return { name: 'Воин',     emoji: '🗡️', gradient: 'from-blue-400 via-cyan-400 to-teal-400',   border: 'border-cyan-400/30',   glow: 'rgba(34,211,238,0.4)' };
  if (level >= 10) return { name: 'Страж',    emoji: '🔰', gradient: 'from-emerald-400 via-green-400 to-lime-400', border: 'border-emerald-400/30', glow: 'rgba(52,211,153,0.4)' };
  if (level >= 5)  return { name: 'Охотник',  emoji: '🏹', gradient: 'from-amber-300 via-yellow-400 to-amber-500', border: 'border-amber-400/30', glow: 'rgba(251,191,36,0.4)' };
  return              { name: 'Новобранец', emoji: '⭐', gradient: 'from-slate-500 via-gray-500 to-zinc-600',     border: 'border-zinc-400/30',   glow: 'rgba(161,161,170,0.4)' };
}

// ════════════════════════════════════════════════════════════
//                    EMOJI DATA
// ════════════════════════════════════════════════════════════
const EMOJI_SETS = [
  { label: 'Работа',     emojis: ['💼','💻','📊','📋','📁','🏢','📝','📞','📧','🗓️','👤','🤝','🔧','⚙️','💰'] },
  { label: 'Учёба',      emojis: ['📚','🎓','📖','✏️','🧠','🔬','📐','🏫','✍️','🧪','🌍','🔍','💡','🧩','🖥️'] },
  { label: 'Спорт',      emojis: ['⚽','🏀','🏃','🏋️','🚴','🏊','🎾','🥊','🧘','⛷️','🤸','🤺','🎳','🚣','🧗'] },
  { label: 'Здоровье',   emojis: ['❤️','🥗','🍎','💊','😴','🩺','🥦','🌿','🧃','🥤','🧴','🦷','🫁','🩹','💪'] },
  { label: 'Дом',        emojis: ['🏠','🍳','🧹','🛒','🛏️','🪴','🧸','🐶','🐱','🔧','🪞','🧺','🪟','🔑','🏡'] },
  { label: 'Творчество', emojis: ['📸','🎵','🎬','✨','🎭','🎸','🎹','🎤','🖌️','🎪','🖼️','🎥','🎲','🧶','🪕'] },
  { label: 'Другое',     emojis: ['⭐','🌟','🎯','🚀','💎','🔔','📅','⏰','🎁','🏆','✅','❗','📌','🔖','💤'] },
];

// ════════════════════════════════════════════════════════════
//               ANIMATION COMPONENTS (Game Mode)
// ════════════════════════════════════════════════════════════
function ConfettiParticle({ index }: { index: number }) {
  const colors = ['#34d399', '#fbbf24', '#f43f5e', '#a78bfa', '#38bdf8', '#ec4899', '#fb923c'];
  const color = colors[index % colors.length];
  const startX = 50 + (Math.random() - 0.5) * 80;
  const endX = startX + (Math.random() - 0.5) * 150;
  const rotation = Math.random() * 1080 - 540;
  const delay = Math.random() * 0.4;
  const size = 5 + Math.random() * 8;
  const shape = Math.random();
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ width: size, height: shape > 0.6 ? size * 2 : size, backgroundColor: color, borderRadius: shape > 0.8 ? '50%' : '2px', top: '35%', left: `${startX}%` }}
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 0 }}
      animate={{ opacity: 0, y: [0, -80, 300], x: [0, (endX - startX) * 0.3, endX - startX], rotate: rotation, scale: [0, 1.2, 0.8] }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
    />
  );
}

function XpPopup({ xp, show, gameMode }: { xp: number; show: boolean; gameMode: boolean }) {
  if (!gameMode) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {Array.from({ length: 25 }).map((_, i) => <ConfettiParticle key={i} index={i} />)}
          <motion.div className="relative" initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
            <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-black text-3xl px-10 py-5 rounded-2xl shadow-2xl animate-pulse-glow">
              <div className="flex items-center gap-3"><Zap className="w-8 h-8 fill-white" /><span>+{xp} XP</span><Zap className="w-8 h-8 fill-white" /></div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LevelUpPopup({ level, show, gameMode }: { level: number; show: boolean; gameMode: boolean }) {
  if (!gameMode) return null;
  const rank = getRank(level);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {Array.from({ length: 40 }).map((_, i) => <ConfettiParticle key={i} index={i} />)}
          <motion.div className="text-center" initial={{ scale: 0, y: 80 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            <motion.div animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 0.8, delay: 0.3 }} className="text-7xl mb-3">{rank.emoji}</motion.div>
            <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white font-black text-center px-12 py-7 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              <div className="relative">
                <div className="text-sm font-bold uppercase tracking-widest text-amber-100">Новый уровень!</div>
                <div className="text-4xl mt-2 font-black">Уровень {level}</div>
                <div className="mt-2 text-lg text-amber-100">{rank.name}</div>
                <div className="mt-1 text-xs text-amber-200">+{getXpForLevel(level)} XP до следующего</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{id:number;left:number;size:number;duration:number;delay:number;opacity:number;xDrift:number}>>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
      opacity: 0.08 + Math.random() * 0.15,
      xDrift: (Math.random() - 0.5) * 80,
    })));
  }, []);
  if (particles.length === 0) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, left: `${p.left}%`, opacity: p.opacity, backgroundColor: `rgb(var(--theme-particle-color))` }}
          animate={{ y: ['100vh', '-10vh'], x: [0, p.xDrift] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//                    CIRCULAR XP RING (Game)
// ════════════════════════════════════════════════════════════
function XpRing({ progress, size = 80, strokeWidth = 5, color }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const pad = 12; // padding so drop-shadow isn't clipped
  const innerSize = size;
  const outerSize = size + pad * 2;
  const radius = (innerSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const sc = color || 'rgb(var(--theme-accent-glow))';
  const track = color ? sc.replace(/[\d.]+\)$/, '0.15)') : 'rgba(var(--theme-accent-glow), 0.15)';

  return (
    <svg width={innerSize} height={innerSize} className="-rotate-90" viewBox={`0 0 ${outerSize} ${outerSize}`} style={{ overflow: 'visible' }}>
      <defs>
        <filter id={`xp-glow-${innerSize}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={`translate(${pad}, ${pad})`}>
        <circle cx={innerSize / 2} cy={innerSize / 2} r={radius} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <motion.circle
          cx={innerSize / 2} cy={innerSize / 2} r={radius} fill="none" stroke={sc} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `url(#xp-glow-${innerSize})` }}
        />
      </g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//                    EMOJI PICKER
// ════════════════════════════════════════════════════════════
function EmojiPicker({ selected, onSelect, gameMode }: { selected: string; onSelect: (e: string) => void; gameMode: boolean }) {
  const [activeSet, setActiveSet] = useState(0);
  return (
    <div className={`rounded-2xl p-3 space-y-2.5 ${gameMode ? 'glass-strong' : 'bg-card border border-border'}`}>
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {EMOJI_SETS.map((set, i) => (
          <button key={set.label} onClick={() => setActiveSet(i)}
            className={`flex-shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeSet === i ? (gameMode ? 'bg-primary/20 text-primary shadow-lg' : 'bg-primary/15 text-primary') : 'text-muted-foreground hover:text-foreground hover:bg-[var(--theme-hover-bg)]'
            }`}>{set.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {EMOJI_SETS[activeSet].emojis.map((emoji, i) => (
          <button key={`${activeSet}-${i}`} onClick={() => onSelect(emoji)}
            className={`aspect-square flex items-center justify-center rounded-xl text-xl transition-all active:scale-90 ${
              selected === emoji ? 'bg-primary/20 text-primary scale-95' : 'hover:bg-[var(--theme-hover-bg)] hover:scale-105'
            }`}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//                PROFILE CARD — Game Mode
// ════════════════════════════════════════════════════════════
function GameProfileCard({ levelInfo, rank, telegramUser, currentStreak, totalXp, totalCompleted, bestStreak }: {
  levelInfo: ReturnType<typeof getLevelInfo>; rank: ReturnType<typeof getRank>;
  telegramUser: string; currentStreak: number; totalXp: number; totalCompleted: number; bestStreak: number;
}) {
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05, duration: 0.5 }}>
      <div className="relative overflow-hidden rounded-3xl glass-strong"
        style={{ boxShadow: `0 0 25px rgba(var(--theme-accent-glow), 0.2), 0 8px 32px rgba(0,0,0,0.3)` }}>
        {/* Theme-aware accent gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 15%, var(--theme-mesh1), transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 85%, var(--theme-mesh2), transparent 55%)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.15),transparent_60%)]" />

        {/* Orbiting dot */}
        <motion.div className="absolute w-2 h-2 rounded-full bg-primary/50"
          animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ top: '10%', left: '50%', originX: '0px', originY: '0px', transform: 'translateX(120px)' }}
        />

        <div className="relative p-5">
          <div className="flex items-start gap-4">
            {/* XP Ring */}
            <div className="relative flex-shrink-0">
              <XpRing progress={levelInfo.progress} size={76} strokeWidth={4} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-foreground drop-shadow-lg">{levelInfo.level}</div>
                  <div className="text-[7px] font-bold uppercase tracking-[0.15em] text-muted-foreground">УР</div>
                </div>
              </div>
            </div>

            {/* Character Info */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground truncate">{telegramUser}</h2>
                {currentStreak > 0 && (
                  <motion.div className="flex items-center gap-0.5 rounded-lg bg-primary/10 px-2 py-0.5 flex-shrink-0"
                    animate={currentStreak >= 3 ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}>
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-xs font-bold text-orange-300">{currentStreak}</span>
                  </motion.div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-sm">{rank.emoji}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{rank.name}</span>
              </div>

              {/* XP bar */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">{levelInfo.xpInLevel} / {levelInfo.xpForNext} XP</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">{totalXp} всего</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-foreground/10 relative">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary relative overflow-hidden"
                    initial={{ width: 0 }} animate={{ width: `${Math.min(100, levelInfo.progress)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}>
                    <div className="absolute inset-0 xp-bar-shimmer" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {[
              { icon: Target, val: totalCompleted, label: 'Задач' },
              { icon: Flame, val: currentStreak, label: 'Серия' },
              { icon: Trophy, val: bestStreak, label: 'Рекорд' },
              { icon: Star, val: totalXp, label: 'XP' },
            ].map(({ icon: Icon, val, label }, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300 }}
                className="rounded-xl bg-primary/5 p-2 text-center border border-primary/10">
                <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                <div className="mt-0.5 text-sm font-black text-foreground leading-tight">{val}</div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//               PROFILE CARD — Minimal Mode
// ════════════════════════════════════════════════════════════
function MinimalProfileCard({ levelInfo, rank, telegramUser, currentStreak, totalXp }: {
  levelInfo: ReturnType<typeof getLevelInfo>; rank: ReturnType<typeof getRank>;
  telegramUser: string; currentStreak: number; totalXp: number;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{rank.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground truncate">{telegramUser}</span>
            <span className="text-xs text-muted-foreground">Ур. {levelInfo.level}</span>
          </div>
          <div className="text-xs text-muted-foreground">{rank.name}{currentStreak > 0 ? ` · 🔥 ${currentStreak}` : ''}</div>
        </div>
        <span className="text-xs font-bold text-muted-foreground">{totalXp} XP</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary"
          initial={{ width: 0 }} animate={{ width: `${Math.min(100, levelInfo.progress)}%` }}
          transition={{ duration: 0.6 }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">{levelInfo.xpInLevel} / {levelInfo.xpForNext} XP</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//               QUEST CARD — Game Mode
// ════════════════════════════════════════════════════════════
function GameQuestCard({ task, index, onComplete, onDelete }: {
  task: ReturnType<typeof useTaskStore.getState>['tasks'][0];
  index: number; onComplete: (id: string, xp: number) => void; onDelete: (id: string) => void;
}) {
  const cfg = DIFFICULTY_CONFIG[task.difficulty];
  const overdue = isTaskOverdue(task);
  return (
    <motion.div layout initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }} transition={{ duration: 0.3, delay: index * 0.03, layout: { duration: 0.3 } }}>
      <div className={`rounded-2xl transition-all duration-300 overflow-hidden border-l-4 ${cfg.border} ${overdue ? 'animate-overdue-pulse' : ''} ${
        task.completed ? 'glass opacity-60' : 'glass-strong hover:bg-[var(--theme-hover-bg)]'
      }`} style={overdue ? { boxShadow: '0 0 12px rgba(239,68,68,0.3), 0 0 4px rgba(239,68,68,0.5)' } : undefined}>
        <div className="p-3.5">
          <div className="flex items-start gap-3">
            {/* Complete Button */}
            <div className="mt-0.5 flex-shrink-0">
              {task.completed ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                  <Check className="h-4 w-4 text-primary" />
                </motion.div>
              ) : (
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => onComplete(task.id, cfg.xp)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 text-transparent hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-all duration-200">
                  <Swords className="h-4 w-4" />
                </motion.button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-sm leading-snug ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</h3>
              {task.description && <p className={`mt-1 text-xs leading-relaxed ${task.completed ? 'text-muted-foreground/50 line-through' : 'text-muted-foreground'}`}>{task.description}</p>}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold border ${cfg.tag}`}>
                  <span>{cfg.icon}</span><span>{cfg.label}</span>
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${cfg.color}`}>
                  <Zap className="h-3 w-3" />+{cfg.xp} XP
                </span>
                {task.completed && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">✓ Завершено</span>
                )}
                {overdue && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/25 animate-pulse">
                    <Clock className="h-2.5 w-2.5" />Просрочено
                  </span>
                )}
                {task.reminder && !overdue && !task.completed && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--theme-white-alpha-10)] px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-[var(--theme-glass-border)]">
                    <Clock className="h-2.5 w-2.5" />{new Date(task.reminder).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* Delete */}
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => onDelete(task.id)}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200">
              <Trash2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//              QUEST CARD — Minimal Mode
// ════════════════════════════════════════════════════════════
function MinimalQuestCard({ task, index, onComplete, onDelete }: {
  task: ReturnType<typeof useTaskStore.getState>['tasks'][0];
  index: number; onComplete: (id: string, xp: number) => void; onDelete: (id: string) => void;
}) {
  const cfg = DIFFICULTY_CONFIG[task.difficulty];
  const overdue = isTaskOverdue(task);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.2, delay: index * 0.02 }}>
      <div className={`flex items-center gap-3 p-3 rounded-xl border bg-card transition-all ${task.completed ? 'opacity-50 border-border' : overdue ? 'border-destructive/50' : 'border-border'}`} style={overdue ? { boxShadow: '0 0 8px rgba(239,68,68,0.15)' } : undefined}>
        {/* Checkbox */}
        {task.completed ? (
          <div className="flex-shrink-0 h-5 w-5 rounded-md bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        ) : (
          <button onClick={() => onComplete(task.id, cfg.xp)}
            className="flex-shrink-0 h-5 w-5 rounded-md border-2 border-muted-foreground/30 hover:border-primary/50 transition-colors" />
        )}
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</span>
          {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold ${cfg.color}`}>+{cfg.xp}</span>
        {overdue && (
          <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold text-destructive">
            <Clock className="h-2.5 w-2.5" />
          </span>
        )}
        {task.reminder && !overdue && !task.completed && (
          <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
          </span>
        )}
        <button onClick={() => onDelete(task.id)}
          className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 hover:text-destructive transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//               QUEST SECTION + GROUPED LIST
// ════════════════════════════════════════════════════════════
function QuestSection({ emoji, title, tasks, onComplete, onDelete, gameMode }: {
  emoji: string; title: string; tasks: ReturnType<typeof useTaskStore.getState>['tasks'];
  onComplete: (id: string, xp: number) => void; onDelete: (id: string) => void; gameMode: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  if (tasks.length === 0) return null;
  const Card = gameMode ? GameQuestCard : MinimalQuestCard;

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 mb-2.5 w-full">
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        </motion.div>
        {gameMode ? (
          <>
            <span className="text-base">{emoji}</span>
            <span className="text-sm font-bold text-foreground">{title}</span>
            <div className="ml-auto rounded-lg bg-[var(--theme-white-alpha-5)] px-2 py-0.5">
              <span className="text-[10px] font-bold text-muted-foreground">{tasks.length}</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <span className="text-xs text-muted-foreground">({tasks.length})</span>
          </>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="space-y-2">
              <AnimatePresence>{tasks.map((task, index) => <Card key={task.id} task={task} onComplete={onComplete} onDelete={onDelete} index={index} />)}</AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupedTaskList({ generalTasks, categoryGroups, hasAny, onComplete, onDelete, gameMode }: {
  generalTasks: ReturnType<typeof useTaskStore.getState>['tasks'];
  categoryGroups: { category: Category; tasks: ReturnType<typeof useTaskStore.getState>['tasks'] }[];
  hasAny: boolean; onComplete: (id: string, xp: number) => void; onDelete: (id: string) => void; gameMode: boolean;
}) {
  if (!hasAny) {
    if (gameMode) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl mb-4">📜</motion.div>
          <p className="font-black text-lg text-foreground">Нет активных квестов</p>
          <p className="text-sm text-muted-foreground mt-1">Примите новый квест, чтобы начать!</p>
        </motion.div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-semibold text-foreground">Нет задач</p>
        <p className="text-sm text-muted-foreground mt-1">Нажмите + чтобы добавить</p>
      </motion.div>
    );
  }
  return (
    <div className="space-y-5">
      {generalTasks.length > 0 && <QuestSection emoji="📋" title={gameMode ? 'Общие' : 'Общие'} tasks={generalTasks} onComplete={onComplete} onDelete={onDelete} gameMode={gameMode} />}
      {categoryGroups.map((g) => <QuestSection key={g.category.id} emoji={g.category.emoji} title={g.category.name} tasks={g.tasks} onComplete={onComplete} onDelete={onDelete} gameMode={gameMode} />)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//               MODE TOGGLE BUTTON
// ════════════════════════════════════════════════════════════
function ModeToggle({ gameMode, setMode }: { gameMode: boolean; setMode: (m: 'game' | 'minimal') => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => setMode(gameMode ? 'minimal' : 'game')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
        gameMode
          ? 'glass-strong text-primary animate-pulse-glow'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
      }`}
      title={gameMode ? 'Переключить на минималистичный режим' : 'Переключить на игровой режим'}>
      {gameMode ? <><Gamepad2 className="h-3.5 w-3.5" /><span>Game</span></> : <><Shield className="h-3.5 w-3.5" /><span>Minimal</span></>}
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════
//                    MAIN EXPORT
// ════════════════════════════════════════════════════════════
export default function Home() {
  const store = useTaskStore();
  const [activePage, setActivePage] = useState<'home' | 'achievements' | 'types' | 'settings'>('home');
  const [navHidden, setNavHidden] = useState(false);
  const { gameMode, mode, setMode } = useGameMode();

  // Hide nav when modal is open; also detect mobile keyboard via visualViewport
  useEffect(() => {
    if (navHidden) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [navHidden]);

  // Use visualViewport to detect mobile keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      // If visual viewport is significantly shorter than layout viewport, keyboard is open
      const keyboardOpen = vv.height < window.innerHeight * 0.75;
      if (keyboardOpen && navHidden) {
        document.documentElement.style.setProperty('--nav-display', 'none');
      } else if (!navHidden) {
        document.documentElement.style.setProperty('--nav-display', 'block');
      }
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [navHidden]);

  return (
    <div className={`min-h-dvh bg-background ${gameMode ? 'bg-mesh' : ''} flex flex-col relative`}>
      {gameMode && <FloatingParticles />}
      <div className="flex-1 overflow-y-auto pb-24 relative z-10">
        <div className="mx-auto max-w-lg px-4 pt-4">
          <AnimatePresence mode="wait">
            {activePage === 'home' && <HomePage key="home" store={store} gameMode={gameMode} onModalOpen={() => setNavHidden(true)} onModalClose={() => setNavHidden(false)} />}
            {activePage === 'achievements' && <AchievementsPage key="achievements" store={store} gameMode={gameMode} />}
            {activePage === 'types' && <TypesPage key="types" store={store} gameMode={gameMode} />}
            {activePage === 'settings' && <SettingsPage key="settings" store={store} gameMode={gameMode} mode={mode} setMode={setMode} />}
          </AnimatePresence>
        </div>
      </div>
      {!navHidden && <BottomNav activePage={activePage} setActivePage={setActivePage} gameMode={gameMode} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//                      BOTTOM NAV
// ════════════════════════════════════════════════════════════
function BottomNav({ activePage, setActivePage, gameMode }: { activePage: string; setActivePage: (p: 'home' | 'achievements' | 'types' | 'settings') => void; gameMode: boolean }) {
  const tabs = [
    { key: 'home' as const, label: 'Задачи', icon: Swords },
    { key: 'achievements' as const, label: 'Достижения', icon: Trophy },
    { key: 'types' as const, label: 'Типы', icon: Tag },
    { key: 'settings' as const, label: 'Настройки', icon: Settings },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ display: 'var(--nav-display, block)' }}>
      <div className="mx-auto max-w-lg">
        <div className={`mx-3 mb-3 rounded-2xl p-1.5 ${gameMode ? 'glass-strong' : 'bg-card border border-border'}`}>
          <div className="flex">
            {tabs.map((tab) => {
              const isActive = activePage === tab.key;
              return (
                <button key={tab.key} onClick={() => setActivePage(tab.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-300 relative ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground/60'
                  }`}>
                  {isActive && gameMode && (
                    <motion.div layoutId="nav-indicator"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      style={{ boxShadow: '0 0 20px rgba(var(--theme-accent-glow), 0.1)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  {isActive && !gameMode && (
                    <motion.div layoutId="nav-indicator-minimal"
                      className="absolute inset-0 rounded-xl bg-primary/5 border border-primary/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <motion.div animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="relative z-10">
                    <tab.icon className="h-5 w-5" />
                  </motion.div>
                  <span className="text-[10px] font-bold relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ════════════════════════════════════════════════════════════
//                      HOME PAGE
// ════════════════════════════════════════════════════════════
function HomePage({ store, gameMode, onModalOpen, onModalClose }: {
  store: ReturnType<typeof useTaskStore>; gameMode: boolean;
  onModalOpen: () => void; onModalClose: () => void;
}) {
  const { tasks, categories, totalXp, currentStreak, bestStreak, totalCompleted, addTask, deleteTask, clearCompleted, completeTask } = store;
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [telegramUser, setTelegramUser] = useState('Герой');
  const [activeTab, setActiveTab] = useState('all');
  const [xpPopup, setXpPopup] = useState({ show: false, xp: 0 });
  const [levelUpPopup, setLevelUpPopup] = useState({ show: false, level: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskReminder, setTaskReminder] = useState('');
  const xpRef = useRef<NodeJS.Timeout | null>(null);
  const lvlRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) { tg.ready(); tg.expand(); if (tg.initDataUnsafe?.user?.first_name) setTelegramUser(tg.initDataUnsafe.user.first_name); }
    }, 100);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => () => { if (xpRef.current) clearTimeout(xpRef.current); if (lvlRef.current) clearTimeout(lvlRef.current); }, []);

  const levelInfo = getLevelInfo(totalXp);
  const rank = getRank(levelInfo.level);

  const handleComplete = useCallback((id: string, xp: number) => {
    const prevLevel = getLevelInfo(totalXp).level;
    completeTask(id);
    const newLevel = getLevelInfo(totalXp + xp).level;
    setXpPopup({ show: true, xp });
    if (xpRef.current) clearTimeout(xpRef.current);
    xpRef.current = setTimeout(() => setXpPopup((p) => ({ ...p, show: false })), 1200);
    if (newLevel > prevLevel) {
      setLevelUpPopup({ show: true, level: newLevel });
      if (lvlRef.current) clearTimeout(lvlRef.current);
      lvlRef.current = setTimeout(() => setLevelUpPopup((p) => ({ ...p, show: false })), 2500);
    }
  }, [completeTask, totalXp]);

  const openModal = useCallback(() => { setShowAddForm(true); setTaskReminder(''); onModalOpen(); }, [onModalOpen]);
  const closeModal = useCallback(() => { setShowAddForm(false); setTaskReminder(''); onModalClose(); }, [onModalClose]);

  const handleAdd = useCallback(() => {
    if (!taskTitle.trim()) return;
    const reminderISO = taskReminder ? (() => { try { const d = new Date(); const [h, m] = taskReminder.split(':').map(Number); d.setHours(h, m, 0, 0); return d.toISOString(); } catch { return undefined; } })() : undefined;
    addTask(taskTitle.trim(), taskDescription.trim(), selectedDifficulty, selectedCategoryId || undefined, reminderISO);
    setTaskTitle(''); setTaskDescription(''); setShowDescription(false); setSelectedCategoryId(null); setTaskReminder('');
    closeModal();
  }, [taskTitle, taskDescription, selectedDifficulty, selectedCategoryId, taskReminder, addTask, closeModal]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showDescription) { e.preventDefault(); handleAdd(); }
  }, [handleAdd, showDescription]);

  const filteredTasks = activeTab === 'active' ? tasks.filter((t) => !t.completed) : activeTab === 'completed' ? tasks.filter((t) => t.completed) : tasks;
  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.filter((t) => !t.completed).length;
  const generalTasks = filteredTasks.filter((t) => !t.categoryId);
  const categoryGroups = categories.map((cat) => ({ category: cat, tasks: filteredTasks.filter((t) => t.categoryId === cat.id) })).filter((g) => g.tasks.length > 0);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      <XpPopup xp={xpPopup.xp} show={xpPopup.show} gameMode={gameMode} />
      <LevelUpPopup level={levelUpPopup.level} show={levelUpPopup.show} gameMode={gameMode} />

      {/* ── Mode Toggle ── */}
      <div className="flex justify-end mb-3">
        <ModeToggle gameMode={gameMode} setMode={(m) => {
          document.documentElement.setAttribute('data-mode', m);
          localStorage.setItem('taskquest-mode', m);
        }} />
      </div>

      {/* ── Profile Card ── */}
      {gameMode
        ? <GameProfileCard levelInfo={levelInfo} rank={rank} telegramUser={telegramUser} currentStreak={currentStreak} totalXp={totalXp} totalCompleted={totalCompleted} bestStreak={bestStreak} />
        : <MinimalProfileCard levelInfo={levelInfo} rank={rank} telegramUser={telegramUser} currentStreak={currentStreak} totalXp={totalXp} />
      }

      {/* ── Quest Board ── */}
      <div className="mt-5">
        {gameMode && (
          <div className="flex items-center gap-2 mb-3">
            <Scroll className="h-4 w-4 text-primary" />
            <span className="text-sm font-black text-foreground">Доска квестов</span>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
          </div>
        )}

        {/* Filter Tabs */}
        <div className={`flex gap-1 p-1 rounded-2xl mb-4 ${gameMode ? 'glass-strong' : 'bg-card border border-border'}`}>
          {[
            { key: 'all', label: 'Все', count: tasks.length },
            { key: 'active', label: 'Активные', count: activeCount },
            { key: 'completed', label: 'Готово', count: completedCount },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/60'
              }`}>
              {activeTab === tab.key && (
                <motion.div layoutId={`quest-tab-${gameMode ? 'game' : 'min'}`}
                  className={`absolute inset-0 rounded-xl ${gameMode ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5'}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{tab.label} <span className="text-muted-foreground/60">{tab.count}</span></span>
            </button>
          ))}
        </div>

        <GroupedTaskList generalTasks={generalTasks} categoryGroups={categoryGroups} hasAny={filteredTasks.length > 0} onComplete={handleComplete} onDelete={deleteTask} gameMode={gameMode} />
      </div>

      {/* ── FAB — Add Task ── */}
      <motion.button
        onClick={openModal}
        className={`fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-xl ${
          gameMode
            ? 'bg-gradient-to-br from-primary to-primary/80 animate-pulse-glow'
            : 'bg-primary hover:bg-primary/90'
        }`}
        style={gameMode ? { boxShadow: '0 4px 20px rgba(var(--theme-accent-glow), 0.35)' } : undefined}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
        animate={showAddForm ? { scale: 0, rotate: 90 } : { scale: 1, rotate: 0 }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* ── Add Quest Modal ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={closeModal}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-lg rounded-t-3xl overflow-hidden ${gameMode ? '' : 'bg-card'}`}
              style={gameMode ? { background: 'var(--card)' } : undefined}
              onClick={(e) => e.stopPropagation()}>

              <div className="p-5 space-y-4">
                <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-muted-foreground/20" /></div>

                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${gameMode ? 'bg-primary/10' : 'bg-primary/5'}`}>
                    <Scroll className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-black text-base">{gameMode ? 'Новое задание' : 'Новая задача'}</span>
                </div>

                <Input placeholder={gameMode ? 'Название квеста...' : 'Название задачи...'} value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={handleKeyDown} autoFocus
                  className={`h-11 border rounded-xl ${gameMode
                    ? 'bg-[var(--theme-white-alpha-5)] border-[var(--theme-glass-strong-border)] text-foreground placeholder:text-muted-foreground/60'
                    : 'bg-background border-border text-foreground placeholder:text-muted-foreground/60'
                  }`} />

                <button onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                  {showDescription ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {showDescription ? 'Скрыть описание' : 'Добавить описание'}
                </button>

                <AnimatePresence>
                  {showDescription && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <Textarea placeholder="Описание (необязательно)..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                        className={`min-h-[60px] border rounded-xl resize-none ${gameMode
                          ? 'bg-[var(--theme-white-alpha-5)] border-[var(--theme-glass-strong-border)] text-foreground placeholder:text-muted-foreground/60'
                          : 'bg-background border-border text-foreground placeholder:text-muted-foreground/60'
                        }`} rows={2} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category */}
                {categories.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">{gameMode ? 'Тип квеста' : 'Категория'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setSelectedCategoryId(null)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          selectedCategoryId === null ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-[var(--theme-white-alpha-5)] text-muted-foreground border border-transparent hover:bg-[var(--theme-hover-bg)]'
                        }`}><span className="text-sm">📋</span><span>Без типа</span></button>
                      {categories.map((cat) => (
                        <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                            selectedCategoryId === cat.id ? 'bg-primary/15 text-primary border border-primary/25' : 'bg-[var(--theme-white-alpha-5)] text-muted-foreground border border-transparent hover:bg-[var(--theme-hover-bg)]'
                          }`}><span className="text-sm">{cat.emoji}</span><span>{cat.name}</span></button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2">Сложность</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => {
                      const cfg = DIFFICULTY_CONFIG[diff];
                      return (
                        <motion.button key={diff} onClick={() => setSelectedDifficulty(diff)} whileTap={{ scale: 0.95 }}
                          className={`relative rounded-2xl p-3 text-center transition-all border overflow-hidden ${
                            selectedDifficulty === diff
                              ? gameMode ? `bg-gradient-to-br ${cfg.gradient} ${cfg.color} border-current/20` : `bg-primary/10 text-primary border-primary/20`
                              : `bg-[var(--theme-white-alpha-5)] text-muted-foreground border-transparent hover:bg-[var(--theme-hover-bg)]`
                          }`}>
                          <div className="text-lg mb-0.5">{cfg.icon}</div>
                          <div className="text-xs font-bold">{cfg.label}</div>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <Zap className={`h-3 w-3 ${selectedDifficulty === diff ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-semibold">+{cfg.xp}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Reminder */}
                <div>
                  <button onClick={() => setTaskReminder(taskReminder ? '' : `${String(new Date().getHours() + 1).padStart(2, '0')}:00`)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    {taskReminder ? `Напоминание: ${taskReminder}` : 'Добавить напоминание'}
                    {taskReminder && <X className="h-3 w-3" />}
                  </button>
                  <AnimatePresence>
                    {taskReminder && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden mt-2">
                        <Input
                          type="time"
                          value={taskReminder}
                          onChange={(e) => setTaskReminder(e.target.value)}
                          className={`h-11 rounded-xl ${gameMode
                            ? 'bg-[var(--theme-white-alpha-5)] border-[var(--theme-glass-strong-border)] text-foreground'
                            : 'bg-background border-border text-foreground'
                          }`}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Задача будет подсвечена после этого времени</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button onClick={handleAdd} disabled={!taskTitle.trim()}
                  className={`w-full h-11 font-bold rounded-xl shadow-lg border-0 ${
                    gameMode
                      ? 'bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {gameMode ? 'Принять квест' : 'Добавить'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {completedCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 mb-4">
          <Button variant="ghost" onClick={clearCompleted} className="w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-medium">
            <Trash2 className="h-4 w-4 mr-2" />Очистить выполненные ({completedCount})
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//              ACHIEVEMENT UNLOCK POPUP
// ════════════════════════════════════════════════════════════
function AchievementUnlockPopup({ store, gameMode }: { store: ReturnType<typeof useTaskStore>; gameMode: boolean }) {
  const { newlyUnlocked, dismissNewAchievement } = store;
  const achievement = newlyUnlocked ? ALL_ACHIEVEMENTS.find((a) => a.id === newlyUnlocked) : null;
  if (!achievement) return null;
  const rarityColors = { common: 'from-slate-400 to-zinc-500', rare: 'from-blue-400 to-cyan-500', epic: 'from-purple-500 to-fuchsia-500', legendary: 'from-amber-400 to-orange-500' };
  const rarityLabels = { common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legendary: 'Легендарное' };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto"
        onClick={dismissNewAchievement}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0, y: 60, rotate: -10 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="relative w-[300px] rounded-3xl overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          style={gameMode ? { background: 'var(--card)' } : undefined}
        >
          {/* Glow background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[achievement.rarity]} opacity-20`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
          {/* Shimmer */}
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />

          <div className="relative p-6 text-center">
            <motion.div
              animate={{ y: [0, -6, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-3"
            >{achievement.icon}</motion.div>
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r ${rarityColors[achievement.rarity]} bg-clip-text text-transparent mb-1`}>
              {rarityLabels[achievement.rarity]}
            </div>
            <div className="text-sm font-bold text-foreground mb-0.5">Достижение разблокировано!</div>
            <div className="text-xl font-black text-foreground">{achievement.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{achievement.desc}</div>
            <button onClick={dismissNewAchievement} className="mt-4 w-full h-9 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
              Отлично!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════
//                    ACHIEVEMENTS PAGE
// ════════════════════════════════════════════════════════════
function AchievementsPage({ store, gameMode }: { store: ReturnType<typeof useTaskStore>; gameMode: boolean }) {
  const { achievements, achievementDates, totalXp, totalCompleted, bestStreak, categories, selectedAvatar, setAvatar } = store;
  const [activeSection, setActiveSection] = useState<'achievements' | 'avatars'>('achievements');
  const levelInfo = getLevelInfo(totalXp);
  const rank = getRank(levelInfo.level);

  const unlockedCount = achievements.length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const rarityColors: Record<string, string> = { common: 'border-slate-400/30 bg-slate-500/5', rare: 'border-blue-400/30 bg-blue-500/5', epic: 'border-purple-400/30 bg-purple-500/5', legendary: 'border-amber-400/30 bg-amber-500/5' };
  const rarityTextColors: Record<string, string> = { common: 'text-slate-400', rare: 'text-blue-400', epic: 'text-purple-400', legendary: 'text-amber-400' };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
      <AchievementUnlockPopup store={store} gameMode={gameMode} />

      <header className="flex items-center gap-3 py-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gameMode ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20' : 'bg-amber-500/10'}`}>
          <Award className={`h-6 w-6 ${gameMode ? 'text-white' : 'text-amber-500'}`} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Достижения</h1>
          <p className="text-[11px] text-muted-foreground font-medium">{unlockedCount} / {totalCount} получено</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className={`rounded-2xl p-4 ${gameMode ? 'glass-strong' : 'bg-card border border-border'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">Прогресс</span>
          <span className="text-xs font-bold text-primary">{Math.round((unlockedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-foreground/10 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
            initial={{ width: 0 }} animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
      </div>

      {/* Section toggle */}
      <div className={`flex gap-1 p-1 rounded-2xl mt-4 ${gameMode ? 'glass-strong' : 'bg-card border border-border'}`}>
        {[
          { key: 'achievements' as const, label: '🏅 Награды' },
          { key: 'avatars' as const, label: '🎭 Аватары' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveSection(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeSection === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/60'
            }`}>
            {activeSection === tab.key && (
              <motion.div layoutId="ach-tab"
                className={`absolute inset-0 rounded-xl ${gameMode ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5'}`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'achievements' && (
          <motion.div key="ach-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {ALL_ACHIEVEMENTS.map((ach, i) => {
                const isUnlocked = achievements.includes(ach.id);
                const unlockDate = achievementDates[ach.id];
                return (
                  <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`rounded-2xl p-3 border transition-all ${isUnlocked
                      ? `${rarityColors[ach.rarity]} ${gameMode ? 'glass' : ''}`
                      : `${gameMode ? 'glass opacity-40' : 'bg-card border-border opacity-40'}`
                    }`}>
                    <div className="text-3xl mb-2 relative">
                      <span className={isUnlocked ? '' : 'grayscale'}>{ach.icon}</span>
                      {isUnlocked && <span className="absolute -top-1 -right-1 text-xs">✅</span>}
                      {!isUnlocked && <Lock className="absolute -top-1 -right-1 h-3.5 w-3.5 text-muted-foreground/40" />}
                    </div>
                    <div className={`text-xs font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground/60'}`}>{ach.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{ach.desc}</div>
                    {unlockDate && (
                      <div className="text-[9px] text-muted-foreground/50 mt-1.5 font-medium">
                        {new Date(unlockDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeSection === 'avatars' && (
          <motion.div key="avatar-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-4">
            {/* Current avatar preview */}
            <div className={`rounded-2xl p-5 text-center mb-4 relative overflow-hidden ${gameMode ? 'glass-strong' : 'bg-card border border-border'}`}
              style={gameMode ? { boxShadow: `0 0 25px rgba(var(--theme-accent-glow), 0.15), 0 8px 32px rgba(0,0,0,0.3)` } : undefined}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
              <div className="relative">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="text-6xl mb-2 inline-block"
                  style={{ filter: `drop-shadow(0 0 12px ${ALL_AVATARS.find(a => a.id === selectedAvatar)?.glowColor || 'transparent'})` }}>
                  {ALL_AVATARS.find((a) => a.id === selectedAvatar)?.emoji || '⭐'}
                </motion.div>
                <div className="text-lg font-black text-foreground">{ALL_AVATARS.find((a) => a.id === selectedAvatar)?.name || 'Новобранец'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Текущий аватар</div>
              </div>
            </div>

            {/* Avatar grid */}
            <div className="space-y-2">
              {ALL_AVATARS.map((avatar, i) => {
                const isUnlocked = levelInfo.level >= avatar.requiredLevel;
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <motion.button key={avatar.id} onClick={() => isUnlocked && setAvatar(avatar.id)}
                    whileTap={isUnlocked ? { scale: 0.97 } : {}}
                    disabled={!isUnlocked}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left overflow-hidden ${
                      isSelected
                        ? gameMode ? 'glass-strong ring-1 ring-primary/50' : 'border-2 border-primary bg-primary/5'
                        : isUnlocked
                          ? gameMode ? 'glass-strong' : 'border border-border bg-card hover:bg-muted/50'
                          : `${gameMode ? 'glass opacity-40' : 'bg-card border-border opacity-40'}`
                    }`}>
                    <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${avatar.gradient} flex-shrink-0 flex items-center justify-center shadow-sm overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''}`}
                      style={isSelected ? { boxShadow: `0 0 12px ${avatar.glowColor}` } : undefined}>
                      <span className="text-2xl">{avatar.emoji}</span>
                      {!isUnlocked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock className="h-4 w-4 text-white/60" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">{avatar.name}</span>
                        {isSelected && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">Выбран</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isUnlocked ? 'Разблокирован' : `Требуется уровень ${avatar.requiredLevel}`}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//                       TYPES PAGE
// ════════════════════════════════════════════════════════════
function TypesPage({ store, gameMode }: { store: ReturnType<typeof useTaskStore>; gameMode: boolean }) {
  const { categories, addCategory, deleteCategory, updateCategory } = store;
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📝');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);

  const handleCreate = useCallback(() => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatEmoji);
    setNewCatName(''); setNewCatEmoji('📝'); setShowEmojiPicker(false);
  }, [newCatName, newCatEmoji, addCategory]);

  const handleSave = useCallback(() => {
    if (!editingCat || !editName.trim()) return;
    updateCategory(editingCat.id, editName.trim(), editEmoji);
    setEditingCat(null); setShowEditEmojiPicker(false);
  }, [editingCat, editName, editEmoji, updateCategory]);

  const startEdit = useCallback((cat: Category) => { setEditingCat(cat); setEditName(cat.name); setEditEmoji(cat.emoji); }, []);
  const handleDelete = useCallback((id: string) => { deleteCategory(id); if (editingCat?.id === id) setEditingCat(null); }, [deleteCategory, editingCat]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
      <header className="flex items-center gap-3 py-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gameMode ? 'bg-gradient-to-br from-purple-400 to-fuchsia-500 shadow-lg shadow-purple-500/20' : 'bg-purple-500/10'}`}>
          <Tag className={`h-6 w-6 ${gameMode ? 'text-white' : 'text-purple-500'}`} />
        </div>
        <div>
          <h1 className={`text-xl font-black tracking-tight ${gameMode ? 'text-gradient-fire' : 'text-foreground'}`}>Типы задач</h1>
          <p className="text-[11px] text-muted-foreground font-medium">Управляй категориями</p>
        </div>
      </header>

      <Card className={`rounded-2xl overflow-hidden ${gameMode ? 'border-0 glass-strong' : 'border border-border'}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all flex-shrink-0 ${
                gameMode ? 'bg-[var(--theme-white-alpha-5)] border border-[var(--theme-glass-strong-border)] hover:bg-[var(--theme-hover-bg)]' : 'bg-background border border-border'
              }`}>{newCatEmoji}</button>
            <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Название типа..."
              className={`h-11 rounded-xl ${gameMode
                ? 'bg-[var(--theme-white-alpha-5)] border-[var(--theme-glass-strong-border)] text-foreground placeholder:text-muted-foreground/60'
                : 'bg-background border-border text-foreground placeholder:text-muted-foreground/60'
              }`} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} />
          </div>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <EmojiPicker selected={newCatEmoji} onSelect={(emoji) => { setNewCatEmoji(emoji); setShowEmojiPicker(false); }} gameMode={gameMode} />
              </motion.div>
            )}
          </AnimatePresence>
          <Button className={`w-full h-11 font-bold rounded-xl shadow-lg border-0 ${
            gameMode ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 text-white shadow-purple-500/20' : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`} onClick={handleCreate} disabled={!newCatName.trim()}>
            <Plus className="h-4 w-4 mr-2" />Создать тип
          </Button>
        </CardContent>
      </Card>

      <div className="mt-5">
        <p className="text-sm font-bold text-foreground mb-3">Все типы <span className="text-muted-foreground font-medium">({categories.length})</span></p>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            {gameMode ? (
              <>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4">🏷️</motion.div>
                <p className="font-bold text-foreground">Пока нет типов</p>
                <p className="text-sm text-muted-foreground mt-1">Создай первый тип выше!</p>
              </>
            ) : (
              <>
                <p className="text-3xl mb-3">🏷️</p>
                <p className="font-semibold text-foreground">Пусто</p>
                <p className="text-sm text-muted-foreground mt-1">Создай первый тип</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat, index) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className={`rounded-2xl overflow-hidden ${gameMode ? 'border-0 glass-strong' : 'border border-border'}`}>
                  {editingCat?.id === cat.id ? (
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all flex-shrink-0 ${
                            gameMode ? 'bg-[var(--theme-white-alpha-5)] border border-[var(--theme-glass-strong-border)] hover:bg-[var(--theme-hover-bg)]' : 'bg-background border border-border'
                          }`}>{editEmoji}</button>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Название..."
                          className={`h-11 rounded-xl ${gameMode
                            ? 'bg-[var(--theme-white-alpha-5)] border-[var(--theme-glass-strong-border)] text-foreground placeholder:text-muted-foreground/60'
                            : 'bg-background border-border text-foreground placeholder:text-muted-foreground/60'
                          }`} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditingCat(null); }} />
                      </div>
                      <AnimatePresence>
                        {showEditEmojiPicker && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <EmojiPicker selected={editEmoji} onSelect={(emoji) => { setEditEmoji(emoji); setShowEditEmojiPicker(false); }} gameMode={gameMode} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1 h-9 rounded-xl" onClick={() => setEditingCat(null)}>Отмена</Button>
                        <Button className="flex-1 h-9 bg-purple-500 hover:bg-purple-600 text-white rounded-xl" onClick={handleSave} disabled={!editName.trim()}>Сохранить</Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${gameMode ? 'bg-[var(--theme-white-alpha-5)]' : 'bg-muted'}`}>{cat.emoji}</div>
                          <span className="font-bold text-sm">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(cat)} className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground/60 hover:text-purple-400 hover:bg-purple-500/10 transition-all"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(cat.id)} className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
//                     SETTINGS PAGE
// ════════════════════════════════════════════════════════════
function SettingsPage({ store, gameMode, mode, setMode }: {
  store: ReturnType<typeof useTaskStore>; gameMode: boolean;
  mode: 'game' | 'minimal'; setMode: (m: 'game' | 'minimal') => void;
}) {
  const { totalXp, totalCompleted, bestStreak, currentStreak, categories, clearCompleted, resetAll } = store;
  const { theme, setTheme } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const levelInfo = getLevelInfo(totalXp);
  const rank = getRank(levelInfo.level);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
      <header className="flex items-center gap-3 py-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gameMode ? 'bg-gradient-to-br from-slate-400 to-zinc-500 shadow-lg shadow-slate-500/20' : 'bg-muted'}`}>
          <Settings className={`h-6 w-6 ${gameMode ? 'text-white' : 'text-foreground'}`} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">Настройки</h1>
          <p className="text-[11px] text-muted-foreground font-medium">Персонализация</p>
        </div>
      </header>

      {/* ── Mode Toggle (Settings) ── */}
      <Card className={`rounded-2xl overflow-hidden ${gameMode ? 'border-0 glass-strong' : 'border border-border'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gameMode ? 'bg-primary/10' : 'bg-primary/5'}`}>
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Режим интерфейса</p>
                <p className="text-[11px] text-muted-foreground">{mode === 'game' ? 'Геймифицированный' : 'Минималистичный'}</p>
              </div>
            </div>
            <button onClick={() => setMode(mode === 'game' ? 'minimal' : 'game')}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${mode === 'game' ? 'bg-primary' : 'bg-muted'}`}>
              <motion.div animate={{ x: mode === 'game' ? 26 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                {mode === 'game' ? <Gamepad2 className="h-3.5 w-3.5 text-primary" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
              </motion.div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Profile Card (mini) ── */}
      <div className={`mt-4 relative overflow-hidden rounded-3xl ${gameMode ? 'glass-strong' : 'border border-border'}`} style={gameMode ? { boxShadow: `0 0 20px rgba(var(--theme-accent-glow), 0.15), 0 8px 32px rgba(0,0,0,0.3)` } : undefined}>
        {gameMode && <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/20 to-transparent" />}
        {gameMode && <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 15%, var(--theme-mesh1), transparent 55%)' }} />}
        {gameMode && <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 85%, var(--theme-mesh2), transparent 55%)' }} />}
        {gameMode && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.06),transparent_60%)]" />}
        <div className={`relative p-5 ${!gameMode ? 'bg-card' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${gameMode ? 'bg-[var(--theme-glass-strong-bg)] border border-[var(--theme-glass-strong-border)]' : 'bg-muted'}`}>
              <span className="text-4xl">{rank.emoji}</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{rank.name}</div>
              <div className="text-2xl font-black text-foreground">Уровень {levelInfo.level}</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">{totalXp} XP всего</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Theme Selection ── */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10"><Palette className="h-3.5 w-3.5 text-primary" /></div>
          <span className="text-sm font-bold text-foreground">Тема оформления</span>
        </div>
        <div className="space-y-2">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <motion.button key={t.id} onClick={() => setTheme(t.id)} whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left overflow-hidden ${
                  gameMode
                    ? `glass-strong ${isActive ? 'ring-1 ring-primary/50' : ''}`
                    : `border ${isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`
                }`}>
                <div className={`relative h-10 w-10 rounded-xl bg-gradient-to-br ${t.preview} flex-shrink-0 shadow-sm overflow-hidden`}>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{t.emoji}</span>
                    <span className="text-sm font-bold text-foreground">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
                {isActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary flex-shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Stats ── */}
      <Card className={`rounded-2xl mt-4 overflow-hidden ${gameMode ? 'border-0 glass-strong' : 'border border-border'}`}>
        <CardContent className="p-4">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-3">Статистика</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Zap, label: 'Всего XP', value: `${totalXp}`, gradient: 'from-emerald-500/15 to-emerald-600/5' },
              { icon: Target, label: 'Выполнено', value: `${totalCompleted}`, gradient: 'from-blue-500/15 to-blue-600/5' },
              { icon: Flame, label: 'Текущая серия', value: `${currentStreak}`, gradient: 'from-orange-500/15 to-orange-600/5' },
              { icon: Trophy, label: 'Лучшая серия', value: `${bestStreak}`, gradient: 'from-amber-500/15 to-amber-600/5' },
              { icon: Tag, label: 'Типов задач', value: `${categories.length}`, gradient: 'from-purple-500/15 to-purple-600/5' },
              { icon: Medal, label: 'До след. ур.', value: `${levelInfo.xpForNext - levelInfo.xpInLevel} XP`, gradient: 'from-cyan-500/15 to-cyan-600/5' },
            ].map(({ icon: Icon, label, value, gradient }, i) => (
              <div key={i} className={`rounded-2xl bg-gradient-to-br ${gradient} p-3 ${gameMode ? 'border border-[var(--theme-glass-border)]' : 'border border-border'}`}>
                <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground font-medium">{label}</span></div>
                <p className="text-lg font-black">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <Card className={`rounded-2xl mt-3 overflow-hidden ${gameMode ? 'border-0 glass-strong' : 'border border-border'}`}>
        <CardContent className="p-2">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-2 pt-2 pb-1">Действия</p>
          <button onClick={clearCompleted} className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left hover:bg-[var(--theme-hover-bg)] transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15"><Trash2 className="h-4 w-4 text-amber-400" /></div>
            <div><p className="text-sm font-bold">Удалить выполненные</p><p className="text-[11px] text-muted-foreground">Убрать все завершённые задания</p></div>
          </button>
          <div className={`mx-3 ${gameMode ? 'border-t border-[var(--theme-glass-border)]' : 'border-t border-border'}`} />
          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left hover:bg-destructive/5 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><RotateCcw className="h-4 w-4 text-destructive" /></div>
              <div><p className="text-sm font-bold text-destructive">Сбросить прогресс</p><p className="text-[11px] text-muted-foreground">Удалить все данные</p></div>
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mx-1 mb-1 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 space-y-3">
              <p className="text-sm font-bold text-destructive">⚠️ Вы уверены? Это удалит ВСЁ!</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 h-9 rounded-xl" onClick={() => setShowResetConfirm(false)}>Отмена</Button>
                <Button size="sm" className="flex-1 h-9 bg-destructive hover:bg-destructive/90 text-white rounded-xl" onClick={() => { resetAll(); window.location.reload(); }}>Удалить всё</Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ── About ── */}
      <Card className={`rounded-2xl mt-3 mb-4 overflow-hidden ${gameMode ? 'border-0 glass-strong' : 'border border-border'}`}>
        <CardContent className="p-4">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-3">О приложении</p>
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gameMode ? 'bg-gradient-to-br from-emerald-400 to-cyan-500' : 'bg-primary/10'}`}>
              <Gamepad2 className={`h-6 w-6 ${gameMode ? 'text-white' : 'text-primary'}`} />
            </div>
            <div>
              <p className="font-black text-sm">TaskQuest <span className="text-muted-foreground font-medium">v3.0</span></p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">Геймифицированный менеджер задач для Telegram</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { icon: Shield, text: 'Данные хранятся локально на устройстве' },
              { icon: Zap, text: 'Выполняй задания — получай опыт' },
              { icon: Flame, text: 'Поддерживай серию каждый день' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" /><span>{text}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

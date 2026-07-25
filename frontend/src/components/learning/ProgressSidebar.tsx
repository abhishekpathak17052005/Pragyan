import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Target, Award, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressSidebarProps {
  currentLevel: number;
  totalXp: number;
  streak: number;
  currentWeek?: number;
  currentDay?: number;
  dailyGoal?: {
    lessons: number;
    xp: number;
  };
  achievements?: Array<{
    id: string;
    title: string;
    icon: string;
    unlockedAt?: Date;
  }>;
}

export const ProgressSidebar = memo(function ProgressSidebar({
  currentLevel,
  totalXp,
  streak,
  currentWeek = 1,
  currentDay = 1,
  dailyGoal = { lessons: 1, xp: 100 },
  achievements = [],
}: ProgressSidebarProps) {
  const xpForNextLevel = (currentLevel + 1) * 1000;
  const xpProgress = ((totalXp % 1000) / 1000) * 100;

  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="hidden lg:flex flex-col gap-4 w-full"
    >
      {/* Level & XP */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-lg">Level {currentLevel}</h3>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-white/20 rounded-lg"
          >
            <TrendingUp className="h-5 w-5" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">Next Level</span>
              <span className="text-white/80">{totalXp % 1000} / 1000 XP</span>
            </div>
            <Progress value={xpProgress} className="h-2.5 bg-white/20" />
          </div>

          <div className="pt-2 border-t border-white/20">
            <p className="text-sm text-white/80">Total XP</p>
            <p className="text-3xl font-black mt-1">{totalXp}</p>
          </div>
        </div>
      </motion.div>

      {/* Streak */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80 font-semibold">Streak 🔥</p>
            <p className="text-4xl font-black mt-2">{streak}</p>
            <p className="text-xs text-white/80 mt-1">days in a row</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-5xl"
          >
            🔥
          </motion.div>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-md"
      >
        <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide mb-4">
          Your Progress
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Week {currentWeek}
              </span>
              <span className="text-xs text-slate-600">Day {currentDay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <Progress value={25} className="flex-1 h-2" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-600 font-medium mb-2">Daily Goal</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Lessons</span>
                <span className="text-xs font-semibold text-blue-600">
                  1/{dailyGoal.lessons}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">XP</span>
                <span className="text-xs font-semibold text-purple-600">
                  50/{dailyGoal.xp}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-md"
        >
          <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide mb-4">
            Recent Achievements
          </h4>

          <div className="space-y-3">
            {achievements.slice(0, 3).map((achievement, idx) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-blue-50 transition-colors"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {achievement.title}
                  </p>
                  {achievement.unlockedAt && (
                    <p className="text-xs text-slate-600">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Learning Tips */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-5"
      >
        <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
          💡 Pro Tip
        </p>
        <p className="text-sm text-blue-900 leading-relaxed">
          Consistent daily practice is the key to mastering {currentLevel}. You're doing great!
        </p>
      </motion.div>
    </motion.div>
  );
});

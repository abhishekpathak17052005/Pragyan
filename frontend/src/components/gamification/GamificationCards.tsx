import { motion } from 'framer-motion';
import { Flame, Zap, Award, Trending } from 'lucide-react';

/**
 * Streak Card - Shows current day streak
 */
export function StreakCard({ 
  streak, 
  isLoading = false 
}: { 
  streak: number
  isLoading?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg p-6 text-white"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">Current Streak</p>
          {isLoading ? (
            <div className="h-8 bg-white/20 rounded-lg w-20 mt-2 animate-pulse" />
          ) : (
            <motion.h3 
              className="text-4xl font-bold mt-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {streak}
            </motion.h3>
          )}
          <p className="text-xs opacity-75 mt-2">days in a row</p>
        </div>
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Flame className="w-10 h-10 text-white drop-shadow-lg" />
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * XP Card - Shows total XP earned
 */
export function XpCard({ 
  xp, 
  nextLevelXp = 1000,
  isLoading = false 
}: { 
  xp: number
  nextLevelXp?: number
  isLoading?: boolean
}) {
  const xpPercent = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg p-6 text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-90">Total XP</p>
          {isLoading ? (
            <div className="h-8 bg-white/20 rounded-lg w-24 mt-2 animate-pulse" />
          ) : (
            <motion.h3 
              className="text-4xl font-bold mt-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              {xp.toLocaleString()}
            </motion.h3>
          )}
        </div>
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-10 h-10 text-white drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Progress to next level */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="opacity-90">Next Level</span>
          <span className="opacity-75">
            {xp.toLocaleString()} / {nextLevelXp.toLocaleString()}
          </span>
        </div>
        <motion.div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-white rounded-full"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Badge Card - Shows earned badges
 */
export function BadgeCard({ 
  badges = [], 
  isLoading = false 
}: { 
  badges?: Array<{ id: string; name: string; icon: string; earnedAt: string }>
  isLoading?: boolean
}) {
  const recentBadges = badges.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl shadow-lg p-6 text-white"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-90">Badges Earned</p>
          {isLoading ? (
            <div className="h-8 bg-white/20 rounded-lg w-16 mt-2 animate-pulse" />
          ) : (
            <h3 className="text-4xl font-bold mt-2">{badges.length}</h3>
          )}
        </div>
        <Award className="w-10 h-10 text-white drop-shadow-lg" />
      </div>

      {/* Badge List */}
      {badges.length > 0 ? (
        <div className="space-y-2">
          {recentBadges.map((badge, idx) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="opacity-90">{badge.name}</span>
            </motion.div>
          ))}
          {badges.length > 3 && (
            <p className="text-xs opacity-75 mt-2">
              +{badges.length - 3} more badges
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs opacity-75">Complete topics to earn badges</p>
      )}
    </motion.div>
  );
}

/**
 * Level Card - Shows current level
 */
export function LevelCard({ 
  level = 1, 
  currentXp = 0,
  nextLevelXp = 1000,
  isLoading = false 
}: { 
  level?: number
  currentXp?: number
  nextLevelXp?: number
  isLoading?: boolean
}) {
  const levelPercent = Math.min((currentXp / nextLevelXp) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
    >
      <p className="text-sm font-medium opacity-90 mb-2">Level</p>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-white/20 rounded-lg animate-pulse" />
          <div className="h-2 bg-white/20 rounded-full animate-pulse" />
        </div>
      ) : (
        <>
          <motion.div
            className="text-center py-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className="inline-block">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl font-bold"
                >
                  {level}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Progress to next level */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="opacity-90">to Level {level + 1}</span>
              <span className="opacity-75">
                {Math.round(levelPercent)}%
              </span>
            </div>
            <motion.div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

/**
 * Gamification Stats Container - All stats in a grid
 */
export function GamificationStatsGrid({ 
  streak = 0,
  xp = 0,
  level = 1,
  badges = [],
  isLoading = false
}: {
  streak?: number
  xp?: number
  level?: number
  badges?: Array<{ id: string; name: string; icon: string; earnedAt: string }>
  isLoading?: boolean
}) {
  const nextLevelXp = level * 500; // Simple XP calculation for levels

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-1">
        <StreakCard streak={streak} isLoading={isLoading} />
      </div>
      <div className="col-span-1">
        <XpCard xp={xp} nextLevelXp={nextLevelXp} isLoading={isLoading} />
      </div>
      <div className="col-span-1">
        <LevelCard 
          level={level} 
          currentXp={xp} 
          nextLevelXp={nextLevelXp}
          isLoading={isLoading} 
        />
      </div>
      <div className="col-span-1">
        <BadgeCard badges={badges} isLoading={isLoading} />
      </div>
    </div>
  );
}

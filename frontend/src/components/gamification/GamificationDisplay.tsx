import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from './GamificationContext';
import { XPAnimation } from './XPAnimation';
import { BadgeUnlock } from './BadgeUnlock';
import { LevelUpAnimation } from './LevelUpAnimation';
import { StreakAnimation } from './StreakAnimation';
import { MilestoneAnimation } from './MilestoneAnimation';
import { MotivationMessage } from './MotivationMessage';

export const GamificationDisplay = memo(function GamificationDisplay() {
  const { events } = useGamification();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* XP Animations - Floating from bottom right */}
      <div className="fixed bottom-8 right-8 space-y-4 pointer-events-none">
        <AnimatePresence>
          {events
            .filter((e) => e.type === 'xp')
            .map((event) => (
              <XPAnimation key={event.id} event={event} />
            ))}
        </AnimatePresence>
      </div>

      {/* Badge Unlock - Center top */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <AnimatePresence>
          {events
            .filter((e) => e.type === 'badge')
            .slice(-1)
            .map((event) => (
              <BadgeUnlock key={event.id} event={event} />
            ))}
        </AnimatePresence>
      </div>

      {/* Level Up - Full screen */}
      <AnimatePresence>
        {events
          .filter((e) => e.type === 'level_up')
          .slice(-1)
          .map((event) => (
            <LevelUpAnimation key={event.id} event={event} />
          ))}
      </AnimatePresence>

      {/* Streak - Top right */}
      <div className="fixed top-8 right-8 pointer-events-none">
        <AnimatePresence>
          {events
            .filter((e) => e.type === 'streak')
            .slice(-1)
            .map((event) => (
              <StreakAnimation key={event.id} event={event} />
            ))}
        </AnimatePresence>
      </div>

      {/* Milestone - Center */}
      <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <AnimatePresence>
          {events
            .filter((e) => e.type === 'milestone')
            .slice(-1)
            .map((event) => (
              <MilestoneAnimation key={event.id} event={event} />
            ))}
        </AnimatePresence>
      </div>

      {/* Motivation Messages - Bottom center */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <AnimatePresence>
          {events
            .filter((e) => e.type === 'motivation')
            .map((event) => (
              <MotivationMessage key={event.id} event={event} />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { GamificationEvent } from './GamificationContext';

interface MotivationMessageProps {
  event: GamificationEvent;
}

const motivationMessages = [
  '🔥 Keep going!',
  '💪 You\'re doing great!',
  '⚡ Only 2 lessons until your first badge!',
  '🎉 Great work!',
  '⭐ You\'re ahead of 73% of learners!',
  '💎 Amazing consistency!',
  '🚀 You\'re on fire!',
  '📈 Progress is progress!',
  '✨ You\'re learning so fast!',
  '🏆 Keep up the momentum!',
];

export const MotivationMessage = memo(function MotivationMessage({
  event,
}: MotivationMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      className="pointer-events-none"
    >
      <motion.div
        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg text-center shadow-xl max-w-xs"
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: 2,
          ease: 'easeInOut',
        }}
      >
        {event.title}
      </motion.div>
    </motion.div>
  );
});

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { GamificationEvent } from './GamificationContext';

interface StreakAnimationProps {
  event: GamificationEvent;
}

export const StreakAnimation = memo(function StreakAnimation({
  event,
}: StreakAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0, x: 100 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className="pointer-events-none"
    >
      <motion.div
        className="px-6 py-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold shadow-xl flex items-center gap-3"
        animate={{
          scale: [1, 1.05, 1],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 0.6,
          repeat: 3,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
          }}
        >
          <Flame className="h-6 w-6" />
        </motion.div>
        <span className="text-lg">{event.title}</span>
      </motion.div>
    </motion.div>
  );
});

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import type { GamificationEvent } from './GamificationContext';

interface BadgeUnlockProps {
  event: GamificationEvent;
}

export const BadgeUnlock = memo(function BadgeUnlock({ event }: BadgeUnlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
      className="pointer-events-none"
    >
      <motion.div
        animate={{
          rotate: [0, 10, -10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 0.5,
          delay: 0.3,
        }}
        className="relative w-64 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 p-6 text-white shadow-2xl"
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-r from-white via-transparent to-white"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, delay: 0.2 }}
        />

        {/* Content */}
        <div className="relative text-center space-y-3">
          {/* Icon */}
          <motion.div
            className="text-6xl mx-auto"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
            }}
          >
            {event.icon || '🏆'}
          </motion.div>

          {/* Text */}
          <div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-black text-xl"
            >
              Badge Unlocked!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="font-bold text-white/90"
            >
              {event.title}
            </motion.p>
            {event.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-white/80"
              >
                {event.description}
              </motion.p>
            )}
          </div>

          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                x: Math.cos((i / 8) * Math.PI * 2) * 100,
                y: Math.sin((i / 8) * Math.PI * 2) * 100,
                opacity: 0,
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
});

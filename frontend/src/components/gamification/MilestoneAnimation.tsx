import { memo } from 'react';
import { motion } from 'framer-motion';
import type { GamificationEvent } from './GamificationContext';

interface MilestoneAnimationProps {
  event: GamificationEvent;
}

export const MilestoneAnimation = memo(function MilestoneAnimation({
  event,
}: MilestoneAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
      }}
      className="pointer-events-none"
    >
      <motion.div
        className="relative w-96 rounded-3xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-8 text-white text-center shadow-2xl overflow-hidden"
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Shine */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-20"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Content */}
        <div className="relative space-y-3">
          <motion.div
            className="text-5xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {event.icon || '🎉'}
          </motion.div>

          <h3 className="text-3xl font-black">{event.title}</h3>
          {event.description && (
            <p className="text-lg font-semibold text-white/90">{event.description}</p>
          )}
        </div>

        {/* Confetti */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#FFD700', '#FF69B4', '#00FF00', '#00BFFF'][i % 4],
              left: '50%',
              top: '50%',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: (Math.random() - 0.5) * 300,
              y: (Math.random() - 0.5) * 300 + 200,
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 1.8,
              ease: 'easeOut',
              delay: Math.random() * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
});

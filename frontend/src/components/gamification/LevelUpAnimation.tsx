import { memo } from 'react';
import { motion } from 'framer-motion';
import type { GamificationEvent } from './GamificationContext';

interface LevelUpAnimationProps {
  event: GamificationEvent;
}

export const LevelUpAnimation = memo(function LevelUpAnimation({
  event,
}: LevelUpAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
    >
      {/* Background Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: -100 }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20,
        }}
        className="relative z-10"
      >
        {/* Ring animations */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-4 border-yellow-400"
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              ease: 'easeOut',
            }}
            style={{
              width: 200 + i * 50,
              height: 200 + i * 50,
              left: -100 - i * 25,
              top: -100 - i * 25,
            }}
          />
        ))}

        {/* Main card */}
        <motion.div
          className="relative w-80 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-10 text-white text-center shadow-2xl"
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-300 via-transparent to-yellow-300 opacity-30 blur-xl"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Content */}
          <div className="relative space-y-4">
            <motion.div
              className="text-8xl font-black"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🚀
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black"
            >
              Level Up!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold"
            >
              {event.description}
            </motion.p>

            {/* Particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: 0,
                }}
                transition={{
                  duration: 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.3,
                }}
              />
            ))}

            {/* Fireworks */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`firework-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#FFD700', '#FFA500', '#FF69B4', '#00FF00'][i % 4],
                  left: '50%',
                  top: '50%',
                }}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos((i / 12) * Math.PI * 2) * 200,
                  y: Math.sin((i / 12) * Math.PI * 2) * 200,
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
    </motion.div>
  );
});

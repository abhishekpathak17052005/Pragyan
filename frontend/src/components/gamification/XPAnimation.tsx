import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { GamificationEvent } from './GamificationContext';

interface XPAnimationProps {
  event: GamificationEvent;
}

export const XPAnimation = memo(function XPAnimation({ event }: XPAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.8 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-100, -200],
        x: [-30, 30, 0],
        scale: [0.8, 1.2, 1],
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="pointer-events-none"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg shadow-lg">
        <Zap className="h-5 w-5 animate-pulse" />
        <span>{event.title}</span>
      </div>
    </motion.div>
  );
});

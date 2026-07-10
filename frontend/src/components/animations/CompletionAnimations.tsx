import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Trophy } from 'lucide-react';

/**
 * Checkmark animation that appears when resource is completed
 */
export function CheckmarkAnimation({ 
  isVisible, 
  onComplete 
}: { 
  isVisible: boolean
  onComplete?: () => void 
}) {
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-emerald-500 rounded-full p-4 shadow-2xl"
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * XP float animation - numbers float up from element
 */
export function XpFloatAnimation({ 
  amount, 
  isVisible,
  x,
  y
}: { 
  amount: number
  isVisible: boolean
  x: number
  y: number
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            x, 
            y, 
            opacity: 1, 
            scale: 1 
          }}
          animate={{ 
            x: x + 50, 
            y: y - 100, 
            opacity: 0, 
            scale: 0.5 
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="fixed pointer-events-none z-50 font-bold text-yellow-500 text-xl"
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Progress bar fill animation
 */
export function ProgressBarAnimation({ 
  value, 
  duration = 0.8 
}: { 
  value: number
  duration?: number
}) {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration, ease: 'easeOut' }}
      className="h-2 bg-emerald-500 rounded-full"
    />
  );
}

/**
 * Milestone celebration - appears when completing week/module
 */
export function MilestoneAnimation({ 
  isVisible, 
  title,
  icon = '⭐'
}: { 
  isVisible: boolean
  title: string
  icon?: string
}) {
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {}, 2000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <motion.div
            animate={{ 
              y: [-10, 10, -10],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm"
          >
            <div className="text-5xl mb-4">{icon}</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Milestone!</h3>
            <p className="text-slate-600">{title}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Confetti-style success burst (subtle version)
 */
export function SuccessBurst({ 
  isVisible 
}: { 
  isVisible: boolean
}) {
  const particles = Array.from({ length: 12 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {particles.map((i) => (
            <motion.div
              key={i}
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1, 
                scale: 1 
              }}
              animate={{ 
                x: Math.cos((i / 12) * Math.PI * 2) * 200,
                y: Math.sin((i / 12) * Math.PI * 2) * 200 - 100,
                opacity: 0,
                scale: 0
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="fixed top-1/2 left-1/2 w-2 h-2 bg-emerald-500 rounded-full"
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Trophy, Calendar, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getIconComponent } from '@/lib/iconMap';
import type { CareerRoadmap } from '@/types/api';

interface HeroSectionProps {
  career: CareerRoadmap | null;
  progress: number;
  xp: number;
  streak: number;
  onContinue: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const stats = [
  { icon: Calendar, label: 'Duration', key: 'duration' },
  { icon: Award, label: 'Projects', key: 'projects' },
  { icon: Trophy, label: 'Certificate', key: 'certificate' },
  { icon: Zap, label: 'Total XP', key: 'xp' },
];

export const HeroSection = memo(function HeroSection({
  career,
  progress,
  xp,
  streak,
  onContinue,
}: HeroSectionProps) {
  if (!career) return null;

  const stats_data = [
    { label: '6 Months', value: 'Duration' },
    { label: '30+', value: 'Projects' },
    { label: '1', value: 'Certificate' },
    { label: '6000+', value: 'XP' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 text-white shadow-2xl"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Content */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <motion.p
                variants={itemVariants}
                className="text-blue-100 text-sm font-bold uppercase tracking-widest"
              >
                Learning Path
              </motion.p>
              
              {/* Title with Icon */}
              <div className="flex items-center gap-4">
                {career.icon && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, ease: 'backOut' }}
                    className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30"
                  >
                    {(() => {
                      const IconComponent = getIconComponent(career.icon);
                      return <IconComponent className="w-10 h-10 text-white" />;
                    })()}
                  </motion.div>
                )}
                <motion.h1
                  variants={itemVariants}
                  className="text-5xl md:text-6xl font-black tracking-tight leading-tight"
                >
                  {career.title}
                </motion.h1>
              </div>
              
              <motion.p
                variants={itemVariants}
                className="text-blue-100 text-lg leading-relaxed max-w-xl font-light"
              >
                {career.description}
              </motion.p>
            </div>

            {/* Stats Grid */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {stats_data.map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 hover:bg-white/15 transition-colors"
                >
                  <p className="text-white/80 text-xs font-semibold uppercase">
                    {stat.value}
                  </p>
                  <p className="text-2xl font-black text-white mt-1">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Progress Card */}
          <motion.div variants={itemVariants} className="lg:col-span-1 space-y-4">
            {/* Main Progress Card */}
            <motion.div
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
              className="bg-white rounded-2xl p-6 shadow-xl backdrop-blur-sm bg-white/98"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 font-black text-sm uppercase tracking-wide">
                  Your Progress
                </h3>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-2 bg-orange-100 rounded-full"
                >
                  <Flame className="h-5 w-5 text-orange-500" />
                </motion.div>
              </div>

              {/* Circular Progress */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <motion.p
                    key={progress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent"
                  >
                    {progress}%
                  </motion.p>
                  <p className="text-xs text-slate-500 font-medium mt-2">
                    {progress === 100
                      ? '🎉 Completed!'
                      : progress > 50
                        ? '⚡ Great going!'
                        : '🚀 Keep going!'}
                  </p>
                </div>

                {/* Animated Circle */}
                <motion.svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 120 120"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeDasharray={339.29}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 339.29 }}
                    animate={{ strokeDashoffset: 339.29 * (1 - progress / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient
                      id="progressGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1e40af" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </div>

              {/* Linear Progress */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2.5" />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Completion</span>
                  <span className="text-blue-600 font-bold">{progress}%</span>
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl p-4 shadow-lg backdrop-blur-sm"
              >
                <p className="text-slate-600 text-xs font-bold uppercase">
                  Current XP
                </p>
                <p className="text-3xl font-black text-blue-600 mt-1">{xp}</p>
              </motion.div>
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl p-4 shadow-lg backdrop-blur-sm"
              >
                <p className="text-slate-600 text-xs font-bold uppercase flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  Streak
                </p>
                <p className="text-3xl font-black text-orange-500 mt-1">
                  {streak}
                </p>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold h-12 rounded-xl shadow-lg"
              >
                <motion.span
                  className="inline-flex items-center gap-2"
                  whileHover={{ x: 4 }}
                >
                  Continue Learning
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CountUp } from 'use-count-up';
import FloatingDashboard from './FloatingDashboard';

const stats = [
  { value: 95, label: 'Career Match Accuracy', suffix: '%' },
  { value: 243, label: 'Learning Roadmaps', suffix: '+' },
  { value: 500, label: 'Career Paths', suffix: '+' },
  { value: 20000, label: 'Students Guided', suffix: '+', isSeparated: true },
];

export default function HeroSection() {
  const [startCount, setStartCount] = useState(false);

  useEffect(() => {
    setStartCount(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center -mt-20 pt-0 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Left Side */}
          <motion.div variants={itemVariants} className="space-y-8">
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
            >
              <span className="text-1xl">✨</span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                AI Career Intelligence Platform
              </span>
            </motion.div>

            {/* Headline with Gradient Text */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="text-gray-900 dark:text-white">Discover Your Future </span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent animate-pulse">
                  Career
                </span>
                <span className="text-gray-900 dark:text-white"> Powered by </span>
                <span className="bg-gradient-to-r from-purple-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                  AI
                </span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                Discover your strengths, identify skill gaps, and receive a personalized roadmap that helps you become
                industry-ready with AI-powered guidance.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(37, 99, 235, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl transition-all"
              >
                🚀 Start Assessment
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
              >
                ▶ Watch Demo
              </motion.button>
            </div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-200 dark:border-gray-800"
            >
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex items-baseline gap-1">
                    {startCount ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      >
                        <CountUp
                          isCounting={startCount}
                          start={0}
                          end={stat.value}
                          duration={2.5}
                          formatter={(value) => {
                            if (stat.isSeparated) {
                              return (value / 1000).toFixed(0) + 'K';
                            }
                            return value.toString();
                          }}
                        />
                      </motion.div>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                        0
                      </span>
                    )}
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{stat.suffix}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Floating Dashboard */}
          <motion.div
            variants={itemVariants}
            className="hidden lg:block"
          >
            <FloatingDashboard />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function PremiumHero() {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Your AI Career Partner';
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
    }
  }, [displayedText]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Premium Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-300"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
              </motion.div>
              <span className="text-sm font-semibold text-blue-700">
                AI-Powered Career Intelligence
              </span>
            </motion.div>

            {/* Main Headline with typing effect */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
                <span className="text-gray-900">Discover </span>
                <span className="relative inline-block">
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 blur-xl opacity-60"
                    animate={{
                      opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                    }}
                  />
                  <span className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-500 bg-clip-text text-transparent">
                    {displayedText}
                    {!isComplete && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="ml-1"
                      >
                        |
                      </motion.span>
                    )}
                  </span>
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-lg"
              >
                Get AI-powered career insights, personalized learning roadmaps, and placement intelligence. Join thousands of students building their dream careers.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 rounded-xl font-bold text-lg text-white overflow-hidden"
              >
                {/* Glow background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-100 group-hover:opacity-110 transition-opacity" />
                {/* Animated border */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
                {/* Ripple effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ scale: 0, opacity: 1 }}
                  whileHover={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  🚀 Start Free Assessment
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl font-bold text-lg text-blue-600 border-2 border-blue-600 hover:border-blue-700 hover:bg-blue-50 transition-all"
              >
                ▶ Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap gap-8 pt-8 border-t border-gray-300"
            >
              {[
                { value: '95%', label: 'Accuracy' },
                { value: '20K+', label: 'Students' },
                { value: '500+', label: 'Careers' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + idx * 0.1, duration: 0.6 }}
                  className="space-y-2"
                >
                  <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Interactive 3D Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 40 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative hidden lg:block h-96"
          >
            {/* Glow background */}
            <div className="absolute -inset-20 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Dashboard card */}
            <motion.div
              className="relative bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-3xl border border-blue-400/30 p-8 h-full shadow-2xl overflow-hidden group"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Content */}
              <div className="relative h-full flex flex-col justify-between">
                {/* Header */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/50 mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-green-300">95% Match</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Data Scientist</h3>
                </div>

                {/* Chart visualization */}
                <div className="space-y-4">
                  {['Analytical Thinking', 'Problem Solving', 'Technology'].map((skill, idx) => (
                    <motion.div key={skill} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + idx * 0.1 }}>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-300 font-medium">{skill}</span>
                        <span className="text-xs text-blue-300 font-bold">92%</span>
                      </div>
                      <motion.div
                        className="h-1.5 bg-gray-700 rounded-full overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 1.4 + idx * 0.1, duration: 0.8 }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                          initial={{ width: 0 }}
                          animate={{ width: '92%' }}
                          transition={{ delay: 1.5 + idx * 0.1, duration: 1 }}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA in card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full mt-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Explore Assessment →
                </motion.button>
              </div>

              {/* Animated gradient border on hover */}
              <motion.div
                className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 pointer-events-none"
                animate={{
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                style={{
                  borderImage: 'linear-gradient(45deg, #3B82F6, #A855F7) 1',
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

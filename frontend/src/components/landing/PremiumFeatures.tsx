import { motion } from 'framer-motion';
import { Brain, Zap, Target, LineChart, Users, Sparkles } from 'lucide-react';
import { useState } from 'react';

const features = [
  {
    icon: Brain,
    title: 'AI Career Intelligence',
    description: 'Advanced ML analyzes your profile to match you with perfect careers.',
    color: 'from-blue-500 to-cyan-500',
    index: 0,
  },
  {
    icon: Zap,
    title: 'Skill Gap Analysis',
    description: 'Get precise insights into what you need to learn.',
    color: 'from-purple-500 to-pink-500',
    index: 1,
  },
  {
    icon: Target,
    title: 'Personalized Roadmaps',
    description: 'Month-by-month learning plans tailored to your goals.',
    color: 'from-orange-500 to-red-500',
    index: 2,
  },
  {
    icon: LineChart,
    title: 'Progress Analytics',
    description: 'Real-time dashboards tracking your advancement.',
    color: 'from-cyan-500 to-blue-500',
    index: 3,
  },
  {
    icon: Users,
    title: 'Placement Intelligence',
    description: 'AI predicts your success with different companies.',
    color: 'from-emerald-500 to-teal-500',
    index: 4,
  },
  {
    icon: Sparkles,
    title: 'Interview Prep',
    description: 'AI-powered mock interviews with personalized coaching.',
    color: 'from-indigo-500 to-purple-500',
    index: 5,
  },
];

export default function PremiumFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: i * 0.1,
      },
    }),
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center mb-16 space-y-4"
      >
        <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
          Powerful Features
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
          Everything for Your Success
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Comprehensive AI tools to discover, plan, and execute your career vision.
        </p>
      </motion.div>

      {/* Feature Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            custom={feature.index}
            variants={cardVariants}
            onMouseEnter={() => setHoveredIndex(feature.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative"
          >
            {/* Glow background on hover */}
            {hoveredIndex === feature.index && (
              <motion.div
                layoutId={`glow-${feature.index}`}
                className={`absolute -inset-4 bg-gradient-to-r ${feature.color} rounded-2xl blur-2xl opacity-30 -z-10`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
              />
            )}

            {/* Card */}
            <motion.div
              className="relative h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl border border-blue-400/20 p-8 hover:border-blue-400/50 transition-all duration-300 overflow-hidden group"
              whileHover={{ y: -8 }}
            >
              {/* Icon */}
              <motion.div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 shadow-lg`}
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <feature.icon size={28} />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>

              {/* Bottom decoration */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

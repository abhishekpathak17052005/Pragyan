import { motion } from 'framer-motion';
import { Brain, Zap, Target, BookOpen, Briefcase, MessageSquare } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Career Assessment',
    description: 'Advanced AI analyzes your personality, skills, and interests to match you with ideal careers.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Zap,
    title: 'Skill Gap Analysis',
    description: 'Identify exactly what skills you need to learn to reach your dream career.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Target,
    title: 'Personalized Learning Roadmaps',
    description: 'Get a month-by-month learning plan with curated resources and projects.',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: BookOpen,
    title: 'Resume Intelligence',
    description: 'AI-powered resume optimization that catches recruiters\' attention.',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Briefcase,
    title: 'Placement Prediction',
    description: 'Real-time prediction of your chances with different companies.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: MessageSquare,
    title: 'Interview Preparation',
    description: 'AI-powered mock interviews and personalized coaching for success.',
    color: 'from-green-500 to-green-600',
  },
];

export default function WhyPragyan() {
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
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6 },
    },
    hover: {
      y: -8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    },
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Why Choose Pragyan
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Comprehensive Career Intelligence Platform
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to discover, plan, and execute your career goals
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover="hover"
              className="group relative"
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10`} />

              {/* Card */}
              <div className="relative h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-8 hover:border-white/40 dark:hover:border-white/20 transition-all">
                {/* Icon Background */}
                <motion.div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} mb-6 text-white shadow-lg`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <feature.icon size={28} />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Border Animation on Hover */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                  animate={{
                    borderImage: ['linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent) 1'],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

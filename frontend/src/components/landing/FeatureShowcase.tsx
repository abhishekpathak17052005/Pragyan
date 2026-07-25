import { motion } from 'framer-motion';
import { BarChart3, LineChart, Zap, Target, Users, TrendingUp } from 'lucide-react';

const features = [
  {
    title: 'AI Career Matching',
    description:
      'Advanced machine learning algorithms match your profile with 500+ career paths, analyzing compatibility based on skills, interests, and market demand.',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    align: 'left',
  },
  {
    title: 'Adaptive Assessments',
    description:
      'Smart assessments that evolve based on your answers, providing more accurate insights with fewer questions than traditional career tests.',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    align: 'right',
  },
  {
    title: 'Learning Roadmaps',
    description:
      'Month-by-month structured learning paths with recommended resources, projects, and milestones to keep you on track.',
    icon: LineChart,
    color: 'from-orange-500 to-red-500',
    align: 'left',
  },
  {
    title: 'Daily Tasks & Streaks',
    description:
      'Gamified learning experience with daily challenges, XP rewards, achievement badges, and streak tracking to keep motivation high.',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    align: 'right',
  },
  {
    title: 'Progress Analytics',
    description:
      'Real-time dashboards showing your learning progress, skill development, and placement readiness scores with detailed insights.',
    icon: BarChart3,
    color: 'from-blue-500 to-purple-500',
    align: 'left',
  },
  {
    title: 'Placement Intelligence',
    description:
      'AI-powered placement prediction showing your success rate with different companies and personalized strategies to improve chances.',
    icon: Users,
    color: 'from-cyan-500 to-blue-500',
    align: 'right',
  },
];

export default function FeatureShowcase() {
  return (
    <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-20"
        >
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Powerful Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Everything You Need to Succeed
          </h2>
        </motion.div>

        {/* Features */}
        <div className="space-y-20">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                feature.align === 'right' ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: feature.align === 'left' ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Icon */}
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} text-white shadow-lg`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <feature.icon size={32} />
                </motion.div>

                {/* Title & Description */}
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ x: 6 }}
                  className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 hover:gap-4 transition-all"
                >
                  Learn More →
                </motion.button>
              </motion.div>

              {/* Animated Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                {/* Glow Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-3xl blur-3xl opacity-20 -z-10`}
                />

                {/* Glass Card */}
                <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl overflow-hidden">
                  {/* Mock Chart */}
                  <motion.div
                    className="space-y-6"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {/* Animated Bars */}
                    {[40, 65, 45, 80, 55].map((value, i) => (
                      <motion.div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            Metric {i + 1}
                          </span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {value}%
                          </span>
                        </div>
                        <motion.div
                          className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                        >
                          <motion.div
                            className={`h-full bg-gradient-to-r ${feature.color} rounded-full`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: i * 0.1 }}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

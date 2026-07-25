import { motion } from 'framer-motion';
import { CheckCircle, ArrowDown } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Take Assessment',
    description: 'Answer carefully designed questions about your interests, skills, and goals.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    number: 2,
    title: 'AI Analyzes Strengths',
    description: 'Our advanced AI engine processes your responses and identifies your unique strengths.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    number: 3,
    title: 'Career Matches',
    description: 'Get ranked list of careers that align perfectly with your profile.',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    number: 4,
    title: 'Skill Gap Detection',
    description: 'Identify which skills you need to develop to reach your desired career.',
    color: 'from-pink-500 to-pink-600',
  },
  {
    number: 5,
    title: 'Learning Roadmap',
    description: 'Receive a personalized, month-by-month learning plan with resources.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    number: 6,
    title: 'Placement Ready',
    description: 'Get trained, prepared, and ready for interviews and job applications.',
    color: 'from-green-500 to-green-600',
  },
];

export default function HowItWorks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <section id="roadmaps" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-16"
        >
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Our Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            How Pragyan AI Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Six simple steps to discover your career path and prepare for success
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative space-y-8"
        >
          {/* Timeline Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 -translate-x-1/2" />

          {/* Steps */}
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className={`relative flex gap-8 lg:gap-0 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
            >
              {/* Timeline Dot */}
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} border-4 border-[#F8FAFC] dark:border-[#0F172A] shadow-lg flex items-center justify-center text-white font-bold text-sm`}
                >
                  <CheckCircle size={20} />
                </motion.div>
              </div>

              {/* Content */}
              <div className={`w-full lg:w-1/2 ${idx % 2 === 0 ? 'lg:pr-16' : 'lg:pl-16'}`}>
                <motion.div
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-8 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all"
                  whileHover={{ y: -4 }}
                >
                  {/* Number Badge */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} text-white font-bold text-lg mb-4`}>
                    {step.number}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </div>

              {/* Arrow for mobile */}
              {idx < steps.length - 1 && (
                <motion.div className="lg:hidden flex justify-center py-4">
                  <ArrowDown className="w-6 h-6 text-blue-500 animate-bounce" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

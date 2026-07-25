import { motion } from 'framer-motion';

const companies = ['Google', 'Microsoft', 'Amazon', 'Adobe', 'Infosys', 'TCS', 'IBM', 'Accenture'];

export default function TrustSection() {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <section id="career-fit" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="space-y-12"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Trusted By Industry Leaders
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Helping students prepare for careers in
            </h2>
          </motion.div>

          {/* Marquee */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden py-8"
          >
            <motion.div
              animate={{ x: [-2000, 0] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="flex gap-20 whitespace-nowrap"
            >
              {[...Array(2)].map((_, row) => (
                <div key={row} className="flex gap-20">
                  {companies.map((company) => (
                    <div
                      key={`${row}-${company}`}
                      className="flex-shrink-0 px-8 py-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all"
                    >
                      <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {company}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>

            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F8FAFC] dark:from-[#0F172A] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F8FAFC] dark:from-[#0F172A] to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

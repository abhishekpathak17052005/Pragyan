import { motion } from 'framer-motion';
import { useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const companies = [
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
  'Tesla', 'Stripe', 'Figma', 'Notion', 'Linear',
];

export default function PremiumTrust() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
        />
      </div>

      <motion.div
        ref={ref}
        style={{ y, opacity }}
        className="max-w-6xl mx-auto space-y-12"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4"
        >
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
            Trusted By
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Students at Leading Companies
          </h2>
        </motion.div>

        {/* Marquee - Forward */}
        <div className="relative overflow-hidden">
          <motion.div
            animate={{ x: [-2000, 0] }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...Array(2)].map((_, row) => (
              <div key={row} className="flex gap-8">
                {companies.map((company) => (
                  <motion.div
                    key={`${row}-${company}`}
                    className="flex-shrink-0 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-400/20 backdrop-blur-sm hover:border-blue-400/50 transition-all"
                    whileHover={{ scale: 1.05, y: -4 }}
                  >
                    <p className="text-lg font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent whitespace-nowrap">
                      {company}
                    </p>
                  </motion.div>
                ))}
              </div>
            ))}
          </motion.div>

          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          {[
            { stat: '20K+', label: 'Students Using Pragyan' },
            { stat: '95%', label: 'Career Match Accuracy' },
            { stat: '500+', label: 'Career Paths Available' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              className="relative bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-2xl border border-blue-400/20 p-8 text-center hover:border-blue-400/50 transition-all"
              whileHover={{ y: -4 }}
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-blue-600/0 to-purple-600/0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.2 }}
              />
              <div className="relative">
                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-2">
                  {item.stat}
                </p>
                <p className="text-gray-400 text-sm font-medium">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

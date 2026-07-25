import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Data Scientist at Google',
    avatar: '👩‍💼',
    content:
      'Pragyan AI helped me identify that I should pursue data science. The personalized roadmap was exactly what I needed to transition from my previous career.',
    stars: 5,
  },
  {
    name: 'Arjun Kumar',
    role: 'Full Stack Developer at Microsoft',
    avatar: '👨‍💻',
    content:
      'The skill gap analysis was incredibly accurate. I followed the learning roadmap and landed my dream job at Microsoft in just 6 months.',
    stars: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Product Manager at Amazon',
    avatar: '👩‍🔬',
    content:
      'What impressed me most was the placement prediction accuracy. It guided me towards companies where I had the best chances of success.',
    stars: 5,
  },
  {
    name: 'Rahul Singh',
    role: 'Software Engineer at Adobe',
    avatar: '👨‍🏫',
    content:
      'The daily tasks and gamification kept me motivated throughout my learning journey. I completed the entire roadmap in 4 months!',
    stars: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'AI/ML Engineer at Infosys',
    avatar: '👩‍🚀',
    content:
      'Pragyan AI is like having a personal career coach. The insights were deep, actionable, and helped me make confident career decisions.',
    stars: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex(
      (prev) => (prev + newDirection + testimonials.length) % testimonials.length
    );
  };

  return (
    <section id="testimonials" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
            Success Stories
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Loved by Students Worldwide
          </h2>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
              }}
              className="w-full"
            >
              {/* Testimonial Card */}
              <motion.div className="max-w-2xl mx-auto">
                <div className="relative bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-12 shadow-2xl">
                  {/* Glow Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl -z-10 blur-2xl" />

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonials[currentIndex].stars)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-8 leading-relaxed"
                  >
                    "{testimonials[currentIndex].content}"
                  </motion.p>

                  {/* Author */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-4 pt-8 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="text-5xl">{testimonials[currentIndex].avatar}</div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {testimonials[currentIndex].name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {testimonials[currentIndex].role}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-20 z-10 p-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-white/20 dark:border-white/10 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-20 z-10 p-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-white/20 dark:border-white/10 transition-all"
          >
            <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
          </motion.button>
        </div>

        {/* Dots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-2 mt-8"
        >
          {testimonials.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-blue-600 w-8'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

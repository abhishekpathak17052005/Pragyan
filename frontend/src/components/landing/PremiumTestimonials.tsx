import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Data Scientist at Google',
    avatar: '👩‍💻',
    content: 'Pragyan AI helped me transition careers from finance to data science. The roadmap was incredibly accurate and the daily challenges kept me motivated. I landed at Google in 6 months!',
    stars: 5,
  },
  {
    name: 'Arjun Kumar',
    role: 'Full Stack Dev at Microsoft',
    avatar: '👨‍💻',
    content: 'The skill gap analysis was a game-changer. I knew exactly what I needed to learn. The placement prediction also helped me target companies where I had the highest success rate.',
    stars: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Product Manager at Amazon',
    avatar: '👩‍🔬',
    content: 'As someone transitioning to PM, Pragyan gave me confidence. The AI matched me with PM careers I never considered. Best career investment ever!',
    stars: 5,
  },
  {
    name: 'Rahul Singh',
    role: 'ML Engineer at Meta',
    avatar: '🧑‍🔬',
    content: 'The daily challenges and XP system kept me engaged throughout my learning journey. I completed 6 months of learning in 4 months because of the gamification.',
    stars: 5,
  },
];

export default function PremiumTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
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
    setCurrentIndex((prev) => (prev + newDirection + testimonials.length) % testimonials.length);
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
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

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center mb-16 space-y-4"
      >
        <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
          Success Stories
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Loved by Students Worldwide
        </h2>
      </motion.div>

      {/* Testimonial Carousel */}
      <div className="max-w-4xl mx-auto">
        <div className="relative h-96">
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
              className="absolute inset-0"
            >
              {/* Testimonial Card */}
              <motion.div
                className="h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-3xl border border-blue-400/30 p-12 shadow-2xl"
                whileHover={{ border: 'border-blue-400/60' }}
              >
                {/* Glow background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 rounded-3xl blur-3xl"
                  animate={{
                    background: [
                      'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
                      'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                />

                <div className="relative space-y-6">
                  {/* Stars */}
                  <motion.div
                    className="flex gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {[...Array(testimonials[currentIndex].stars)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Quote */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl sm:text-3xl font-bold text-white leading-relaxed"
                  >
                    "{testimonials[currentIndex].content}"
                  </motion.p>

                  {/* Author */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-4 pt-4 border-t border-blue-400/20"
                  >
                    <div className="text-4xl">{testimonials[currentIndex].avatar}</div>
                    <div>
                      <p className="font-bold text-white">{testimonials[currentIndex].name}</p>
                      <p className="text-sm text-gray-400">{testimonials[currentIndex].role}</p>
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 lg:-translate-x-20 z-10 p-3 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/50 text-blue-300 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => paginate(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 lg:translate-x-20 z-10 p-3 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/50 text-blue-300 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Dots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-3 mt-8"
        >
          {testimonials.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`transition-all rounded-full ${
                idx === currentIndex
                  ? 'bg-blue-500 w-8 h-3'
                  : 'bg-gray-600 w-3 h-3 hover:bg-gray-500'
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

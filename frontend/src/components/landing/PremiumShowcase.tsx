import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';

const showcaseItems = [
  {
    title: 'AI-Powered Career Matching',
    description: 'Our advanced ML engine analyzes your unique profile against 500+ careers to find your perfect match with 95% accuracy.',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    stats: [
      { label: 'Accuracy', value: '95%' },
      { label: 'Matches', value: '500+' },
    ],
  },
  {
    title: 'Real-Time Progress Tracking',
    description: 'Watch your skills grow with detailed analytics, daily challenges, XP rewards, and achievement badges.',
    icon: BarChart3,
    color: 'from-purple-500 to-pink-500',
    stats: [
      { label: 'Updates', value: 'Daily' },
      { label: 'Metrics', value: '30+' },
    ],
  },
  {
    title: 'Placement Prediction Engine',
    description: 'AI predicts your probability of getting selected at different companies with real-time market data.',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500',
    stats: [
      { label: 'Accuracy', value: '92%' },
      { label: 'Companies', value: '1000+' },
    ],
  },
];

export default function PremiumShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (hoveredIndex !== index) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotationX = ((y - centerY) / centerY) * 10;
    const rotationY = ((centerX - x) / centerX) * 10;

    setRotation({ x: rotationX, y: rotationY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <section ref={containerRef} className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center mb-20 space-y-4"
      >
        <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
          How It Works
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-white">
          Advanced AI Technology
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Built with cutting-edge machine learning and data science to deliver precision career guidance.
        </p>
      </motion.div>

      {/* Showcase Grid */}
      <motion.div
        style={{ opacity, scale }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {showcaseItems.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={(e) => handleMouseMove(e, idx)}
            style={{
              rotateX: hoveredIndex === idx ? rotation.x : 0,
              rotateY: hoveredIndex === idx ? rotation.y : 0,
              perspective: '1200px',
            }}
            className="group relative"
          >
            {/* Glow background */}
            <motion.div
              className={`absolute -inset-4 bg-gradient-to-r ${item.color} rounded-3xl blur-2xl opacity-0 group-hover:opacity-30 transition-opacity`}
            />

            {/* Card */}
            <motion.div
              className="relative h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-xl rounded-3xl border border-blue-400/30 p-8 hover:border-blue-400/60 transition-all overflow-hidden"
              whileHover={{ y: -8 }}
            >
              {/* Icon */}
              <motion.div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} text-white mb-6 shadow-lg`}
                animate={hoveredIndex === idx ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.6 }}
              >
                <item.icon size={32} />
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-gray-300 mb-8 leading-relaxed">{item.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {item.stats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    className="bg-blue-900/40 backdrop-blur rounded-lg p-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <p className="text-xs text-gray-400 font-medium mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ x: 4 }}
                className="text-blue-300 font-semibold text-sm hover:text-blue-200 transition-colors flex items-center gap-2"
              >
                Learn More →
              </motion.button>

              {/* Animated border */}
              <motion.div
                className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 pointer-events-none"
                animate={hoveredIndex === idx ? { opacity: 0.2 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

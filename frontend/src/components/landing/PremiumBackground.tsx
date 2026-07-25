import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function PremiumBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Base gradient backdrop - Light theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-purple-50" />

      {/* Radial gradient overlay - subtle depth */}
      <div className="absolute inset-0 bg-radial-gradient opacity-40" style={{
        background: 'radial-gradient(ellipse 200% 200% at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 80%)',
      }} />

      {/* Animated gradient blob 1 - Blue */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.15, 0.25, 0.1, 0.15],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated gradient blob 2 - Purple */}
      <motion.div
        className="absolute top-1/2 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 100, -80, 0],
          scale: [1, 0.9, 1.1, 1],
          opacity: [0.1, 0.2, 0.15, 0.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated gradient blob 3 - Blue accent */}
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full blur-3xl opacity-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 50, -100, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.1, 0.95, 1],
          opacity: [0.12, 0.18, 0.08, 0.12],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Mouse-follow spotlight */}
      {isHovering && (
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            opacity: 0.2,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, .05) 25%, rgba(59, 130, 246, .05) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, .05) 75%, rgba(59, 130, 246, .05) 76%, transparent 77%, transparent),
                          linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, .05) 25%, rgba(59, 130, 246, .05) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, .05) 75%, rgba(59, 130, 246, .05) 76%, transparent 77%, transparent)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Gradient fade at top and bottom */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-transparent to-transparent" />
    </div>
  );
}

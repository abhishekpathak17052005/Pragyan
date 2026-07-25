import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function MagneticButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distance = 80; // magnetic pull distance
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance_calc = Math.sqrt(dx * dx + dy * dy);

    if (distance_calc < distance) {
      const moveX = (dx / distance_calc) * (distance - distance_calc) * 0.3;
      const moveY = (dy / distance_calc) * (distance - distance_calc) * 0.3;
      setPosition({ x: moveX, y: moveY });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50',
    secondary:
      'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50',
    outlined:
      'border-2 border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:border-blue-300',
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={position}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative rounded-xl font-bold transition-all duration-200 overflow-hidden
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ scale: 0, opacity: 1 }}
        whileHover={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}

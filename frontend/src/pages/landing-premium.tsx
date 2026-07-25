import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import PremiumBackground from '@/components/landing/PremiumBackground';
import PremiumHero from '@/components/landing/PremiumHero';
import PremiumFeatures from '@/components/landing/PremiumFeatures';
import PremiumTrust from '@/components/landing/PremiumTrust';
import PremiumShowcase from '@/components/landing/PremiumShowcase';
import PremiumTestimonials from '@/components/landing/PremiumTestimonials';
import PremiumFinalCTA from '@/components/landing/PremiumFinalCTA';
import PremiumFooter from '@/components/landing/PremiumFooter';
import Navbar from '@/components/landing/Navbar';

export default function LandingPremium() {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-x-hidden bg-white">
      {/* Premium Background */}
      <PremiumBackground />

      {/* Navbar */}
      <Navbar scrollY={scrollY} />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <PremiumHero />

        {/* Features Section */}
        <PremiumFeatures />

        {/* Trust Section */}
        <PremiumTrust />

        {/* Showcase Section */}
        <PremiumShowcase />

        {/* Testimonials */}
        <PremiumTestimonials />

        {/* Final CTA */}
        <PremiumFinalCTA />
      </main>

      {/* Footer */}
      <PremiumFooter />

      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 z-50"
        style={{
          scaleX: scrollY / (document.documentElement.scrollHeight - window.innerHeight),
          transformOrigin: '0%',
        }}
      />
    </div>
  );
}

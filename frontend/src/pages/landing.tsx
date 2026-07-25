import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Sparkles, ArrowRight, CheckCircle, BarChart2, Brain, Target, MapPin, TrendingUp, Zap, Loader, Briefcase } from 'lucide-react';

// Floating Particles Component for visual connection
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#4F46E5]/40 rounded-full"
          initial={{
            x: Math.random() * 100 - 50,
            y: 0,
            opacity: 0,
          }}
          animate={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 200 + 100,
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: i * 0.15,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      ))}
    </div>
  );
}

// Animated Counter Component
function AnimatedStat({ end, label }: { end: number; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / 30;
    const interval = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 50);
    return () => clearInterval(interval);
  }, [end]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-1"
    >
      <p className="text-3xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#312E81] bg-clip-text text-transparent">
        {count}
        {label.includes('Match') ? '%' : '+'}
      </p>
      <p className="text-xs text-gray-600">{label}</p>
    </motion.div>
  );
}

// AI Thinking Visualization
function AIThinkingVisualization() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + Math.random() * 15 > 100 ? 100 : prev + Math.random() * 15));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div className="space-y-3 py-4">
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 bg-white rounded-full"
        />
        <span className="text-xs font-medium text-white/80">AI Thinking...</span>
      </div>
      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 50 }}
          className="h-full bg-gradient-to-r from-white/40 to-white"
        />
      </div>
      <span className="text-xs text-white/60">{Math.floor(progress)}%</span>
    </motion.div>
  );
}

// AI Analysis Animation Component with career matching
function AIAnalysisHero() {
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [careerMatches, setCareerMatches] = useState<Array<{ title: string; match: number }>>([]);
  const [roadmapPhase, setRoadmapPhase] = useState(0);

  useEffect(() => {
    // Career matching sequence with more phases
    const careerSequence = [
      { title: 'AI Engineer', match: 91 },
      { title: 'Cybersecurity Analyst', match: 82 },
      { title: 'Full Stack Developer', match: 95 },
    ];

    // Timeline for the workflow
    const steps = [
      { delay: 0.3, step: 1 }, // Personality detected
      { delay: 1.2, step: 2 }, // Skill analysis completed
      { delay: 2.1, step: 3 }, // Interests identified
      { delay: 3.0, step: 4 }, // Searching careers
    ];

    const timers = steps.map((item) =>
      setTimeout(() => setAnalysisStep(item.step), item.delay * 1000)
    );

    // Show career cards one by one
    const careerTimers = careerSequence.map((career, idx) =>
      setTimeout(() => {
        setCareerMatches((prev) => [...prev, career]);
      }, 3800 + idx * 500)
    );

    // Roadmap building phase
    const roadmapTimers = [0, 1, 2, 3].map((phase, idx) =>
      setTimeout(() => setRoadmapPhase(phase + 1), 5800 + idx * 300)
    );

    const resultTimer = setTimeout(() => setShowResult(true), 6800);

    return () => {
      timers.forEach(t => clearTimeout(t));
      careerTimers.forEach(t => clearTimeout(t));
      roadmapTimers.forEach(t => clearTimeout(t));
      clearTimeout(resultTimer);
    };
  }, []);

  const analysisPhases = [
    { label: '✓ Personality Detected', active: analysisStep >= 1 },
    { label: '✓ Skill Analysis Completed', active: analysisStep >= 2 },
    { label: '✓ Interests Identified', active: analysisStep >= 3 },
    { label: 'Searching 500 careers...', active: analysisStep >= 4, loading: analysisStep === 4 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative w-full h-full"
    >
      <div className="bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#312E81] rounded-2xl p-8 text-white shadow-2xl overflow-hidden relative">
        {/* Premium depth layers */}
        <div className="absolute inset-0">
          {/* Animated glow background */}
          <motion.div
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
          />
          
          {/* Glass reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Header with confidence score */}
          <div className="flex items-start justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-white/80 mb-2"
              >
                AI Career Recommendation
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold"
              >
                {careerMatches.length > 0 ? careerMatches[careerMatches.length - 1].title : 'Analyzing...'}
              </motion.h3>
            </div>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1 rounded-full bg-white/20 border border-white/40 backdrop-blur-sm"
              >
                <p className="text-sm font-bold">95% MATCH</p>
              </motion.div>
            )}
          </div>

          {/* Analysis phases */}
          <div className="space-y-2 border-t border-white/20 pt-4">
            {analysisPhases.map((phase, idx) => (
              <motion.div
                key={phase.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: phase.active ? 1 : 0.4, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2"
              >
                {phase.loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                    <Loader className="w-4 h-4" />
                  </motion.div>
                ) : phase.active ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/30" />
                )}
                <span className="text-sm font-medium">{phase.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Career matches display */}
          {careerMatches.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 border-t border-white/20 pt-4"
            >
              <p className="text-xs font-medium uppercase text-white/70 mb-3">Career Matches</p>
              <div className="space-y-2.5">
                {careerMatches.map((career, idx) => (
                  <motion.div
                    key={career.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    whileHover={{ x: 4 }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                      idx === careerMatches.length - 1
                        ? 'bg-white/15 border-white/40 shadow-lg'
                        : 'bg-white/10 border-white/20 hover:bg-white/12'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{career.title}</span>
                      <span className="text-xs font-bold text-white/90">{career.match}%</span>
                    </div>
                    <motion.div
                      className="h-1.5 bg-white/20 rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-white/60 to-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${career.match}%` }}
                        transition={{ delay: 0.3 + idx * 0.2, duration: 0.8, ease: 'easeOut' }}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Roadmap building phase */}
          {roadmapPhase > 0 && roadmapPhase < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2 border-t border-white/20 pt-4"
            >
              <p className="text-xs font-medium uppercase text-white/70">Building Your Roadmap</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((week) => (
                  <motion.div
                    key={week}
                    initial={{ scaleY: 0.2, opacity: 0 }}
                    animate={{
                      scaleY: roadmapPhase >= week ? 1 : 0.2,
                      opacity: roadmapPhase >= week ? 1 : 0.4,
                    }}
                    transition={{ delay: (week - 1) * 0.15 }}
                    className="flex-1 h-8 bg-white/10 rounded border border-white/20"
                  >
                    <div className="text-center text-xs font-bold text-white/70 pt-1">W{week}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Final results */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-3 border-t border-white/20 pt-4"
            >
              <p className="text-xs font-medium uppercase text-white/70">Your Profile</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Skills', value: '18+' },
                  { label: 'Learning Path', value: '24w' },
                  { label: 'Companies Hiring', value: '500+' },
                  { label: 'Avg Salary', value: '$120K' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/10 rounded-lg p-3 text-center border border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
                  >
                    <p className="text-lg font-bold">{item.value}</p>
                    <p className="text-xs text-white/70 mt-1">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading state */}
          {analysisStep > 0 && !showResult && analysisStep < 4 && <AIThinkingVisualization />}
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced 3D Tilt Dashboard Component with Premium Effects
function InteractiveDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = (e.clientY - centerY) / 25;
      const y = (e.clientX - centerX) / 25;

      setRotation({ x: -x, y });
      setGlow({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative w-full group"
      style={{ perspective: '1200px' }}
    >
      {/* Outer glow - subtle but visible */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -z-10"
        animate={{
          boxShadow: isHovering
            ? `0 0 60px 15px rgba(79, 70, 229, 0.3)`
            : `0 0 30px 5px rgba(79, 70, 229, 0.1)`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Inner cursor-tracking glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${glow.x}% ${glow.y}%, rgba(79, 70, 229, 0.15), transparent 80%)`,
        }}
      />

      {/* Animated border on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          borderColor: isHovering ? 'rgba(79, 70, 229, 0.3)' : 'rgba(79, 70, 229, 0.1)',
          boxShadow: isHovering
            ? 'inset 0 0 20px rgba(79, 70, 229, 0.2)'
            : 'inset 0 0 10px rgba(79, 70, 229, 0.1)',
        }}
        transition={{ duration: 0.3 }}
        style={{
          borderWidth: '1px',
        }}
      />

      <AIAnalysisHero />
    </motion.div>
  );
}

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#4F46E5] to-[#312E81] rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-[#1C2340]">Pragyan AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm font-medium">
              Career Discovery
            </a>
            <a href="#" className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm font-medium">
              Roadmaps
            </a>
            <a href="#" className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm font-medium">
              Resources
            </a>
            <a href="#" className="text-gray-600 hover:text-[#4F46E5] transition-colors text-sm font-medium">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-gray-600 hover:text-[#4F46E5] text-sm font-medium transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth"
              className="px-6 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#312E81] text-white rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-purple-200 transition-all"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Premium Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Premium Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFC] to-blue-50/30 z-0">
          {/* Animated light orbs */}
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-20 left-1/4 w-96 h-96 bg-[#4F46E5]/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -40, 0],
              y: [0, -25, 0],
              opacity: [0.1, 0.12, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#312E81]/5 rounded-full blur-3xl"
          />

          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #4F46E5, transparent)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8 relative"
            >
              {/* Floating Particles */}
              <FloatingParticles />

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200"
              >
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                <span className="text-sm font-medium text-[#4F46E5]">AI Career Guidance Platform</span>
              </motion.div>

              {/* Emotionally Compelling Headline */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="text-5xl lg:text-6xl font-bold text-[#1C2340] leading-tight"
                >
                  The Career You Were{' '}
                  <span className="bg-gradient-to-r from-[#4F46E5] to-[#312E81] bg-clip-text text-transparent">
                    Meant to Build
                  </span>{' '}
                  Starts Here
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="text-lg text-gray-600"
                >
                  Let AI uncover your perfect career path. Discover what you're truly meant to do, and get the roadmap to get there.
                </motion.p>
              </div>

              {/* CTA Buttons with Premium Hover */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  {/* Ripple effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#312E81] rounded-lg opacity-0 group-hover:opacity-20 blur-lg group-hover:blur-xl transition-all"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <Link
                    href="/auth"
                    className="relative px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#312E81] text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-purple-300/50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    Start Assessment <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border-2 border-[#4F46E5] text-[#4F46E5] rounded-lg font-semibold hover:bg-blue-50 hover:shadow-lg transition-all relative group overflow-hidden"
                >
                  <span className="relative z-10">▶ Watch Demo</span>
                  <motion.div
                    className="absolute inset-0 bg-[#4F46E5] opacity-0 group-hover:opacity-5 z-0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.button>
              </motion.div>

              {/* Stats and Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="space-y-4 pt-8 border-t border-gray-200"
              >
                <div className="grid grid-cols-2 gap-6">
                  <AnimatedStat end={95} label="Career Match" />
                  <AnimatedStat end={500} label="Career Paths" />
                </div>
                <div className="pt-4">
                  <p className="text-xs text-gray-600 mb-3">Explore learning paths aligned with roles at leading technology companies</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {['Google', 'Microsoft', 'Amazon', 'Adobe', 'TCS'].map((company) => (
                      <motion.span
                        key={company}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.6 }}
                        viewport={{ once: true }}
                        whileHover={{ opacity: 1 }}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all cursor-default"
                      >
                        {company}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Interactive Dashboard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative group"
            >
              <InteractiveDashboard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-12 text-center"
        >
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-[#1C2340]">The Problem Most Students Face</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Thousands choose careers based on popularity, trends, or what their parents suggest—without truly understanding their strengths, interests, or market opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { problem: 'Confusion', description: 'Too many career options with no clear path forward', icon: '❓' },
              { problem: 'Skill Gaps', description: 'Not knowing which skills employers actually want', icon: '📊' },
              { problem: 'Wasted Time', description: 'Learning irrelevant skills that don\'t lead to jobs', icon: '⏱️' },
            ].map((item, idx) => (
              <motion.div
                key={item.problem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-red-50 rounded-xl border border-red-200"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#1C2340] mb-2">{item.problem}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-[#4F46E5] uppercase">Our Solution</p>
            <h2 className="text-4xl font-bold text-[#1C2340]">How Pragyan AI Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">AI-powered career intelligence that understands you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Brain,
                title: 'AI Assessment',
                desc: 'Answer questions about your skills, interests, and goals. Our AI analyzes your unique profile.',
              },
              {
                step: 2,
                icon: Target,
                title: 'Career Intelligence',
                desc: 'Get matched with careers aligned to your profile. See market demand, salary ranges, and growth potential.',
              },
              {
                step: 3,
                icon: MapPin,
                title: 'Personalized Roadmap',
                desc: 'Receive a step-by-step learning path with resources, timelines, and milestones to reach your career goal.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(79, 70, 229, 0.15)' }}
                  className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 cursor-pointer transition-all relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5]/5 to-[#312E81]/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />

                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#312E81] flex items-center justify-center text-white text-sm font-bold">
                    {item.step}
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-[#4F46E5]/10 to-[#312E81]/10 group-hover:from-[#4F46E5]/20 group-hover:to-[#312E81]/20 transition-colors">
                      <Icon className="w-6 h-6 text-[#4F46E5]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#1C2340]">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>

                  {idx < 2 && (
                    <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-[#4F46E5] opacity-30" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-[#4F46E5] uppercase">Powerful Features</p>
            <h2 className="text-4xl font-bold text-[#1C2340]">Everything You Need to Succeed</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Sparkles, title: 'AI Counselor', desc: 'Chat with our AI to get instant career guidance and personalized advice' },
              { icon: TrendingUp, title: 'Progress Tracking', desc: 'Monitor your learning journey with detailed analytics and insights' },
              { icon: Zap, title: 'Skill Assessment', desc: 'Identify gaps and get targeted resources to build missing skills' },
              { icon: CheckCircle, title: 'Placement Ready', desc: 'Get prepared for interviews with real interview questions and mock sessions' },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(79, 70, 229, 0.1)' }}
                className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 hover:border-[#4F46E5] transition-all cursor-pointer group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-[#4F46E5]/10 to-[#312E81]/10 group-hover:from-[#4F46E5]/20 group-hover:to-[#312E81]/20 transition-colors mb-4">
                  <feature.icon className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1C2340] mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#4F46E5] to-[#312E81] rounded-2xl p-12 text-center text-white"
        >
          <h2 className="text-4xl font-bold mb-4">One Assessment. One Roadmap. One Future.</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Stop guessing about your career. Let AI guide you to the path where you'll truly excel.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#4F46E5] rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Start Discovering Your Career <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C2340] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-[#4F46E5] to-[#312E81] rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">Pragyan AI</span>
              </div>
              <p className="text-sm text-gray-400">Your AI Career Guide</p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers'] },
              { title: 'Resources', links: ['Documentation', 'Help', 'Contact'] },
            ].map((col) => (
              <div key={col.title} className="space-y-3">
                <p className="font-semibold text-sm">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 Pragyan AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

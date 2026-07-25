import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

const careerData = [
  { career: 'Data Scientist', match: 95 },
  { career: 'ML Engineer', match: 88 },
  { career: 'Software Eng', match: 82 },
  { career: 'Product Mgr', match: 75 },
  { career: 'AI Researcher', match: 92 },
  { career: 'Data Analyst', match: 78 },
];

export default function CareerMatchRadar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative h-96 bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl rounded-3xl border border-blue-400/30 p-8 overflow-hidden group"
    >
      {/* Glow background */}
      <motion.div
        className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-3xl blur-3xl opacity-0 group-hover:opacity-20 transition-opacity"
      />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">Your Career Matches</h3>
          <p className="text-sm text-gray-400">AI analysis of 500+ career paths</p>
        </div>

        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={careerData}>
            <PolarGrid stroke="rgba(59, 130, 246, 0.1)" />
            <PolarAngleAxis
              dataKey="career"
              tick={{ fill: 'rgba(156, 163, 175, 0.6)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(156, 163, 175, 0.4)', fontSize: 10 }}
            />
            <Radar
              name="Match %"
              dataKey="match"
              stroke="#3B82F6"
              fill="rgba(59, 130, 246, 0.3)"
              animationDuration={2000}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Top match indicator */}
      <motion.div
        className="absolute top-4 right-4 px-4 py-2 bg-green-500/20 border border-green-400/50 rounded-lg"
        animate={{
          boxShadow: ['0 0 10px rgba(34, 197, 94, 0.3)', '0 0 20px rgba(34, 197, 94, 0.5)', '0 0 10px rgba(34, 197, 94, 0.3)'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <p className="text-xs font-bold text-green-300">🎯 Best Match: Data Scientist (95%)</p>
      </motion.div>
    </motion.div>
  );
}

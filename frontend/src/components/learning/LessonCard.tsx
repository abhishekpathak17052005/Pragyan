import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Clock, Zap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type LessonState = 'locked' | 'completed' | 'current' | 'skipped' | 'bonus';

interface LessonCardProps {
  id: string;
  title: string;
  description?: string;
  dayNumber: number;
  state: LessonState;
  estimatedTime?: number;
  difficulty?: string;
  xpReward?: number;
  skills?: string[];
  onStart?: () => void;
  onContinue?: () => void;
}

const stateConfig: Record<
  LessonState,
  {
    color: string;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
    badge: string;
  }
> = {
  locked: {
    color: 'gray',
    icon: <Lock className="h-5 w-5" />,
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-700',
  },
  completed: {
    color: 'green',
    icon: <Check className="h-5 w-5" />,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  current: {
    color: 'blue',
    icon: <Clock className="h-5 w-5" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  skipped: {
    color: 'orange',
    icon: <BookOpen className="h-5 w-5" />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  bonus: {
    color: 'purple',
    icon: <Zap className="h-5 w-5" />,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
};

export const LessonCard = memo(function LessonCard({
  id,
  title,
  description,
  dayNumber,
  state,
  estimatedTime,
  difficulty,
  xpReward,
  skills,
  onStart,
  onContinue,
}: LessonCardProps) {
  const config = stateConfig[state];
  const isLocked = state === 'locked';
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={!isLocked ? { y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } : {}}
      className={`relative rounded-2xl border-2 p-5 transition-all cursor-pointer ${
        config.bgColor
      } ${config.borderColor} ${
        isCurrent
          ? 'shadow-lg ring-2 ring-blue-400 ring-offset-2'
          : 'shadow-sm hover:shadow-md'
      }`}
    >
      {/* State Indicator */}
      <div
        className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center ${config.badge} border-2 ${config.borderColor} bg-white`}
      >
        <span className="text-xs font-black">{dayNumber}</span>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${config.textColor}`}>{title}</h3>
            {description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <motion.div
            animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`flex-shrink-0 p-2 rounded-full ${config.badge}`}
          >
            {config.icon}
          </motion.div>
        </div>

        {/* Metadata */}
        {!isLocked && (
          <div className="flex flex-wrap gap-2">
            {estimatedTime && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {estimatedTime}m
              </Badge>
            )}
            {difficulty && (
              <Badge variant="outline" className="text-xs">
                {difficulty}
              </Badge>
            )}
            {xpReward && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                <Zap className="h-3 w-3 mr-1" />
                +{xpReward} XP
              </Badge>
            )}
          </div>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && !isLocked && (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="text-xs bg-white/50 px-2 py-1 rounded-full">
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-xs text-slate-600 px-2 py-1">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex-1 flex items-center justify-center py-2 rounded-lg bg-emerald-100 text-emerald-700 font-semibold"
            >
              ✓ Completed
            </motion.div>
          )}

          {isCurrent && (
            <>
              <Button
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                Continue
              </Button>
            </>
          )}

          {!isLocked && !isCompleted && !isCurrent && (
            <Button
              onClick={onStart}
              variant="outline"
              className="flex-1"
            >
              Start
            </Button>
          )}

          {isLocked && (
            <div className="flex-1 flex items-center justify-center py-2 text-slate-600 font-medium text-sm">
              Locked
            </div>
          )}
        </div>
      </div>

      {/* Glow Effect for Current */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 opacity-0"
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
});

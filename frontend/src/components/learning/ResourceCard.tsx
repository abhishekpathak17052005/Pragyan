import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  BookOpen,
  PlayCircle,
  FileText,
  Target,
  Rocket,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CareerResource } from '@/types/api';

const resourceIcons: Record<string, React.ReactNode> = {
  DOCUMENTATION: <BookOpen className="h-6 w-6" />,
  VIDEO: <PlayCircle className="h-6 w-6" />,
  NOTES: <FileText className="h-6 w-6" />,
  PRACTICE: <Target className="h-6 w-6" />,
  ARTICLE: <FileText className="h-6 w-6" />,
  CHEATSHEET: <BookOpen className="h-6 w-6" />,
  PROJECT: <Rocket className="h-6 w-6" />,
  MINI_PROJECT: <Rocket className="h-6 w-6" />,
};

const resourceColors: Record<string, { bg: string; icon: string; badge: string }> = {
  DOCUMENTATION: { bg: 'from-sky-400 to-sky-600', icon: 'text-sky-600', badge: 'bg-sky-100 text-sky-700' },
  VIDEO: { bg: 'from-rose-400 to-rose-600', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
  NOTES: { bg: 'from-amber-400 to-amber-600', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  PRACTICE: { bg: 'from-emerald-400 to-emerald-600', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  ARTICLE: { bg: 'from-violet-400 to-violet-600', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  CHEATSHEET: { bg: 'from-zinc-400 to-zinc-600', icon: 'text-zinc-600', badge: 'bg-zinc-100 text-zinc-700' },
  PROJECT: { bg: 'from-fuchsia-400 to-fuchsia-600', icon: 'text-fuchsia-600', badge: 'bg-fuchsia-100 text-fuchsia-700' },
  MINI_PROJECT: { bg: 'from-pink-400 to-pink-600', icon: 'text-pink-600', badge: 'bg-pink-100 text-pink-700' },
};

interface ResourceCardProps {
  resource: CareerResource;
  isCompleted?: boolean;
  onOpen?: (url?: string | null) => void;
  onComplete?: (resourceId: string) => void;
}

export const ResourceCard = memo(function ResourceCard({
  resource,
  isCompleted = false,
  onOpen,
  onComplete,
}: ResourceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const colors = resourceColors[resource.type] || resourceColors.DOCUMENTATION;

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onComplete?.(resource.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={!isCompleted ? { y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } : {}}
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all ${
        isCompleted
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white shadow-md hover:shadow-lg hover:border-blue-300'
      }`}
    >
      {/* Thumbnail/Icon Background */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.bg}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            whileHover={!isCompleted ? { scale: 1.1, rotate: 5 } : {}}
            className={`flex-shrink-0 p-3 rounded-xl ${colors.badge} group-hover:scale-110 transition-transform`}
          >
            <div className={colors.icon}>
              {resourceIcons[resource.type] || <BookOpen className="h-6 w-6" />}
            </div>
          </motion.div>

          {/* Title and Provider */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm md:text-base line-clamp-2">
              {resource.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {resource.provider}
            </p>
          </div>

          {/* Completion Check */}
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex-shrink-0"
            >
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </motion.div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {resource.difficulty && (
            <Badge variant="outline" className="text-xs">
              {resource.difficulty}
            </Badge>
          )}
          {resource.language && (
            <Badge variant="outline" className="text-xs">
              {resource.language}
            </Badge>
          )}
          {resource.free === false ? (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
              💰 Paid
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700"
            >
              ✓ Free
            </Badge>
          )}
          {resource.verified && (
            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
              ✓ Verified
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpen?.(resource.url)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-semibold text-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </motion.button>

          {!isCompleted && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="h-4 w-4"
                  >
                    ⏳
                  </motion.div>
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Complete
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Completed State Animation */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          className="absolute inset-0 bg-emerald-500 rounded-2xl"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
});

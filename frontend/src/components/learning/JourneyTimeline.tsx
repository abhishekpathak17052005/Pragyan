import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { LessonCard } from './LessonCard';
import type { CareerRoadmap } from '@/types/api';

interface JourneyTimelineProps {
  career: CareerRoadmap | null;
  onLessonClick?: (lessonId: string) => void;
}

export const JourneyTimeline = memo(function JourneyTimeline({
  career,
  onLessonClick,
}: JourneyTimelineProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  if (!career?.modules?.length) return null;

  return (
    <div className="space-y-6">
      {/* Journey Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h2 className="text-3xl md:text-4xl font-black text-slate-900">
          Your Learning Journey
        </h2>
        <p className="text-slate-600">
          Follow the path to master {career.title}. Complete lessons, earn XP,
          and unlock achievements.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative space-y-8">
        {/* Vertical Line */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-indigo-600 rounded-full" />

        {/* Modules */}
        {career.modules.map((module, moduleIdx) => {
          const isModuleExpanded = expandedModule === module.id;

          return (
            <motion.div key={module.id} className="relative pl-20 md:pl-24">
              {/* Module Connector */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: moduleIdx * 0.1 }}
                className="absolute -left-2 md:-left-3 top-4 w-4 h-4 md:w-5 md:h-5 bg-white border-4 border-blue-600 rounded-full shadow-lg"
              />

              {/* Module Card */}
              <motion.button
                onClick={() =>
                  setExpandedModule(isModuleExpanded ? null : module.id)
                }
                className="w-full text-left"
                whileHover={{ x: 4 }}
              >
                <div className="group bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-md hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
                  {/* Module Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Month {module.order + 1}
                      </p>
                      <h3 className="text-xl font-black text-slate-900">
                        {module.title}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-slate-600 line-clamp-1">
                          {module.description}
                        </p>
                      )}
                    </div>

                    {/* Module Stats */}
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-600 font-medium">
                          {module.weeks?.length || 0} Weeks
                        </p>
                        <p className="text-lg font-black text-blue-600">
                          {Math.round(
                            (module.weeks?.length || 0) > 0
                              ? ((module.weeks || []).filter((w: any) => {
                                  const days = w.days || [];
                                  return (
                                    days.length > 0 &&
                                    days.every((d: any) => {
                                      const topics = d.topics || [];
                                      return (
                                        topics.length > 0 &&
                                        topics.every((t: any) => {
                                          const resources = t.resources || [];
                                          return (
                                            resources.length > 0 &&
                                            resources.every(
                                              (r: any) => r.completed
                                            )
                                          );
                                        })
                                      );
                                    })
                                  );
                                }).length /
                                  (module.weeks?.length || 1)) *
                                100
                              : 0
                          )}
                          %
                        </p>
                      </div>

                      <motion.div
                        animate={{ rotate: isModuleExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-6 w-6 text-slate-400 group-hover:text-slate-600" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Weeks and Days - Expandable */}
              <AnimatePresence>
                {isModuleExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 space-y-4 ml-0"
                  >
                    {module.weeks?.map((week, weekIdx) => {
                      const isWeekExpanded = expandedWeek === week.id;

                      return (
                        <motion.div
                          key={week.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: weekIdx * 0.1 }}
                          className="relative pl-12 md:pl-16"
                        >
                          {/* Week Connector */}
                          <motion.div className="absolute -left-1.5 md:-left-2 top-4 w-3 h-3 md:w-3.5 md:h-3.5 bg-white border-3 border-indigo-500 rounded-full shadow-md" />

                          {/* Week Header */}
                          <motion.button
                            onClick={() =>
                              setExpandedWeek(isWeekExpanded ? null : week.id)
                            }
                            className="w-full text-left"
                            whileHover={{ x: 2 }}
                          >
                            <div className="group bg-slate-50 rounded-xl border border-slate-200 p-4 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-slate-600 uppercase">
                                    Week {week.order + 1}
                                  </p>
                                  <h4 className="font-semibold text-slate-900 mt-1">
                                    {week.title}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                                  <p className="text-xs text-slate-600 font-medium">
                                    {week.days?.length || 0} Days
                                  </p>
                                  <motion.div
                                    animate={{ rotate: isWeekExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          </motion.button>

                          {/* Days - Lesson Cards */}
                          <AnimatePresence>
                            {isWeekExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 space-y-3"
                              >
                                {week.days?.map((day, dayIdx) => (
                                  <motion.div
                                    key={day.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: dayIdx * 0.05 }}
                                    className="relative pl-8 md:pl-10"
                                  >
                                    {/* Day Connector */}
                                    <div className="absolute -left-1 md:-left-1.5 top-3 w-2 h-2 md:w-2.5 md:h-2.5 bg-white border-2 border-indigo-400 rounded-full shadow-sm" />

                                    {/* Topics as Lessons with Resources */}
                                    <div className="space-y-4">
                                      {day.topics?.map((topic: any, topicIdx: number) => {
                                        const completedResources = (
                                          topic.resources || []
                                        ).filter((r: any) => r.completed).length;
                                        const totalResources =
                                          topic.resources?.length || 0;
                                        const isCompleted =
                                          totalResources > 0 &&
                                          completedResources === totalResources;

                                        return (
                                          <motion.div
                                            key={topic.id}
                                            className="space-y-3"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: topicIdx * 0.05 }}
                                          >
                                            <LessonCard
                                              id={topic.id}
                                              title={topic.title}
                                              description={topic.objective}
                                              dayNumber={day.order + 1}
                                              state={
                                                isCompleted
                                                  ? 'completed'
                                                  : topicIdx === 0
                                                    ? 'current'
                                                    : 'locked'
                                              }
                                              estimatedTime={30}
                                              difficulty="Intermediate"
                                              xpReward={100}
                                              skills={
                                                topic.resources
                                                  ?.slice(0, 3)
                                                  .map((r: any) => r.title) || []
                                              }
                                              onStart={() =>
                                                onLessonClick?.(topic.id)
                                              }
                                              onContinue={() =>
                                                onLessonClick?.(topic.id)
                                              }
                                            />

                                            {/* Resources Display */}
                                            {topicIdx === 0 && (
                                              <motion.div
                                                className="ml-4 space-y-2 border-l-2 border-blue-300 pl-4"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                transition={{ delay: 0.2 }}
                                              >
                                                <p className="text-xs font-bold text-slate-600 uppercase">Resources</p>
                                                <div className="space-y-2">
                                                  {(topic.resources || []).map(
                                                    (resource: any, idx: number) => (
                                                      <motion.div
                                                        key={resource.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                                        className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                                                      >
                                                        <div className="flex items-start justify-between gap-2">
                                                          <div className="flex-1 min-w-0">
                                                            <h5 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                                                              {resource.title}
                                                            </h5>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                              {resource.provider}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                                                {resource.type}
                                                              </span>
                                                              {resource.free === false && (
                                                                <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                                                                  Paid
                                                                </span>
                                                              )}
                                                              {resource.verified && (
                                                                <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                                                                  ✓ Verified
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                          <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => window.open(resource.url, '_blank')}
                                                            className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                                                          >
                                                            Open
                                                          </motion.button>
                                                        </div>
                                                      </motion.div>
                                                    )
                                                  )}
                                                </div>
                                              </motion.div>
                                            )}
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

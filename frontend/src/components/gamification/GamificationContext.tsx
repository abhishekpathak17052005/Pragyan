import React, { createContext, useContext, useCallback, useState } from 'react';

export interface GamificationEvent {
  id: string;
  type: 'xp' | 'badge' | 'level_up' | 'streak' | 'milestone' | 'motivation';
  title: string;
  description?: string;
  icon?: string;
  xpAmount?: number;
  timestamp: number;
  position?: { x: number; y: number };
}

interface GamificationContextType {
  events: GamificationEvent[];
  addXPAnimation: (amount: number, position?: { x: number; y: number }) => void;
  addBadgeUnlock: (title: string, icon: string, description?: string) => void;
  addLevelUp: (newLevel: number) => void;
  addStreakUpdate: (streak: number) => void;
  addMilestone: (title: string, description: string) => void;
  addMotivation: (message: string) => void;
  removeEvent: (id: string) => void;
  clearAll: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<GamificationEvent[]>([]);

  const addEvent = useCallback((event: GamificationEvent) => {
    setEvents((prev) => [...prev, event]);

    // Auto-remove after animation duration
    const duration = event.type === 'motivation' ? 4000 : 3000;
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    }, duration);
  }, []);

  const addXPAnimation = useCallback(
    (amount: number, position?: { x: number; y: number }) => {
      addEvent({
        id: `xp-${Date.now()}`,
        type: 'xp',
        title: `+${amount} XP`,
        xpAmount: amount,
        timestamp: Date.now(),
        position,
      });
    },
    [addEvent]
  );

  const addBadgeUnlock = useCallback(
    (title: string, icon: string, description?: string) => {
      addEvent({
        id: `badge-${Date.now()}`,
        type: 'badge',
        title,
        description,
        icon,
        timestamp: Date.now(),
      });
    },
    [addEvent]
  );

  const addLevelUp = useCallback(
    (newLevel: number) => {
      addEvent({
        id: `level-${Date.now()}`,
        type: 'level_up',
        title: `Level Up!`,
        description: `You reached Level ${newLevel}`,
        icon: '🚀',
        timestamp: Date.now(),
      });
    },
    [addEvent]
  );

  const addStreakUpdate = useCallback(
    (streak: number) => {
      addEvent({
        id: `streak-${Date.now()}`,
        type: 'streak',
        title: `${streak} Day Streak! 🔥`,
        description: `Keep it up!`,
        timestamp: Date.now(),
      });
    },
    [addEvent]
  );

  const addMilestone = useCallback(
    (title: string, description: string) => {
      addEvent({
        id: `milestone-${Date.now()}`,
        type: 'milestone',
        title,
        description,
        icon: '🎉',
        timestamp: Date.now(),
      });
    },
    [addEvent]
  );

  const addMotivation = useCallback(
    (message: string) => {
      addEvent({
        id: `motivation-${Date.now()}`,
        type: 'motivation',
        title: message,
        timestamp: Date.now(),
      });
    },
    [addEvent]
  );

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setEvents([]);
  }, []);

  return (
    <GamificationContext.Provider
      value={{
        events,
        addXPAnimation,
        addBadgeUnlock,
        addLevelUp,
        addStreakUpdate,
        addMilestone,
        addMotivation,
        removeEvent,
        clearAll,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
}

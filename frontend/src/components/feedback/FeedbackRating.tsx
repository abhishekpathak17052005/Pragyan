// src/components/feedback/FeedbackRating.tsx

import { useState } from 'react';
import { Star } from 'lucide-react';

interface FeedbackRatingProps {
  value:    number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

const SIZE = { sm: 20, md: 28, lg: 36 };

export function FeedbackRating({ value, onChange, disabled, size = 'md' }: FeedbackRatingProps) {
  const [hovered, setHovered] = useState(0);
  const px = SIZE[size];
  const active = hovered || value;

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => !disabled && setHovered(0)}
        aria-label="Star rating"
        role="group"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${n} — ${LABELS[n]}`}
            onClick={() => !disabled && onChange(n)}
            onMouseEnter={() => !disabled && setHovered(n)}
            className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded disabled:cursor-not-allowed"
          >
            <Star
              style={{ width: px, height: px }}
              className={`transition-colors ${
                n <= active
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-muted-foreground/40'
              }`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      {/* Label row */}
      <div className="flex items-center gap-2 h-5">
        {active > 0 && (
          <span className={`text-sm font-semibold ${
            active <= 2 ? 'text-red-600' : active === 3 ? 'text-amber-600' : 'text-green-600'
          }`}>
            {LABELS[active]}
          </span>
        )}
        {active === 0 && (
          <span className="text-sm text-muted-foreground">Click a star to rate</span>
        )}
      </div>
    </div>
  );
}

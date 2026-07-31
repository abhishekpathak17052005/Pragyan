// src/components/feedback/FeedbackCategory.tsx

import { FEEDBACK_CATEGORIES, CATEGORY_ICONS, type FeedbackCategory } from '@/types/feedback';
import { ChevronDown } from 'lucide-react';

interface FeedbackCategoryProps {
  value:    FeedbackCategory | '';
  onChange: (v: FeedbackCategory) => void;
  error?:   string;
  disabled?: boolean;
}

export function FeedbackCategorySelect({ value, onChange, error, disabled }: FeedbackCategoryProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-foreground">
        Category <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as FeedbackCategory)}
          className={`w-full appearance-none bg-background border rounded-xl px-4 py-3 pr-10 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error ? 'border-red-400' : 'border-border hover:border-primary/50'}`}
        >
          <option value="" disabled>Select a category…</option>
          {FEEDBACK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_ICONS[cat]}  {cat}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {value && (
        <p className="text-xs text-muted-foreground pl-1">
          {CATEGORY_ICONS[value as FeedbackCategory]}  {value}
        </p>
      )}
      {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
  );
}

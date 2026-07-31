// src/components/feedback/FeedbackForm.tsx

import { useState } from 'react';
import { AlertCircle, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackRating } from '@/components/feedback/FeedbackRating';
import { FeedbackCategorySelect } from '@/components/feedback/FeedbackCategory';
import { FeedbackUpload } from '@/components/feedback/FeedbackUpload';
import { useFeedback } from '@/hooks/useFeedback';
import {
  FEEDBACK_PRIORITIES,
  type FeedbackCategory,
  type FeedbackPriority,
  type CreateFeedbackPayload,
} from '@/types/feedback';

interface FeedbackFormProps {
  onSuccess: () => void;
}

interface FormState {
  category:     FeedbackCategory | '';
  rating:       number;
  title:        string;
  description:  string;
  priority:     FeedbackPriority;
  screenshot:   string | null;
  allowContact: boolean;
  anonymous:    boolean;
}

interface FormErrors {
  category?:    string;
  rating?:      string;
  title?:       string;
  description?: string;
}

const INITIAL: FormState = {
  category:     '',
  rating:       0,
  title:        '',
  description:  '',
  priority:     'Medium',
  screenshot:   null,
  allowContact: false,
  anonymous:    false,
};

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      style={{ height: 22, width: 42 }}
    >
      <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {msg}
    </p>
  );
}

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  return (
    <span className={`text-xs tabular-nums ${pct > 0.9 ? 'text-red-500' : 'text-muted-foreground'}`}>
      {current}/{max}
    </span>
  );
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [form,   setForm]   = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { submit } = useFeedback();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.category)
      e.category = 'Please select a category';
    if (!form.rating)
      e.rating = 'Please give a star rating';
    if (!form.title.trim())
      e.title = 'Title is required';
    else if (form.title.trim().length < 5)
      e.title = 'Title must be at least 5 characters';
    else if (form.title.trim().length > 120)
      e.title = 'Title must be at most 120 characters';
    if (!form.description.trim())
      e.description = 'Description is required';
    else if (form.description.trim().length < 20)
      e.description = 'Please provide at least 20 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateFeedbackPayload = {
      category:      form.category as FeedbackCategory,
      rating:        form.rating,
      title:         form.title.trim(),
      description:   form.description.trim(),
      priority:      form.priority,
      screenshotUrl: form.screenshot ?? null,
      allowContact:  form.allowContact,
      anonymous:     form.anonymous,
    };

    submit.mutate(payload, {
      onSuccess: () => {
        setForm(INITIAL);
        setErrors({});
        onSuccess();
      },
    });
  };

  const busy = submit.isPending;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── Category ──────────────────────────────────────────────────────── */}
      <FeedbackCategorySelect
        value={form.category}
        onChange={(v) => { set('category', v); setErrors((p) => ({ ...p, category: undefined })); }}
        error={errors.category}
        disabled={busy}
      />

      {/* ── Rating ──────────────────────────────────────────────────────────── */}
      <div>
        <FieldLabel required>Overall Experience</FieldLabel>
        <FeedbackRating
          value={form.rating}
          onChange={(v) => { set('rating', v); setErrors((p) => ({ ...p, rating: undefined })); }}
          disabled={busy}
          size="lg"
        />
        <FieldError msg={errors.rating} />
      </div>

      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel required>Title</FieldLabel>
          <CharCounter current={form.title.length} max={120} />
        </div>
        <input
          type="text"
          value={form.title}
          disabled={busy}
          maxLength={120}
          placeholder="e.g. Assessment engine should ask fewer questions"
          onChange={(e) => { set('title', e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
          className={`w-full bg-background border rounded-xl px-4 py-2.5 text-sm
            placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40
            transition-colors disabled:opacity-60
            ${errors.title ? 'border-red-400' : 'border-border hover:border-primary/50'}`}
        />
        <FieldError msg={errors.title} />
      </div>

      {/* ── Description ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel required>Detailed Description</FieldLabel>
          <CharCounter current={form.description.length} max={2000} />
        </div>
        <textarea
          rows={5}
          value={form.description}
          disabled={busy}
          maxLength={2000}
          placeholder={`Describe your experience…\n• What happened?\n• What were you expecting?\n• Any suggestions?`}
          onChange={(e) => { set('description', e.target.value); setErrors((p) => ({ ...p, description: undefined })); }}
          className={`w-full bg-background border rounded-xl px-4 py-3 text-sm
            placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40
            transition-colors resize-none disabled:opacity-60 leading-relaxed
            ${errors.description ? 'border-red-400' : 'border-border hover:border-primary/50'}`}
        />
        <FieldError msg={errors.description} />
      </div>

      {/* ── Screenshot ────────────────────────────────────────────────────── */}
      <FeedbackUpload
        value={form.screenshot}
        onChange={(v) => set('screenshot', v)}
        disabled={busy}
      />

      {/* ── Advanced (Priority · Toggles) ─────────────────────────────────── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((x) => !x)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
        >
          <span>Additional Options</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 space-y-5 border-t border-border pt-4 animate-in fade-in slide-in-from-top-1 duration-150">

            {/* Priority */}
            <div>
              <FieldLabel>Priority</FieldLabel>
              <div className="flex gap-2">
                {FEEDBACK_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={busy}
                    onClick={() => set('priority', p)}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                      ${form.priority === p
                        ? p === 'Low'    ? 'border-green-500 bg-green-50 text-green-700'
                          : p === 'High' ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                      }`}
                  >
                    {p === 'Low' ? '🟢' : p === 'Medium' ? '🟡' : '🔴'} {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Allow Contact */}
            <div className="flex items-start justify-between gap-4 py-3 border-t border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">Allow contact</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Let the Pragyan team reach out to you about this feedback.
                </p>
              </div>
              <Toggle on={form.allowContact} onChange={() => set('allowContact', !form.allowContact)} disabled={busy} />
            </div>

            {/* Anonymous */}
            <div className="flex items-start justify-between gap-4 pb-1 border-t border-border pt-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Submit anonymously</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your profile won't be publicly shown. Your account is still linked internally.
                </p>
              </div>
              <Toggle on={form.anonymous} onChange={() => set('anonymous', !form.anonymous)} disabled={busy} />
            </div>

          </div>
        )}
      </div>

      {/* ── Submit button ──────────────────────────────────────────────────── */}
      <Button
        type="submit"
        className="w-full rounded-xl py-3 text-base font-semibold"
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting feedback…
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Feedback
          </>
        )}
      </Button>

    </form>
  );
}

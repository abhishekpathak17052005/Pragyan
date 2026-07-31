// src/pages/settings/FeedbackSettings.tsx

import { useState } from 'react';
import { MessageSquare, History, HelpCircle, ExternalLink } from 'lucide-react';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackHistory } from '@/components/feedback/FeedbackHistory';
import { FeedbackSuccessDialog } from '@/components/feedback/FeedbackSuccessDialog';

type Tab = 'form' | 'history';

const FAQ_ITEMS = [
  {
    q: 'How long before my feedback is reviewed?',
    a: "Our team reviews every submission within 48 hours. You'll see the status update in your history.",
  },
  {
    q: 'Can I edit submitted feedback?',
    a: 'Editing is not supported to preserve a reliable audit trail. You can delete a submission and resubmit.',
  },
  {
    q: 'What does "Anonymous" mean?',
    a: "Your profile info won't be shown publicly, but your account is still linked internally so we can follow up if needed.",
  },
  {
    q: 'Will I be notified when my issue is resolved?',
    a: 'Status changes are visible in your Feedback History. In-app notifications are coming soon.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full text-left flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground pr-4">{q}</span>
        <span className={`text-primary text-lg font-bold flex-shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border animate-in fade-in slide-in-from-top-1 duration-150">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FeedbackSettings() {
  const [activeTab,  setActiveTab]  = useState<Tab>('form');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => setShowSuccess(true);
  const handleAnother = () => { setShowSuccess(false); setActiveTab('form'); };
  const handleHistory = () => { setShowSuccess(false); setActiveTab('history'); };

  return (
    <div className="space-y-6">

      {/* ── Section header ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Feedback &amp; Support</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Report bugs, request features, or share your experience with Pragyan.
        </p>
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      {!showSuccess && (
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
          {(
            [
              { id: 'form',    label: 'Submit Feedback', icon: MessageSquare },
              { id: 'history', label: 'My Submissions',  icon: History       },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content area ──────────────────────────────────────────────────── */}
      {showSuccess ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <FeedbackSuccessDialog
            onSubmitAnother={handleAnother}
            onViewHistory={handleHistory}
          />
        </div>
      ) : activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form panel */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm p-6">
            <FeedbackForm onSuccess={handleSuccess} />
          </div>

          {/* Side panel: tips + FAQ */}
          <div className="space-y-5">

            {/* Tips card */}
            <div className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/20 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Submission Tips</p>
              <ul className="space-y-2.5">
                {[
                  { icon: '🎯', tip: 'Be specific — describe exact steps to reproduce a bug.' },
                  { icon: '📸', tip: 'Attach a screenshot to help us understand the issue faster.' },
                  { icon: '⭐', tip: 'Your rating helps us measure overall satisfaction trends.' },
                  { icon: '✨', tip: 'Feature requests with High priority get reviewed first.' },
                ].map(({ icon, tip }) => (
                  <li key={tip} className="flex items-start gap-2.5 text-xs text-foreground/80">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                FAQ
              </p>
              <div className="space-y-2">
                {FAQ_ITEMS.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
              </div>
            </div>

            {/* Support link */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Need immediate help?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Contact support directly.</p>
              </div>
              <a
                href="mailto:support@pragyan.ai"
                className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
              >
                Email us
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      ) : (
        /* History panel */
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <FeedbackHistory onNewFeedback={() => setActiveTab('form')} />
        </div>
      )}
    </div>
  );
}

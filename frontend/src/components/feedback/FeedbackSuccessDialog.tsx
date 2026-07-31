// src/components/feedback/FeedbackSuccessDialog.tsx

import { CheckCircle2, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackSuccessDialogProps {
  onSubmitAnother: () => void;
  onViewHistory:   () => void;
}

export function FeedbackSuccessDialog({ onSubmitAnother, onViewHistory }: FeedbackSuccessDialogProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
      {/* Icon ring */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground">Feedback submitted!</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Thank you for helping improve Pragyan. Our team reviews every submission.
        </p>
      </div>

      {/* What happens next */}
      <div className="bg-muted/40 rounded-2xl p-4 w-full max-w-sm text-left space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What happens next</p>
        {[
          { step: '1', text: 'Your feedback is now Open in our system' },
          { step: '2', text: 'Our team will review it within 48 hours' },
          { step: '3', text: 'Status updates are visible in your history' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {step}
            </span>
            <p className="text-sm text-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={onSubmitAnother}
        >
          Submit Another
        </Button>
        <Button
          className="flex-1 rounded-xl"
          onClick={onViewHistory}
        >
          View History
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

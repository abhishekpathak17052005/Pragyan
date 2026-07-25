import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, CheckCircle2, Compass, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InterestDiscoveryPage() {
  const [, navigate] = useLocation();
  const [phase1Data, setPhase1Data] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pragyan_phase1_profile');
    if (!stored) {
      navigate('/discovery');
      return;
    }

    const profile = JSON.parse(stored);
    setPhase1Data(profile);
  }, [navigate]);

  useEffect(() => {
    if (!phase1Data) return;
    startInterestDiscovery();
  }, [phase1Data]);

  const startInterestDiscovery = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/assessment/interest/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: phase1Data.userId,
          persona: phase1Data.persona,
          goal: phase1Data.goal,
          currentStage: phase1Data.currentStage,
        }),
      });
      const data = await res.json();
      setCurrentQuestion(data.firstQuestion);
    } catch (err) {
      console.error(err);
      setError('Unable to start interest discovery.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (option: string) => {
    if (!currentQuestion) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/assessment/interest/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: phase1Data.userId,
          questionId: currentQuestion.id,
          answer: option,
        }),
      });
      const data = await res.json();
      if (data.isComplete) {
        setResult(data.result);
        sessionStorage.setItem('pragyan_phase2_profile', JSON.stringify(data.result));
      } else {
        setCurrentQuestion(data.nextQuestion);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit your answer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!phase1Data) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 text-center text-muted-foreground">
        Loading Phase 2...
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8 rounded-[32px] border border-border bg-card p-10 shadow-sm text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Interest Discovery Complete
          </div>
          <h1 className="text-3xl font-bold">Your interest profile is ready</h1>
          <p className="text-sm text-muted-foreground">We mapped your strongest interest area and confidence for the next capability phase.</p>

          <div className="grid gap-4 rounded-3xl border border-border bg-background p-6 text-left">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Primary interest</span>
              <span className="font-semibold text-foreground">{result.primaryInterest}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Secondary interest</span>
              <span className="font-semibold text-foreground">{result.secondaryInterest}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Confidence</span>
              <span className="font-semibold text-foreground">{result.confidence}%</span>
            </div>
          </div>

          <Button
            onClick={() => navigate('/assessment/capability')}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Continue to Capability Engine <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-border bg-card p-10 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-semibold">Phase 2</p>
              <h1 className="text-3xl font-bold">Interest Discovery</h1>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Adaptive analysis active
          </div>
        </div>

        {currentQuestion && (
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{currentQuestion.group}</p>
              <h2 className="text-2xl font-bold text-foreground">{currentQuestion.text}</h2>
            </div>

            <div className="grid gap-4">
              {Object.keys(currentQuestion.options).map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={isLoading}
                  className="rounded-3xl border border-border bg-background px-5 py-4 text-left text-sm font-medium transition hover:border-primary"
                >
                  {option}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {isLoading && (
          <div className="mt-8 text-center text-sm text-muted-foreground">Processing your answer...</div>
        )}
      </div>
    </div>
  );
}

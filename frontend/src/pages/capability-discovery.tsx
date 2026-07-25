import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Brain, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CapabilityDiscoveryPage() {
  const [, navigate] = useLocation();
  const [phase2Data, setPhase2Data] = useState<any>(null);
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('pragyan_phase2_profile');
    if (!stored) {
      navigate('/assessment/interest');
      return;
    }

    setPhase2Data(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    if (!phase2Data) return;
    startCapabilityDiscovery();
  }, [phase2Data]);

  const startCapabilityDiscovery = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assessment/capability/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: phase2Data.userId,
          primaryInterest: phase2Data.primaryInterest,
          secondaryInterest: phase2Data.secondaryInterest,
          interestScores: phase2Data.interestScores,
        }),
      });
      const data = await res.json();
      setCurrentChallenge(data.firstChallenge);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentChallenge || !phase2Data) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/assessment/capability/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: phase2Data.userId,
          challengeId: currentChallenge.id,
          answer,
          timeSpent: 15,
          hintsUsed: 0,
        }),
      });
      const data = await res.json();
      if (data.isComplete) {
        setResult(data.result);
      } else {
        setCurrentChallenge(data.nextChallenge);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setAnswerText('');
    }
  };

  if (!phase2Data) {
    return <div className="min-h-screen bg-background py-12 px-4 text-center text-muted-foreground">Loading Phase 3...</div>;
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-border bg-card p-10 shadow-sm text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Capability Discovery Complete
          </div>
          <h1 className="text-3xl font-bold">Your capability profile is ready</h1>
          <p className="text-sm text-muted-foreground">We have identified your top strengths and the best next technical level for you.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Recommended difficulty</h2>
              <p className="mt-3 text-3xl font-bold text-foreground">{result.recommendedDifficulty}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Strengths</h2>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {result.topStrengths.map((strength: string) => (
                  <div key={strength} className="rounded-2xl bg-muted/60 px-4 py-3">
                    {strength}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
            >
              View Recommended Roadmap <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
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
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-semibold">Phase 3</p>
              <h1 className="text-3xl font-bold">Capability Discovery</h1>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Brain className="h-4 w-4" /> Discover your strengths
          </div>
        </div>

        {currentChallenge && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-border bg-background p-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-sm font-semibold text-muted-foreground">{currentChallenge.type} challenge</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Difficulty {currentChallenge.difficulty}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{currentChallenge.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{currentChallenge.text}</p>
            </div>

            {currentChallenge.type === 'scenario' ? (
              <div className="grid gap-4">
                {currentChallenge.options.map((option: any) => (
                  <button
                    key={option.text}
                    onClick={() => handleSubmitAnswer(option.text)}
                    disabled={isLoading}
                    className="rounded-3xl border border-border bg-background px-5 py-4 text-left text-sm font-medium transition hover:border-primary"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Type your answer..."
                />
                <Button
                  onClick={() => handleSubmitAnswer(answerText)}
                  disabled={!answerText.trim() || isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  Submit Answer <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Submitting your answer…</p>}
      </div>
    </div>
  );
}

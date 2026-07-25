import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Send, CheckCircle2, ChevronRight, Brain } from 'lucide-react';

interface DiscoveryQuestion {
  id: string;
  text: string;
  type: 'number' | 'select' | 'text';
  group: string;
  options?: string[];
}

interface DiscoveryResultData {
  userId: string;
  persona: string;
  confidence: number;
  goal: string;
  currentStage: string;
  learningStyle: string;
  availableTime: string;
}

export default function DiscoveryPage() {
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<DiscoveryQuestion | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; type: 'ai' | 'user'; text: string }>>([
    { id: 'start', type: 'ai', text: "Hi! I'm your Pragyan Career Counselor. Let's start with a quick conversation to understand you better." },
  ]);
  const [answerText, setAnswerText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestionId = useMemo(() => currentQuestion?.id || '', [currentQuestion]);

  useEffect(() => {
    startDiscovery();
  }, []);

  const startDiscovery = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assessment/discovery/start', { method: 'POST' });
      const data = await res.json();
      setUserId(data.userId);
      setCurrentQuestion(data.firstQuestion);
      appendMessage({ id: data.firstQuestion.id, type: 'ai', text: data.firstQuestion.text });
    } catch (err) {
      console.error('Failed to start discovery', err);
    } finally {
      setIsLoading(false);
    }
  };

  const appendMessage = (message: { id: string; type: 'ai' | 'user'; text: string }) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion || !userId) return;

    appendMessage({ id: `user-${Date.now()}`, type: 'user', text: answer });
    setIsTyping(true);
    setAnswerText('');

    try {
      const res = await fetch('/api/assessment/discovery/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questionId: currentQuestion.id, answer }),
      });
      const data = await res.json();

      if (data.isComplete) {
        setResult(data);
        sessionStorage.setItem('pragyan_phase1_profile', JSON.stringify(data.result));
        appendMessage({ id: 'complete', type: 'ai', text: 'Great! I have mapped your career persona and next step recommendation.' });
      } else {
        setCurrentQuestion(data.nextQuestion);
        appendMessage({ id: data.nextQuestion.id, type: 'ai', text: data.nextQuestion.text });
      }
    } catch (err) {
      console.error('Failed to submit answer', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;
    const answer = answerText.trim();
    if (!answer) return;
    handleAnswer(answer);
  };

  if (result) {
    return <DiscoveryResult result={result} onContinue={() => navigate('/assessment/interest')} />;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground font-semibold">Phase 1</p>
              <h1 className="text-3xl font-bold">User Discovery</h1>
            </div>
          </div>

          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-3xl p-4 ${message.type === 'ai' ? 'bg-muted text-foreground self-start' : 'bg-primary/10 text-primary self-end'} max-w-[90%]`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            ))}
            {isTyping && (
              <div className="rounded-3xl p-4 bg-muted text-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
                  <span className="h-2 w-2 rounded-full bg-foreground animate-pulse delay-150" />
                  <span className="h-2 w-2 rounded-full bg-foreground animate-pulse delay-300" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            {currentQuestion?.type === 'select' ? (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="rounded-3xl border border-border bg-background px-5 py-4 text-left text-sm font-medium transition hover:border-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type={currentQuestion?.type === 'number' ? 'number' : 'text'}
                  value={answerText}
                  onChange={(event) => setAnswerText(event.target.value)}
                  className="min-w-0 flex-1 rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Type your answer..."
                />
                <button
                  onClick={handleSubmit}
                  className="inline-flex h-12 items-center justify-center rounded-3xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscoveryResult({ result, onContinue }: { result: any; onContinue: () => void }) {
  const profile = result.result;
  const persona = result.personaDetails;

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-border bg-card p-10 shadow-sm">
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Discovery Complete
          </div>
          <h1 className="text-4xl font-bold">Your Career Persona is Ready</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Based on your answers, we have identified a personalized learning style, stage, and next assessment path.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Persona</h2>
            <p className="mt-2 text-xl font-bold">{persona.title}</p>
            <p className="mt-4 text-sm text-muted-foreground">{persona.description}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold">Profile Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Confidence</span>
                <span className="font-semibold text-foreground">{profile.confidence}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Learning Style</span>
                <span className="font-semibold text-foreground">{profile.learningStyle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Time Available</span>
                <span className="font-semibold text-foreground">{profile.availableTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Career Goal</span>
                <span className="font-semibold text-foreground">{profile.goal}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Next step:</p>
            <p className="text-base font-semibold">{persona.nextStep}</p>
          </div>
          <button
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Continue to Interest Discovery <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

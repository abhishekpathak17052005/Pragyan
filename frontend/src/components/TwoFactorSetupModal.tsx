// src/components/TwoFactorSetupModal.tsx

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, X, Loader2, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';

interface TwoFAStatus { enabled: boolean; }
interface SetupData   { secret: string; otpauthUrl: string; qrDataUrl: string; }

// The api client already unwraps { success, data } → returns data directly
const twoFAService = {
  getStatus:  (): Promise<TwoFAStatus> => api.get<TwoFAStatus>('/auth/2fa/status'),
  setup:      (): Promise<SetupData>   => api.post<SetupData>('/auth/2fa/setup', {}),
  enable:     (secret: string, token: string) => api.post('/auth/2fa/enable', { secret, token }),
  disable:    (token: string)                 => api.post('/auth/2fa/disable', { token }),
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TwoFactorSetupModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const statusQ = useQuery({
    queryKey: ['2fa', 'status'],
    queryFn:  twoFAService.getStatus,
    enabled: open,
  });

  const enabled = statusQ.data?.enabled ?? false;

  // ── Enable flow ─────────────────────────────────────────────────────────────
  const [setupData, setSetupData]   = useState<SetupData | null>(null);
  const [enableToken, setEnableToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [step, setStep] = useState<'idle' | 'scan' | 'verify' | 'done'>('idle');

  const setupMut = useMutation({
    mutationFn: twoFAService.setup,
    onSuccess: (data) => {
      setSetupData(data);
      setStep('scan');
    },
    onError: (e: Error) => toast({ title: 'Setup failed', description: e.message, variant: 'destructive' }),
  });

  const enableMut = useMutation({
    mutationFn: () => twoFAService.enable(setupData!.secret, enableToken),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['2fa', 'status'] });
      setStep('done');
      toast({ title: '2FA enabled', description: 'Your account is now protected.' });
    },
    onError: (e: Error) => toast({ title: 'Verification failed', description: e.message, variant: 'destructive' }),
  });

  const disableMut = useMutation({
    mutationFn: () => twoFAService.disable(disableToken),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['2fa', 'status'] });
      setDisableToken('');
      toast({ title: '2FA disabled', description: 'Two-factor authentication has been removed.' });
    },
    onError: (e: Error) => toast({ title: 'Failed to disable', description: e.message, variant: 'destructive' }),
  });

  const handleClose = () => {
    setStep('idle');
    setSetupData(null);
    setEnableToken('');
    setDisableToken('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Two-Factor Authentication</h2>
          </div>
          <button type="button" onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading */}
        {statusQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* ── Already enabled — show disable flow ── */}
        {!statusQ.isLoading && enabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">2FA is active</p>
                <p className="text-xs text-green-700">Your account has extra protection enabled.</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To disable 2FA, enter a code from your authenticator app:
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm text-center tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl flex items-center gap-2"
                disabled={disableToken.length !== 6 || disableMut.isPending}
                onClick={() => disableMut.mutate()}
              >
                {disableMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                Disable 2FA
              </Button>
            </div>
          </div>
        )}

        {/* ── Not enabled — step 0: intro ── */}
        {!statusQ.isLoading && !enabled && step === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">2FA is not enabled</p>
                <p className="text-xs text-amber-700 mt-0.5">Enabling 2FA adds an extra layer of security using an authenticator app.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You'll need an app like <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP-compatible app on your phone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl flex items-center gap-2"
                onClick={() => setupMut.mutate()}
                disabled={setupMut.isPending}
              >
                {setupMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                Set Up 2FA
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 1: scan QR ── */}
        {!enabled && step === 'scan' && setupData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app, then click <strong>Next</strong>.
            </p>
            <div className="flex justify-center">
              <img
                src={setupData.qrDataUrl}
                alt="2FA QR code"
                className="w-44 h-44 rounded-xl border border-border p-1 shadow-sm"
              />
            </div>
            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">Can't scan? Enter manually</summary>
              <code className="mt-2 block text-center font-mono text-foreground bg-muted px-3 py-2 rounded-lg select-all">
                {setupData.secret}
              </code>
            </details>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('idle')}>Back</Button>
              <Button className="flex-1 rounded-xl" onClick={() => setStep('verify')}>Next →</Button>
            </div>
          </div>
        )}

        {/* ── Step 2: verify code ── */}
        {!enabled && step === 'verify' && setupData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code shown in your authenticator app to confirm setup.
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000 000"
              value={enableToken}
              onChange={(e) => setEnableToken(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-border rounded-xl text-lg text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('scan')}>Back</Button>
              <Button
                className="flex-1 rounded-xl flex items-center gap-2"
                disabled={enableToken.length !== 6 || enableMut.isPending}
                onClick={() => enableMut.mutate()}
              >
                {enableMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enable 2FA
              </Button>
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            <div>
              <p className="text-base font-bold text-foreground">2FA is now active!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll be asked for a verification code each time you log in.
              </p>
            </div>
            <Button className="rounded-xl w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}

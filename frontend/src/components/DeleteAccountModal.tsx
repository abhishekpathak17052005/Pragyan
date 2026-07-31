// src/components/DeleteAccountModal.tsx

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trash2, X, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: Props) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [password, setPassword]         = useState('');
  const [confirmText, setConfirmText]   = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const CONFIRM_PHRASE = 'delete my account';

  const deleteMut = useMutation({
    mutationFn: () => api.delete('/auth/account', { data: { password } } as any),
    onSuccess: () => {
      toast({ title: 'Account deleted', description: 'Your account and all data have been permanently removed.' });
      logout();
    },
    onError: (e: Error) => {
      toast({ title: 'Deletion failed', description: e.message, variant: 'destructive' });
    },
  });

  const canSubmit = password.trim().length >= 1 && confirmText.toLowerCase() === CONFIRM_PHRASE && !deleteMut.isPending;

  const handleClose = () => {
    if (deleteMut.isPending) return;
    setPassword('');
    setConfirmText('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-card border border-destructive/30 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-base font-bold">Delete Account</h2>
          </div>
          <button type="button" onClick={handleClose} disabled={deleteMut.isPending}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-destructive">This action cannot be undone.</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Your profile, roadmap, and assessment history will be permanently deleted.</li>
            <li>You will be logged out immediately.</li>
            <li>Any active subscriptions will be cancelled.</li>
          </ul>
        </div>

        {/* Confirm phrase */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Type <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span> to confirm:
          </label>
          <input
            type="text"
            placeholder={CONFIRM_PHRASE}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Enter your password:</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose} disabled={deleteMut.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-xl flex items-center gap-2"
            disabled={!canSubmit}
            onClick={() => deleteMut.mutate()}
          >
            {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleteMut.isPending ? 'Deleting…' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}

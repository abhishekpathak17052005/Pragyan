// src/components/feedback/FeedbackUpload.tsx

import { useRef, useState } from 'react';
import { ImagePlus, X, AlertCircle } from 'lucide-react';

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface FeedbackUploadProps {
  value?:    string | null;    // data-URL or remote URL already uploaded
  onChange:  (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function FeedbackUpload({ value, onChange, disabled }: FeedbackUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PNG, JPG, JPEG, and WEBP files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = () => {
    setError(null);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">
        Screenshot{' '}
        <span className="text-muted-foreground font-normal">(optional · PNG/JPG/WEBP · max {MAX_SIZE_MB} MB)</span>
      </label>

      {value ? (
        /* ── Preview ─────────────────────────────────────────────────── */
        <div className="relative inline-block rounded-xl overflow-hidden border border-border shadow-sm">
          <img
            src={value}
            alt="Screenshot preview"
            className="max-h-48 max-w-full object-contain rounded-xl"
          />
          {!disabled && (
            <button
              type="button"
              onClick={remove}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              aria-label="Remove screenshot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* ── Drop zone ───────────────────────────────────────────────── */
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full flex flex-col items-center gap-2 border-2 border-dashed rounded-xl py-8 px-4 text-sm
            transition-colors cursor-pointer
            ${dragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <ImagePlus className="w-8 h-8 text-muted-foreground" />
          <span className="text-muted-foreground text-center">
            Drag & drop or <span className="text-primary font-semibold">browse</span>
          </span>
          <span className="text-xs text-muted-foreground/70">PNG · JPG · WEBP · max {MAX_SIZE_MB} MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleInput}
        disabled={disabled}
      />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

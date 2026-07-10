import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface CareerModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (career: { name: string; title?: string; description: string; thumbnail?: string }) => void;
  initialValues?: { title?: string; name?: string; description?: string; thumbnail?: string };
}

export function CareerModal({ isOpen, isLoading, onClose, onSave, initialValues }: CareerModalProps) {
  const [form, setForm] = useState({
    name: initialValues?.name || initialValues?.title || '',
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    thumbnail: initialValues?.thumbnail || '',
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Career name is required');
      return;
    }
    if (!form.description.trim()) {
      alert('Career description is required (minimum 10 characters)');
      return;
    }
    onSave({ name: form.name, title: form.title, description: form.description, thumbnail: form.thumbnail });
    setForm({ name: '', title: '', description: '', thumbnail: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Career' : 'Create Career'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Career Name *</label>
            <Input
              placeholder="e.g., Frontend Developer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Description *</label>
            <Textarea
              placeholder="Brief description of the career path (min 10 characters)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {initialValues ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

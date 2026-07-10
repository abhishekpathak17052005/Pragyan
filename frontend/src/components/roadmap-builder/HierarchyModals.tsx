import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// ============ MODULE MODAL ============

interface ModuleModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (module: { title: string; description?: string }) => void;
  initialValues?: { title: string; description?: string };
}

export function ModuleModal({ isOpen, isLoading, onClose, onSave, initialValues }: ModuleModalProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Module title is required');
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Module' : 'Add Module'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Module Title *</label>
            <Input
              placeholder="e.g., HTML & CSS Fundamentals"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea rows={3} placeholder="Module description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ WEEK MODAL ============

interface WeekModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (week: { title: string; description?: string }) => void;
  initialValues?: { title: string; description?: string };
}

export function WeekModal({ isOpen, isLoading, onClose, onSave, initialValues }: WeekModalProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Week title is required');
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Week' : 'Add Week'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Week Title *</label>
            <Input placeholder="e.g., Week 1: Getting Started" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea rows={3} placeholder="Week description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ DAY MODAL ============

interface DayModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (day: { title: string; description?: string; estimatedHours?: number }) => void;
  initialValues?: { title: string; description?: string; estimatedHours?: number };
}

export function DayModal({ isOpen, isLoading, onClose, onSave, initialValues }: DayModalProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    estimatedHours: initialValues?.estimatedHours?.toString() || '1',
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Day title is required');
      return;
    }
    onSave({
      title: form.title,
      description: form.description,
      estimatedHours: parseInt(form.estimatedHours) || 1,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Day' : 'Add Day'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Day Title *</label>
            <Input placeholder="e.g., Day 1: HTML Structure" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea rows={2} placeholder="What will be covered" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Estimated Hours</label>
            <Input type="number" min="1" max="8" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ TOPIC MODAL ============

interface TopicModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (topic: { title: string; description?: string; objective?: string }) => void;
  initialValues?: { title: string; description?: string; objective?: string };
}

export function TopicModal({ isOpen, isLoading, onClose, onSave, initialValues }: TopicModalProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    objective: initialValues?.objective || '',
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Topic title is required');
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Topic Title *</label>
            <Input placeholder="e.g., HTML Semantic Tags" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea rows={2} placeholder="Topic description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Learning Objective</label>
            <Input placeholder="What students will learn" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ RESOURCE MODAL ============

const resourceTypes = ['VIDEO', 'ARTICLE', 'DOCUMENTATION', 'COURSE', 'PRACTICE', 'PROJECT', 'BOOK', 'CHEATSHEET', 'OTHER'];

interface ResourceModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (resource: {
    title: string;
    url: string;
    provider: string;
    type: string;
    difficulty?: string;
    language?: string;
    free?: boolean;
    verified?: boolean;
  }) => void;
  initialValues?: any;
}

export function ResourceModal({ isOpen, isLoading, onClose, onSave, initialValues }: ResourceModalProps) {
  const [form, setForm] = useState({
    title: initialValues?.title || '',
    url: initialValues?.url || '',
    provider: initialValues?.provider || '',
    type: initialValues?.type || 'DOCUMENTATION',
    difficulty: initialValues?.difficulty || 'beginner',
    language: initialValues?.language || 'en',
    free: initialValues?.free !== false,
    verified: initialValues?.verified || false,
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.url.trim()) {
      alert('Title and URL are required');
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <Input placeholder="Resource title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">URL *</label>
            <Input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Provider</label>
            <Input placeholder="e.g., MDN, YouTube, Coursera" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.free} onChange={(checked) => setForm({ ...form, free: checked })} />
            <label className="text-sm font-medium">Free</label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.verified} onChange={(checked) => setForm({ ...form, verified: checked })} />
            <label className="text-sm font-medium">Verified</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

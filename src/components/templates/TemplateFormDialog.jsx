import db from '@/api/base44Client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { useEffect as useEffectReact } from 'react';
import { toast } from 'sonner';

export default function TemplateFormDialog({ open, onOpenChange, template }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', base_price: '', image_url: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (template) {
      setForm({ name: template.name || '', description: template.description || '', base_price: template.base_price?.toString() || '', image_url: template.image_url || '' });
    } else {
      setForm({ name: '', description: '', base_price: '', image_url: '' });
    }
  }, [template, open]);

  useEffectReact(() => {
    if (!open) return;
    const onBeforeBack = (e) => {
      e.preventDefault();
      onOpenChange(false);
    };
    window.addEventListener('app:before-back', onBeforeBack);
    return () => window.removeEventListener('app:before-back', onBeforeBack);
  }, [open, onOpenChange]);

  const mutation = useMutation({
    mutationFn: (data) => template
      ? db.entities.WindowTemplate.update(template.id, data)
      : db.entities.WindowTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); onOpenChange(false); },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.heic') || name.endsWith('.heif') || (file.type || '').includes('heic')) {
      toast.message('HEIC not supported. Please use JPG or PNG.');
      return;
    }
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file, maxSize: 512, square: true, quality: 0.9 });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, base_price: parseFloat(form.base_price) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'New Template'}</DialogTitle>
        </DialogHeader>
        {form.image_url && (
          <img
            src={form.image_url}
            alt=""
            className="w-full h-44 object-cover rounded-lg"
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. French Door" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} />
          </div>
          <div>
            <Label>Base Price ($) *</Label>
            <Input type="number" step="0.01" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0.00" required />
          </div>
          <div>
            <Label>Image</Label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : template?.id?.startsWith('tpl_') ? 'Image locked for base templates' : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={template?.id?.startsWith('tpl_')}
              />
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : template ? 'Update' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

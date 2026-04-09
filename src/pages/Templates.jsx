import db from '@/api/localDb';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import TemplateFormDialog from '@/components/templates/TemplateFormDialog';

export default function Templates() {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.WindowTemplate.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.WindowTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const handleEdit = (t) => { setEditingTemplate(t); setShowForm(true); };
  const handleNew = () => { setEditingTemplate(null); setShowForm(true); };

  return (
    <div>
      <PageHeader
        title="Window Templates"
        subtitle={`${templates.length} types`}
        actions={<Button size="sm" className="gap-1.5" onClick={handleNew}><Plus className="w-4 h-4" /> Add</Button>}
      />

      <div className="p-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
        {!isLoading && templates.length === 0 && (
          <EmptyState icon={Layers} title="No templates" description="Add window types to start building quotes" actionLabel="Add Template" onAction={handleNew} />
        )}
        {templates.map(t => (
          <Card key={t.id} className="overflow-hidden">
            <div className="flex p-3 gap-3">
              {t.image_url ? (
                <img
                  src={t.image_url}
                  alt={t.name}
                  className="w-36 h-36 object-cover shrink-0 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-36 h-36 bg-muted flex items-center justify-center shrink-0 rounded-lg">
                  <Layers className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{t.description || 'No description'}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-primary">${t.base_price?.toFixed(2)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {!t.id?.startsWith('tpl_') && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <TemplateFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        template={editingTemplate}
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name || 'this template'} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.id) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


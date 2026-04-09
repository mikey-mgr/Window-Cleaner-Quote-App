import db from '@/api/base44Client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

export default function DeleteAccountDialog({ open, onOpenChange }) {
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const canDelete = confirm.trim().toLowerCase() === 'delete my account';

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    // Log the user out — account deletion requires platform-level support
    // This logs out and informs the user to contact support for full deletion
    db.auth.logout('/');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-left">Delete Account</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            This will permanently log you out and remove your session. To fully delete your account and all data, please contact support after logging out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs text-muted-foreground">
              Type <span className="font-semibold text-destructive">delete my account</span> to confirm
            </Label>
            <Input
              className="mt-1.5"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="delete my account"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!canDelete || loading}
              onClick={handleDelete}
            >
              {loading ? 'Processing...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
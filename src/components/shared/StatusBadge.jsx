import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  paid: { label: 'Paid', className: 'bg-primary/15 text-primary' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant="secondary" className={cn('text-[10px] font-semibold px-2 py-0.5', config.className)}>
      {config.label}
    </Badge>
  );
}
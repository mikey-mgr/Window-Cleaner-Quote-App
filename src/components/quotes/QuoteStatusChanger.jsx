import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUSES = [
  { value: 'draft', label: 'Draft', emoji: '📝' },
  { value: 'sent', label: 'Sent', emoji: '📤' },
  { value: 'in_progress', label: 'In Progress', emoji: '🔧' },
  { value: 'completed', label: 'Completed', emoji: '✅' },
  { value: 'paid', label: 'Paid', emoji: '💰' },
];

export default function QuoteStatusChanger({ quote, onUpdate }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Status</h3>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUSES.map(s => (
          <Button
            key={s.value}
            variant={quote.status === s.value ? 'default' : 'outline'}
            size="sm"
            className={cn('text-xs whitespace-nowrap shrink-0', quote.status === s.value && 'shadow-sm')}
            onClick={() => onUpdate(s.value)}
          >
            {s.emoji} {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
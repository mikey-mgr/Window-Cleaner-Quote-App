import db from '@/api/base44Client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullRefreshIndicator from '@/components/shared/PullRefreshIndicator';
import { getNeighborhoodMultiplier } from '@/lib/neighborhoodMultipliers';
import { calcGrandTotal } from '@/lib/quoteUtils';
import { formatDateTime } from '@/lib/dateUtils';

export default function Quotes() {
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => db.entities.Quote.list('-created_date', 100),
  });

  useEffect(() => {
    const handler = async (e) => {
      if (e?.detail?.neighborhood) {
        const neighborhood = e.detail.neighborhood;
        const mult = getNeighborhoodMultiplier(neighborhood);
        const allQuotes = await db.entities.Quote.list('-created_date', 200);
        const toUpdate = allQuotes.filter((q) => q.customer_neighborhood === neighborhood);
        await Promise.all(toUpdate.map((q) => {
          const updatedItems = (q.line_items || []).map((item) => {
            if (item.price_overridden) return item;
            const base = item.base_unit_price ?? item.unit_price ?? 0;
            return { ...item, base_unit_price: base, unit_price: base * mult };
          });
          const grandTotal = calcGrandTotal(updatedItems, q.neighborhood_discount || 0);
          return db.entities.Quote.update(q.id, { line_items: updatedItems, grand_total: grandTotal });
        }));
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
      }
    };
    window.addEventListener('neighborhood-multiplier-change', handler);
    return () => window.removeEventListener('neighborhood-multiplier-change', handler);
  }, [queryClient]);

  const { containerRef, pullY, refreshing } = usePullToRefresh(() =>
    queryClient.invalidateQueries({ queryKey: ['quotes'] })
  );

  const filtered = statusFilter === 'all' ? quotes : quotes.filter(q => q.status === statusFilter);

  return (
    <div ref={containerRef} className="overflow-y-auto h-full">
      <PullRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <PageHeader
        title="Quotes"
        subtitle={`${quotes.length} total`}
        actions={<Button size="sm" className="gap-1.5" onClick={() => navigate('/quotes/new')}><Plus className="w-4 h-4" /> New</Button>}
      />

      <div className="px-4 pt-3 pb-2 overflow-x-auto">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
            <TabsTrigger value="sent" className="text-xs">Sent</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
            <TabsTrigger value="paid" className="text-xs">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={FileText} title="No quotes" description="Create your first quote" actionLabel="New Quote" onAction={() => navigate('/quotes/new')} />
        )}
        {filtered.map(q => (
          <Link key={q.id} to={`/quotes/${q.id}`}>
            <Card className="p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{q.customer_name || 'No customer'}</p>
                  <p className="text-xs text-muted-foreground truncate">{q.customer_address || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.line_items?.length || 0} items</p>
                  {q.created_date && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Quoted: {formatDateTime(q.created_date)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold">${(q.grand_total || 0).toFixed(2)}</p>
                  <StatusBadge status={q.status} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

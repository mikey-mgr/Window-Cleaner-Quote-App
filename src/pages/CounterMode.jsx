import db from '@/api/localDb';

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Minus, Plus, Check } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { calcGrandTotal, getMultiplierForDifficulty } from '@/lib/quoteUtils';
import { motion } from 'framer-motion';

export default function CounterMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: quoteArr } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => db.entities.Quote.filter({ id }),
  });
  const quote = quoteArr?.[0];

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.WindowTemplate.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (lineItems) => {
      const grandTotal = calcGrandTotal(lineItems, quote?.neighborhood_discount || 0);
      return db.entities.Quote.update(id, { line_items: lineItems, grand_total: grandTotal });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quote', id] }),
  });

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = quote.line_items || [];

  const getCount = (templateId) => {
    return items.filter(i => i.template_id === templateId).reduce((sum, i) => sum + i.quantity, 0);
  };

  const incrementTemplate = (t) => {
    const existing = items.find(i => i.template_id === t.id && i.difficulty === 'normal');
    let updated;
    if (existing) {
      updated = items.map(i =>
        i.template_id === t.id && i.difficulty === 'normal'
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      updated = [...items, {
        template_id: t.id,
        template_name: t.name,
        template_image: t.image_url || '',
        quantity: 1,
        unit_price: t.base_price || 0,
        difficulty: 'normal',
        multiplier: 1,
      }];
    }
    updateMutation.mutate(updated);
  };

  const decrementTemplate = (t) => {
    const existing = items.find(i => i.template_id === t.id && i.difficulty === 'normal');
    if (!existing || existing.quantity <= 0) return;
    let updated;
    if (existing.quantity === 1) {
      updated = items.filter(i => !(i.template_id === t.id && i.difficulty === 'normal'));
    } else {
      updated = items.map(i =>
        i.template_id === t.id && i.difficulty === 'normal'
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    }
    updateMutation.mutate(updated);
  };

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div>
      <PageHeader
        title="Counter Mode"
        subtitle={`${quote.customer_name} — ${totalCount} windows`}
        backPath={`/quotes/${id}`}
        actions={
          <Button size="sm" className="gap-1" onClick={() => navigate(`/quotes/${id}`)}>
            <Check className="w-4 h-4" /> Done
          </Button>
        }
      />

      <div className="p-4 pb-28">
        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => {
            const count = getCount(t.id);
            return (
              <motion.div key={t.id} whileTap={{ scale: 0.97 }}>
                <Card className="overflow-hidden relative">
                  {/* Image */}
                  {t.image_url ? (
                    <img src={t.image_url} alt={t.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-muted flex items-center justify-center">
                      <Layers className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Count badge */}
                  {count > 0 && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-sm font-bold h-7 w-7 flex items-center justify-center p-0 rounded-full">
                      {count}
                    </Badge>
                  )}

                  <div className="p-2.5">
                    <p className="text-xs font-semibold truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">${t.base_price?.toFixed(2)}</p>

                    {/* Tap buttons */}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 text-lg font-bold"
                        onClick={(e) => { e.stopPropagation(); decrementTemplate(t); }}
                        disabled={count === 0}
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      <Button
                        className="flex-1 h-11 text-lg font-bold"
                        onClick={(e) => { e.stopPropagation(); incrementTemplate(t); }}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Add window templates first</p>
            <Button variant="link" onClick={() => navigate('/templates')}>Go to Templates</Button>
          </div>
        )}
      </div>

      {/* Floating total bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
        <div className="bg-card border border-border rounded-xl shadow-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{totalCount} windows</p>
            <p className="text-lg font-bold">${(quote.grand_total || 0).toFixed(2)}</p>
          </div>
          <Button onClick={() => navigate(`/quotes/${id}`)} className="gap-1.5">
            <Check className="w-4 h-4" /> Review Quote
          </Button>
        </div>
      </div>
    </div>
  );
}


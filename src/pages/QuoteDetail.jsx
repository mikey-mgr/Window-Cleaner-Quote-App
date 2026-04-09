import db from '@/api/base44Client';

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Grid2x2, Share2, Copy, Camera, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import QuoteLineItems from '@/components/quotes/QuoteLineItems';
import QuoteDiscount from '@/components/quotes/QuoteDiscount';
import QuotePhotos from '@/components/quotes/QuotePhotos';
import QuoteStatusChanger from '@/components/quotes/QuoteStatusChanger';
import { calcDiscountAmount, calcGrandTotal, generateWhatsAppText } from '@/lib/quoteUtils';
import { getNeighborhoodMultiplier } from '@/lib/neighborhoodMultipliers';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/dateUtils';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: quoteArr, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => db.entities.Quote.filter({ id }),
  });
  const quote = quoteArr?.[0];

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.WindowTemplate.list(),
  });
  const templateMap = Object.fromEntries(templates.map(t => [t.id, t]));

  const updateMutation = useMutation({
    mutationFn: (data) => db.entities.Quote.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quote', id] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const { id: _id, created_date, updated_date, created_by, ...data } = quote;
      return db.entities.Quote.create({ ...data, status: 'draft' });
    },
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Quote duplicated');
      navigate(`/quotes/${newQuote.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => db.entities.Quote.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); navigate('/quotes'); },
  });

  const handleUpdateItems = (lineItems) => {
    const grandTotal = calcGrandTotal(lineItems, quote.neighborhood_discount || 0);
    updateMutation.mutate({ line_items: lineItems, grand_total: grandTotal });
  };

  const handleUpdateDiscount = (discount) => {
    const grandTotal = calcGrandTotal(quote.line_items || [], discount);
    updateMutation.mutate({ neighborhood_discount: discount, grand_total: grandTotal });
  };

  const handleShareWhatsApp = async () => {
    let phone = quote.customer_phone || '';
    if (!phone && quote.customer_id) {
      const customer = await db.entities.Customer.get(quote.customer_id);
      phone = customer?.phone || '';
    }
    const discountAmount = calcDiscountAmount(quote.line_items || [], quote.neighborhood_discount || 0);
    const text = generateWhatsAppText(quote, discountAmount);
    const digits = String(phone).replace(/\D/g, '');
    const url = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!quote) return;
    let neighborhood = quote.customer_neighborhood;
    if (!neighborhood && quote.customer_id) {
      db.entities.Customer.get(quote.customer_id).then((c) => {
        if (c?.neighborhood) {
          updateMutation.mutate({ customer_neighborhood: c.neighborhood });
        }
      });
    }
  }, [quote?.customer_neighborhood, quote?.customer_id]);

  useEffect(() => {
    if (!quote) return;
    const applyMultiplier = (mult) => {
      const updated = (quote.line_items || []).map((item) => {
        if (item.price_overridden) return item;
        const templateBase = templateMap[item.template_id]?.base_price;
        const base = item.base_unit_price ?? templateBase ?? item.unit_price ?? 0;
        const nextPrice = base * mult;
        if (nextPrice === item.unit_price) return item;
        return { ...item, base_unit_price: base, unit_price: nextPrice };
      });
      const changed = updated.some((item, i) => item !== (quote.line_items || [])[i]);
      if (changed) {
        const grandTotal = calcGrandTotal(updated, quote.neighborhood_discount || 0);
        updateMutation.mutate({ line_items: updated, grand_total: grandTotal });
      }
    };

    const neighborhood = quote.customer_neighborhood;
    if (neighborhood) {
      const mult = getNeighborhoodMultiplier(neighborhood);
      applyMultiplier(mult);
    }

    const handler = (e) => {
      if (e?.detail?.neighborhood && e.detail.neighborhood === quote.customer_neighborhood) {
        applyMultiplier(e.detail.value);
      }
    };
    window.addEventListener('neighborhood-multiplier-change', handler);
    return () => window.removeEventListener('neighborhood-multiplier-change', handler);
  }, [quote?.id, quote?.customer_neighborhood, quote?.line_items, quote?.neighborhood_discount, templates.length]);

  if (isLoading || !quote) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={quote.customer_name || 'Quote'}
        subtitle={quote.customer_address}
        backPath="/quotes"
        actions={<StatusBadge status={quote.status} />}
      />

      <div className="p-4 space-y-4">
        {quote.created_date && (
          <div className="text-xs text-muted-foreground">
            Quoted: {formatDateTime(quote.created_date)}
          </div>
        )}
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-1.5 flex-1" onClick={() => navigate(`/counter/${id}`)}>
            <Grid2x2 className="w-4 h-4" /> Counter Mode
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={handleShareWhatsApp}>
            <Share2 className="w-4 h-4" /> WhatsApp
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => duplicateMutation.mutate()}>
            <Copy className="w-4 h-4" /> Duplicate
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 flex-1 text-destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>

        {/* Status */}
        <QuoteStatusChanger quote={quote} onUpdate={(status) => updateMutation.mutate({ status })} />

        {/* Line Items */}
        <QuoteLineItems quote={quote} onUpdate={handleUpdateItems} />

        {/* Discount */}
        <QuoteDiscount discount={quote.neighborhood_discount || 0} onUpdate={handleUpdateDiscount} />

        {/* Grand Total */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Discount: ${calcDiscountAmount(quote.line_items || [], quote.neighborhood_discount || 0).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mb-1">Grand Total</p>
          <p className="text-3xl font-bold text-primary">${(quote.grand_total || 0).toFixed(2)}</p>
        </div>

      {/* Photos */}
      <QuotePhotos quote={quote} onUpdate={(photos) => updateMutation.mutate({ photos })} />
    </div>
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this quote and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteMutation.mutate()}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}

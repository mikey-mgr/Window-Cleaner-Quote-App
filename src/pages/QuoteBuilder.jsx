import db from '@/api/base44Client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';

export default function QuoteBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const draftKey = 'quoteBuilder';

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => db.entities.Customer.list(),
  });

  useEffect(() => {
    const draft = loadDraft(draftKey);
    if (draft?.selectedCustomerId) {
      setSelectedCustomerId(draft.selectedCustomerId);
    }
  }, []);

  useEffect(() => {
    const save = () => saveDraft(draftKey, { selectedCustomerId });
    const id = setTimeout(save, 200);
    const onBeforeBack = () => save();
    window.addEventListener('app:before-back', onBeforeBack);
    return () => {
      clearTimeout(id);
      window.removeEventListener('app:before-back', onBeforeBack);
    };
  }, [selectedCustomerId]);

  const createMutation = useMutation({
    mutationFn: async (customerId) => {
      const customer = customers.find(c => c.id === customerId);
      return db.entities.Quote.create({
        customer_id: customerId,
        customer_name: customer?.name || '',
        customer_address: customer?.address || customer?.neighborhood || '',
        customer_neighborhood: customer?.neighborhood || '',
        customer_phone: customer?.phone || '',
        status: 'draft',
        line_items: [],
        photos: [],
        neighborhood_discount: 0,
        grand_total: 0,
      });
    },
    onSuccess: (quote) => {
      clearDraft(draftKey);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      navigate(`/quotes/${quote.id}`);
    },
  });

  return (
    <div>
      <PageHeader title="New Quote" backPath="/quotes" />
      <div className="p-5 space-y-6">
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Create a New Quote</h2>
          <p className="text-sm text-muted-foreground mt-1">Select a customer to get started</p>
        </div>

        <div>
          <Label>Customer *</Label>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Choose a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{c.neighborhood || ''}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full h-12 text-sm font-semibold"
          disabled={!selectedCustomerId || createMutation.isPending}
          onClick={() => createMutation.mutate(selectedCustomerId)}
        >
          {createMutation.isPending ? 'Creating...' : 'Start Quote'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Don't see your customer? <button onClick={() => navigate('/customers/new')} className="text-primary font-medium underline">Add one first</button>
        </p>
      </div>
    </div>
  );
}

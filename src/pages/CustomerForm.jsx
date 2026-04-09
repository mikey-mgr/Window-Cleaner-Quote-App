import db from '@/api/base44Client';

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import { getNeighborhoodMultiplier, setNeighborhoodMultiplier } from '@/lib/neighborhoodMultipliers';
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts';
import { formatDateTime } from '@/lib/dateUtils';

const NEIGHBORHOODS = [
  "Adylinn",
  "Alexandra Park",
  "Arcadia",
  "Ardbennie",
  "Arlington",
  "Ashdown Park",
  "Aspindale Park",
  "Athlone",
  "Avenues",
  "Avondale",
  "Avondale - The Ridge",
  "Avondale West",
  "Avonlea",
  "Ballantyne Park",
  "Belgravia",
  "Belvedere",
  "Bloomingdale",
  "Bluff Hill",
  "Borrowdale",
  "Borrowdale Brooke",
  "Borrowdale West",
  "Braeside",
  "Brookeview",
  "Budiriro",
  "Carrick Creagh Estate",
  "Chadcombe",
  "Charlotte Brooke",
  "Chisipite",
  "Cold Comfort",
  "Colne Valley",
  "Cranborne",
  "Crowborough",
  "Crowhill Views",
  "Dawnview Park",
  "Donnybrook",
  "Dzivarasekwa",
  "Eastlea",
  "Eastview",
  "Emerald Hill",
  "Epworth",
  "Fairview",
  "Falcon Park",
  "Glaudina",
  "Glen Forest",
  "Glen Lorne",
  "Glen Norah",
  "Glen View",
  "Gletwin Park",
  "Goodhope",
  "Granary Park",
  "Graniteside",
  "Greencroft",
  "Greendale",
  "Greendale North",
  "Greystone Park",
  "Groom Bridge",
  "Gunhill",
  "Harare City Centre",
  "Hatcliffe",
  "Hatfield",
  "Highfield",
  "Highlands",
  "Hillside",
  "Hogerty Hill",
  "Houghton Park",
  "Kambanji",
  "Kamfinsa",
  "Kensington",
  "Kuwadzana",
  "Lewisam",
  "Lochinvar",
  "Mabelreign",
  "Mabvuku",
  "Madokero Estates",
  "Mainway Meadows",
  "Mandara",
  "Manresa",
  "Maranatha",
  "Marimba Park",
  "Marlborough",
  "Matidoda",
  "Mbare",
  "Meyrick Park",
  "Milton Park",
  "Monavale",
  "Mount Hampden",
  "Mount Pleasant",
  "Mount Pleasant Heights",
  "Msasa",
  "Msasa Park",
  "Mufakose",
  "Newlands",
  "Northwood",
  "Park Meadowlands",
  "Parktown",
  "Pomona",
  "Prospect",
  "Queensdale",
  "Quinnington",
  "Rainham",
  "Rhodesville",
  "Rockview",
  "Rolf Valley",
  "Rydale Ridge",
  "Rydale Ridge Park",
  "Sandton Park",
  "Sentosa",
  "Shawasha Hills",
  "Snake Park",
  "Southerton",
  "Southlea Park",
  "Southview Park",
  "Spitzkop",
  "St. Martins",
  "Stoneridge",
  "Strathaven",
  "Sunningdale",
  "Sunridge",
  "Sunway City",
  "Tafara",
  "The Grange",
  "Tynwald",
  "Umwinsidale",
  "Upper Hillside",
  "Vainona",
  "Warren Park",
  "Waterfalls",
  "Westgate",
  "Westlea",
  "Whitecliff",
  "Willowvale",
  "Workington",
  "Zimre Park",
  "Other"
];

export default function CustomerForm() {
  const { id: customerId } = useParams();
  const isEdit = !!customerId && customerId !== 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', address: '', neighborhood: '', phone: '', email: '', notes: '' });
  const [neighborhoodMultiplier, setNeighborhoodMultiplierState] = useState('1');
  const draftKey = useMemo(() => `customer:${customerId || 'new'}`, [customerId]);

  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => db.entities.Customer.filter({ id: customerId }),
    enabled: isEdit,
  });
  const currentCustomer = customer?.[0];

  useEffect(() => {
    if (currentCustomer) {
      const c = currentCustomer;
      setForm({ name: c.name || '', address: c.address || '', neighborhood: c.neighborhood || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '' });
    }
  }, [currentCustomer]);

  useEffect(() => {
    const value = getNeighborhoodMultiplier(form.neighborhood);
    setNeighborhoodMultiplierState(String(value));
  }, [form.neighborhood]);

  useEffect(() => {
    const draft = loadDraft(draftKey);
    if (draft && !isEdit) {
      setForm((f) => ({ ...f, ...draft }));
    }
  }, [draftKey, isEdit]);

  useEffect(() => {
    const save = () => saveDraft(draftKey, form);
    const id = setTimeout(save, 250);
    const onBeforeBack = () => save();
    window.addEventListener('app:before-back', onBeforeBack);
    return () => {
      clearTimeout(id);
      window.removeEventListener('app:before-back', onBeforeBack);
    };
  }, [draftKey, form]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? db.entities.Customer.update(customerId, data)
      : db.entities.Customer.create(data),
    onSuccess: (saved) => {
      clearDraft(draftKey);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.neighborhood) {
      const num = parseFloat(neighborhoodMultiplier);
      const safe = Number.isFinite(num) && num > 0 ? num : 1;
      setNeighborhoodMultiplierState(String(safe));
      setNeighborhoodMultiplier(form.neighborhood, safe);
    }
    mutation.mutate(form);
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Customer' : 'New Customer'} backPath="/customers" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {isEdit && currentCustomer?.created_date && (
          <div className="text-xs text-muted-foreground">
            Added: {formatDateTime(currentCustomer.created_date)}
          </div>
        )}
        <div>
          <Label>Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" required />
        </div>
        <div>
          <Label>Phone (WhatsApp) *</Label>
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+263 7X XXX XXXX" required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <Label>Neighborhood</Label>
          <Select value={form.neighborhood} onValueChange={v => set('neighborhood', v)}>
            <SelectTrigger><SelectValue placeholder="Select neighborhood" /></SelectTrigger>
            <SelectContent>
              {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {form.neighborhood && (
          <div>
            <Label>Neighborhood Multiplier (applies to all customers in {form.neighborhood})</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={neighborhoodMultiplier}
              onChange={(e) => setNeighborhoodMultiplierState(e.target.value)}
              onBlur={() => {
                const num = parseFloat(neighborhoodMultiplier);
                const safe = Number.isFinite(num) && num > 0 ? num : 1;
                setNeighborhoodMultiplierState(String(safe));
                setNeighborhoodMultiplier(form.neighborhood, safe);
              }}
              className="h-10"
            />
          </div>
        )}
        <div>
          <Label>Address</Label>
          <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
        </div>
        <div>
          <Label>Special Notes</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Aggressive dogs, high ladder needed..." rows={3} />
        </div>
        <Button type="submit" className="w-full h-12 text-sm font-semibold" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
        </Button>
      </form>
    </div>
  );
}

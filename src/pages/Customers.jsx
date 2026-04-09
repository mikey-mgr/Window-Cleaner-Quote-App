import db from '@/api/localDb';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Phone, MapPin, Copy, Trash2, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullRefreshIndicator from '@/components/shared/PullRefreshIndicator';
import { formatDateTime } from '@/lib/dateUtils';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => db.entities.Customer.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Customer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (c) => {
      const { id, created_date, updated_date, created_by, ...data } = c;
      return db.entities.Customer.create({ ...data, name: `${data.name} (Copy)` });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer duplicated'); },
  });

  const { containerRef, pullY, refreshing } = usePullToRefresh(() =>
    queryClient.invalidateQueries({ queryKey: ['customers'] })
  );

  const neighborhoods = useMemo(() => {
    const list = customers.map((c) => c.neighborhood).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => String(a).localeCompare(String(b)));
  }, [customers]);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    let result = customers.filter(c =>
      c.name?.toLowerCase().includes(searchLower) ||
      c.neighborhood?.toLowerCase().includes(searchLower)
    );
    if (neighborhoodFilter !== 'all') {
      result = result.filter((c) => c.neighborhood === neighborhoodFilter);
    }
    if (sortBy === 'name_asc') {
      result = [...result].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (sortBy === 'name_desc') {
      result = [...result].sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
    } else if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')));
    } else {
      result = [...result].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
    }
    return result;
  }, [customers, search, neighborhoodFilter, sortBy]);

  return (
    <div ref={containerRef} className="overflow-y-auto h-full">
      <PullRefreshIndicator pullY={pullY} refreshing={refreshing} />
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} clients`}
        actions={<Button size="sm" className="gap-1.5" onClick={() => navigate('/customers/new')}><Plus className="w-4 h-4" /> Add</Button>}
      />

      <div className="px-4 pt-3 pb-2 space-y-2">
        <Input placeholder="Search by name or neighborhood..." value={search} onChange={e => setSearch(e.target.value)} className="h-10" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All neighborhoods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All neighborhoods</SelectItem>
              {neighborhoods.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name_asc">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Users} title="No customers" description="Add your first client to get started" actionLabel="Add Customer" onAction={() => navigate('/customers/new')} />
        )}
        {filtered.map(c => (
          <Card key={c.id} className="p-3">
            <div className="flex items-start justify-between">
              <Link to={`/customers/${c.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{c.neighborhood || c.address || '—'}</span>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.notes && <p className="text-xs text-amber-600 mt-1 font-medium">⚠ {c.notes}</p>}
                {c.created_date && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Added: {formatDateTime(c.created_date)}
                  </p>
                )}
              </Link>
              <div className="flex gap-1 shrink-0 ml-2">
                {c.phone && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={`tel:${String(c.phone).replace(/\D/g, '') || c.phone}`}>
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateMutation.mutate(c)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(c)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name || 'this customer'} and cannot be undone.
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


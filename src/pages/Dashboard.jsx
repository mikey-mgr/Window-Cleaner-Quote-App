import db from '@/api/localDb';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { Layers, Users, FileText, Plus, Zap, ArrowRight, Moon, Sun, Trash2, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { useTheme } from '@/context/ThemeContext';
import DeleteAccountDialog from '@/components/shared/DeleteAccountDialog';

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to}>
      <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { theme, toggle } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.WindowTemplate.list(),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => db.entities.Customer.list(),
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => db.entities.Quote.list('-created_date', 50),
  });

  const activeQuotes = quotes.filter(q => ['sent', 'in_progress'].includes(q.status));
  const recentQuotes = quotes.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Apex Window Care</h1>
              <p className="text-xs text-muted-foreground">D2D Quoting Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggle}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-5">
        <div className="flex gap-3">
          <Button asChild className="flex-1 h-12 text-sm font-semibold gap-2">
            <Link to="/quotes/new"><Plus className="w-4 h-4" /> New Quote</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-12 text-sm font-semibold gap-2">
            <Link to="/customers/new"><Users className="w-4 h-4" /> Add Client</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mb-6 grid grid-cols-2 gap-3">
        <StatCard icon={Layers} label="Templates" value={templates.length} color="bg-primary" to="/templates" />
        <StatCard icon={Users} label="Clients" value={customers.length} color="bg-accent" to="/customers" />
        <StatCard icon={FileText} label="Active Quotes" value={activeQuotes.length} color="bg-amber-500" to="/quotes" />
        <StatCard icon={FileText} label="Total Quotes" value={quotes.length} color="bg-violet-500" to="/quotes" />
      </div>

      {/* Recent Quotes */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent Quotes</h2>
          <Link to="/quotes" className="text-xs text-primary font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentQuotes.map(q => (
            <Link key={q.id} to={`/quotes/${q.id}`}>
              <Card className="p-3 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div>
                  <p className="text-sm font-medium">{q.customer_name || 'No customer'}</p>
                  <p className="text-xs text-muted-foreground">{q.customer_address || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">${(q.grand_total || 0).toFixed(2)}</span>
                  <StatusBadge status={q.status} />
                </div>
              </Card>
            </Link>
          ))}
          {recentQuotes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No quotes yet</p>
          )}
        </div>
      </div>

      {/* Settings section */}
      <div className="px-5 mt-6 mb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</h2>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-11 justify-start gap-3 text-sm"
            onClick={() => db.auth.logout('/')}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 justify-start gap-3 text-sm text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </Button>
        </div>
      </div>

      <DeleteAccountDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
    </div>
  );
}

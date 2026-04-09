import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from './context/ThemeContext';
import RouteTransition from './components/layout/RouteTransition';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getNeighborhoodMultiplier } from '@/lib/neighborhoodMultipliers';
import { calcGrandTotal } from '@/lib/quoteUtils';
import db from '@/api/base44Client';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import Quotes from './pages/Quotes';
import QuoteBuilder from './pages/QuoteBuilder';
import QuoteDetail from './pages/QuoteDetail';
import CounterMode from './pages/CounterMode';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressRef = useRef(0);
  const TAB_STACKS_KEY = 'windowcleaner:tab-stacks';

  const getBaseForPath = (path) => {
    if (path === '/') return '/';
    if (path.startsWith('/templates')) return '/templates';
    if (path.startsWith('/customers')) return '/customers';
    if (path.startsWith('/quotes')) return '/quotes';
    if (path.startsWith('/counter')) return '/quotes';
    return null;
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onNavigateBack = () => {
      const base = getBaseForPath(location.pathname);
      if (base && base !== '/') {
        try {
          const raw = sessionStorage.getItem(TAB_STACKS_KEY);
          const stacks = raw ? JSON.parse(raw) : {};
          const stack = Array.isArray(stacks[base]) ? stacks[base] : [];
          if (stack[stack.length - 1] !== location.pathname) {
            stack.push(location.pathname);
          }
          if (stack.length > 1) {
            stack.pop();
            const prev = stack[stack.length - 1];
            stacks[base] = stack;
            sessionStorage.setItem(TAB_STACKS_KEY, JSON.stringify(stacks));
            navigate(prev, { replace: true });
            return;
          }
        } catch {
          // ignore
        }
        navigate('/');
        return;
      }
      if (location.pathname !== '/') {
        navigate(-1);
        return;
      }
      const now = Date.now();
      if (now - lastBackPressRef.current < 1500) {
        CapApp.exitApp();
      } else {
        lastBackPressRef.current = now;
        toast.message('Press back again to exit');
      }
    };
    const onExitRequest = () => {
      const now = Date.now();
      if (now - lastBackPressRef.current < 1500) {
        CapApp.exitApp();
      } else {
        lastBackPressRef.current = now;
        toast.message('Press back again to exit');
      }
    };
    window.addEventListener('app:request-exit', onExitRequest);
    window.addEventListener('app:navigate-back', onNavigateBack);

    return () => {
      window.removeEventListener('app:request-exit', onExitRequest);
      window.removeEventListener('app:navigate-back', onNavigateBack);
    };
  }, [navigate, location.pathname]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <RouteTransition>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerForm />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/new" element={<QuoteBuilder />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/counter/:id" element={<CounterMode />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </RouteTransition>
  );
};

function App() {
  useEffect(() => {
    const handler = async (e) => {
      if (e?.detail?.neighborhood) {
        const neighborhood = e.detail.neighborhood;
        const mult = getNeighborhoodMultiplier(neighborhood);
        const allQuotes = await db.entities.Quote.list('-created_date', 500);
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
        queryClientInstance.invalidateQueries({ queryKey: ['quotes'] });
        queryClientInstance.invalidateQueries({ queryKey: ['quote'], exact: false });
      }
    };
    window.addEventListener('neighborhood-multiplier-change', handler);
    return () => window.removeEventListener('neighborhood-multiplier-change', handler);
  }, []);

  useEffect(() => {
    const handler = async (e) => {
      const template = e?.detail;
      if (!template?.id) return;
      const allQuotes = await db.entities.Quote.list('-created_date', 500);
      const updates = await Promise.all(allQuotes.map(async (q) => {
        let changed = false;
        const mult = getNeighborhoodMultiplier(q.customer_neighborhood);
        const updatedItems = (q.line_items || []).map((item) => {
          if (item.template_id !== template.id) return item;
          if (item.price_overridden) return item;
          const nextBase = Number(template.base_price ?? item.base_unit_price ?? item.unit_price ?? 0);
          const nextUnit = nextBase * (mult || 1);
          if (item.base_unit_price === nextBase && item.unit_price === nextUnit) return item;
          changed = true;
          return { ...item, base_unit_price: nextBase, unit_price: nextUnit };
        });
        if (!changed) return null;
        const grandTotal = calcGrandTotal(updatedItems, q.neighborhood_discount || 0);
        return db.entities.Quote.update(q.id, { line_items: updatedItems, grand_total: grandTotal });
      }));
      if (updates.some(Boolean)) {
        queryClientInstance.invalidateQueries({ queryKey: ['quotes'] });
        queryClientInstance.invalidateQueries({ queryKey: ['quote'], exact: false });
      }
    };
    window.addEventListener('WindowTemplate:updated', handler);
    return () => window.removeEventListener('WindowTemplate:updated', handler);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

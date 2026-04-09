import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import MobileNav from './MobileNav';

const LAST_TAB_KEY = 'windowcleaner:last-tab-paths';
const TAB_STACKS_KEY = 'windowcleaner:tab-stacks';
const TAB_BASES = ['/', '/templates', '/customers', '/quotes'];

const getBaseForPath = (path) => {
  if (path === '/') return '/';
  if (path.startsWith('/templates')) return '/templates';
  if (path.startsWith('/customers')) return '/customers';
  if (path.startsWith('/quotes')) return '/quotes';
  if (path.startsWith('/counter')) return '/quotes';
  return null;
};

export default function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    const base = getBaseForPath(location.pathname);
    if (!base) return;
    try {
      const raw = localStorage.getItem(LAST_TAB_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[base] = location.pathname;
      localStorage.setItem(LAST_TAB_KEY, JSON.stringify(map));
    } catch {
      // ignore storage errors
    }
    try {
      const rawStacks = sessionStorage.getItem(TAB_STACKS_KEY);
      const stacks = rawStacks ? JSON.parse(rawStacks) : {};
      const stack = Array.isArray(stacks[base]) ? stacks[base] : [];
      if (stack[stack.length - 1] !== location.pathname) {
        stack.push(location.pathname);
      }
      if (stack.length > 30) stack.splice(0, stack.length - 30);
      stacks[base] = stack;
      sessionStorage.setItem(TAB_STACKS_KEY, JSON.stringify(stacks));
    } catch {
      // ignore storage errors
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <MobileNav />
    </div>
  );
}

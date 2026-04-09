import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, FileText, Layers, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Home' },
  { path: '/templates', icon: Layers, label: 'Windows' },
  { path: '/customers', icon: Users, label: 'Clients' },
  { path: '/quotes', icon: FileText, label: 'Quotes' },
];

export default function MobileNav() {
  const location = useLocation();
  let lastPaths = {};
  try {
    const raw = localStorage.getItem('windowcleaner:last-tab-paths');
    lastPaths = raw ? JSON.parse(raw) : {};
  } catch {
    lastPaths = {};
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around px-2 py-1 pb-safe">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path) || (path === '/quotes' && location.pathname.startsWith('/counter'));
          const stored = lastPaths?.[path];
          const isStoredValid = path === '/'
            ? stored === '/'
            : stored?.startsWith(path) || (path === '/quotes' && stored?.startsWith('/counter'));
          const target = stored && isStoredValid ? stored : path;
          return (
            <Link
              key={path}
              to={target}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

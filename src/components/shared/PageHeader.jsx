import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PageHeader({ title, subtitle, backPath, actions }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border pt-safe">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {backPath && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(backPath)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullRefreshIndicator({ pullY, refreshing }) {
  const progress = Math.min(pullY / THRESHOLD, 1);
  const show = pullY > 5 || refreshing;

  if (!show) return null;

  return (
    <div
      className="flex items-center justify-center pointer-events-none"
      style={{ height: refreshing ? 44 : pullY * 0.6, transition: refreshing ? 'height 0.2s' : 'none', overflow: 'hidden' }}
    >
      <div
        className="w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center"
        style={{ opacity: progress }}
      >
        <RefreshCw
          className="w-4 h-4 text-primary"
          style={{
            transform: `rotate(${refreshing ? 0 : progress * 180}deg)`,
            animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
          }}
        />
      </div>
    </div>
  );
}
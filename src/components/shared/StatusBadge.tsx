import { cn } from '@/lib/utils';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

const toneClass: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
};

const statusTone = (status: string): Tone => {
  const s = status.toLowerCase();
  if (['present', 'online', 'active', 'in progress', 'completed', 'approved'].includes(s)) return 'green';
  if (['late', 'pending', 'on hold'].includes(s)) return 'amber';
  if (['absent', 'offline', 'rejected', 'cancelled', 'canceled'].includes(s)) return 'red';
  if (['leave'].includes(s)) return 'blue';
  return 'gray';
};

export function StatusBadge({ status, tone, className }: { status: string; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneClass[tone ?? statusTone(status)],
        className
      )}
    >
      {status}
    </span>
  );
}

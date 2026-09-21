import type { ReactNode } from 'react';

type Tone = 'note' | 'tip' | 'caution' | 'danger';

const TONE: Record<Tone, { ring: string; label: string; icon: string }> = {
  note: {
    ring: 'border-slate-400/40 bg-slate-500/6',
    label: 'text-slate-700 dark:text-slate-300',
    icon: 'ℹ',
  },
  tip: {
    ring: 'border-emerald-500/40 bg-emerald-500/6',
    label: 'text-emerald-800 dark:text-emerald-300',
    icon: '✔',
  },
  caution: {
    ring: 'border-amber-500/45 bg-amber-500/8',
    label: 'text-amber-800 dark:text-amber-300',
    icon: '⚠',
  },
  danger: {
    ring: 'border-rose-500/45 bg-rose-500/8',
    label: 'text-rose-800 dark:text-rose-300',
    icon: '✖',
  },
};

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: Tone;
  title?: string;
  children: ReactNode;
}) {
  const tone = TONE[type];

  return (
    <div className={`my-6 rounded-lg border-l-[3px] px-4 py-3 ${tone.ring}`}>
      {title ? (
        <p
          className={`mb-1.5 flex items-center gap-2 text-sm font-semibold ${tone.label}`}
        >
          <span aria-hidden="true">{tone.icon}</span>
          {title}
        </p>
      ) : null}
      <div className="callout-body text-[0.94rem] leading-relaxed [&>*+*]:mt-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';

type Tone = 'note' | 'tip' | 'caution' | 'danger';

// Colours come from the --note / --tip / --caution / --danger tokens in
// globals.css, keyed off data-tone, so both themes are handled in one place.
const ICON: Record<Tone, IconName> = {
  note: 'info',
  tip: 'check-circle',
  caution: 'alert',
  danger: 'stop',
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
  return (
    <div className="callout" data-tone={type} role="note">
      <Icon name={ICON[type]} size={19} className="callout-icon" />
      <div className="callout-main">
        {title ? <p className="callout-title">{title}</p> : null}
        <div className="callout-body">{children}</div>
      </div>
    </div>
  );
}

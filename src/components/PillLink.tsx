import type { ReactNode } from 'react';
import { linkProps } from '@/lib/links';
import Frame from './sketch/Frame';

/**
 * The pill the pages use for every real action — download, open, close —
 * drawn by hand: `solid` is filled with ink, the one thing to do on a page,
 * and `outline` is the pencilled alternatives beside it; `sm` is the size
 * for a toolbar, `md` for a page's own buttons.
 */
const BASE = 'sk-btn rounded-full focus-ring';

const VARIANTS = {
  solid: '',
  outline: 'sk-btn-outline',
} as const;

const SIZES = {
  /** Toolbar of a dialog header. */
  sm: 'px-4 py-2 text-sm',
  /** Body of a panel, a dialog footer, the contact page's actions. */
  md: 'px-6 py-3 text-base',
} as const;

type Common = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /** Appended last, for the extras one caller genuinely needs. */
  className?: string;
  children: ReactNode;
};

type PillLinkProps = Common &
  (
    | {
        as?: 'a';
        href: string;
        /** Saves the file under this name instead of navigating to it. */
        download?: string;
        onClick?: never;
      }
    | { as: 'button'; onClick: () => void; href?: never; download?: never }
  );

export default function PillLink(props: PillLinkProps) {
  const { variant = 'solid', size = 'md', className = '', children } = props;
  const cls = [BASE, SIZES[size], VARIANTS[variant], className].filter(Boolean).join(' ');
  const pill = <Frame r={999} weight={1.6} tone={1} fill={variant === 'solid'} className="sk-under" />;

  if (props.as === 'button') {
    return (
      <button type="button" onClick={props.onClick} className={cls}>
        {pill}
        {children}
      </button>
    );
  }

  // A download has to stay in this tab; every other link opens in its own.
  return (
    <a
      href={props.href}
      download={props.download}
      {...(props.download ? {} : linkProps(props.href))}
      className={cls}
    >
      {pill}
      {children}
    </a>
  );
}

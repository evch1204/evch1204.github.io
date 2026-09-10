import type { ReactNode } from 'react';
import { linkProps } from '@/lib/links';

/**
 * The rounded pill the pages use for every real action — download, open, close.
 * It was nine hand-written class strings that had drifted a pixel apart; the two
 * looks and three sizes below are all of the variation that was ever intended.
 */
const BASE = 'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors';

const VARIANTS = {
  solid: 'bg-zinc-900 text-white hover:bg-black',
  outline: 'border border-zinc-200 text-zinc-900 hover:bg-zinc-50',
} as const;

const SIZES = {
  /** Toolbar of a dialog header. */
  sm: 'px-4 py-2 text-xs',
  /** Body of a panel or a dialog footer. */
  md: 'px-6 py-3 text-sm',
  /** The contact page's two headline actions. */
  lg: 'px-8 py-4 sm:px-10 sm:py-5',
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
  const cls = `${BASE} ${SIZES[size]} ${VARIANTS[variant]}${className ? ` ${className}` : ''}`;

  if (props.as === 'button') {
    return (
      <button type="button" onClick={props.onClick} className={cls}>
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
      {children}
    </a>
  );
}

import { MARK_NAVY, MARK_WHITE } from '../generated/marks';
import { cx } from '../utils';

export interface PoweredByProps {
  /** Default https://rafflenexus.com/ */
  href?: string;
  /** Use the white mark on dark backgrounds. */
  onStage?: boolean;
  className?: string;
}

/** The only sign of Raffle Nexus on a client's raffle site: footer and checkout. */
export function PoweredBy({ href = 'https://rafflenexus.com/', onStage, className }: PoweredByProps) {
  return (
    <a className={cx('rnc-powered', className)} href={href}>
      <img src={onStage ? MARK_WHITE : MARK_NAVY} alt="" width={22} height={22} />
      <span>Powered by <b>Raffle Nexus</b></span>
    </a>
  );
}

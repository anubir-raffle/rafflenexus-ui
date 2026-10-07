import type { ReactNode } from 'react';
import { cx } from '../utils';

const PROVINCES: Record<string, string> = { BC: 'British Columbia', AB: 'Alberta', SK: 'Saskatchewan', MB: 'Manitoba', ON: 'Ontario' };

export interface RosterGroup {
  /** Province code (BC, AB, SK, MB, ON) or a full name. */
  province: string;
  /** Program names. Each client must approve being named in public. */
  items: string[];
  /** Shown when items is empty. Default "None yet". */
  empty?: ReactNode;
}
export interface FlagshipRosterProps {
  groups: RosterGroup[];
  note?: ReactNode;
  className?: string;
}

/** The lotteries on the platform, a tinted row per province, names in two balanced columns. No counts. */
export function FlagshipRoster({ groups, note, className }: FlagshipRosterProps) {
  return (
    <div className={cx('rnc-roster-wrap', className)}>
      <div className="rnc-roster">
        {groups.map((g) => (
          <section key={g.province} className={cx('rnc-roster-row', g.items.length === 0 && 'is-empty')}>
            <h3 className="rnc-roster-prov">{PROVINCES[g.province] || g.province}</h3>
            {g.items.length ? <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul> : <p className="rnc-roster-none">{g.empty || 'None yet'}</p>}
          </section>
        ))}
      </div>
      {note ? <p className="rnc-note">{note}</p> : null}
    </div>
  );
}

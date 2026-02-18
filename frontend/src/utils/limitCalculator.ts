const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateLimit(
  tracker: any,
  periodDays: number
):
  | {
      hasLimit: true;
      elapsed: number;
      accumulated: number;
      max: number;
    }
  | {
      hasLimit: false;
    } {

  if (!tracker) return { hasLimit: false };

  const maxVec = tracker.max_amount?.vec;

  if (!maxVec || maxVec.length === 0) {
    return { hasLimit: false };
  }

  const max = Number(maxVec[0]);
  const accumulated = Number(tracker.accumulated_amount);

  const now = Date.now();
  const lastReset = Number(tracker.last_reset_timestamp) * 1000;
  const diff = now - lastReset;

  const periodMs = periodDays * DAY_MS;

  if (diff >= periodMs) {
    return {
      hasLimit: true,
      elapsed: 0,
      accumulated: 0,
      max,
    };
  }

  if (periodDays === 1) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return {
      hasLimit: true,
      elapsed: hours,
      accumulated,
      max,
    };
  }

  const days = Math.floor(diff / DAY_MS);

  return {
    hasLimit: true,
    elapsed: days,
    accumulated,
    max,
  };
}

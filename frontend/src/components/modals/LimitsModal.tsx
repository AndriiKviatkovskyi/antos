export type LimitData =
  | {
      hasLimit: true;
      elapsed: number;
      accumulated: number;
      max: number;
    }
  | {
      hasLimit: false;
    }
  | null;


interface LimitsModalProps {
  show: boolean;

  daily?: LimitData;
  weekly?: LimitData;
  monthly?: LimitData;

  formatApt: (value: number) => string;

  setShow: (value: boolean) => void;

  styles: any;
}

function LimitCard({
  title,
  limit,
  periodText,
  formatApt,
  styles,
}: {
  title: string;
  limit: LimitData;
  periodText: string;
  formatApt: (value: number) => string;
  styles: any;
}) {
  return (
    <div style={styles.limitCard}>
      <h3>{title}</h3>

      {!limit?.hasLimit ? (
        <p>No limit</p>
      ) : (
        <>
          <p>{limit.elapsed}/{periodText}</p>
          <p>
            {formatApt(limit.accumulated)}/
            {formatApt(limit.max)} APT
          </p>
        </>
      )}
    </div>
  );
}

export default function LimitsModal({
  show,
  daily,
  weekly,
  monthly,
  formatApt,
  setShow,
  styles,
}: LimitsModalProps) {
  if (!show || !daily || !weekly || !monthly) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.limitsModal}>
        <h2>Spending Limits</h2>

        <div style={styles.limitsGrid}>
          <LimitCard
            title="Daily limit"
            limit={daily}
            periodText="24 hours"
            formatApt={formatApt}
            styles={styles}
          />

          <LimitCard
            title="Weekly limit"
            limit={weekly}
            periodText="7 days"
            formatApt={formatApt}
            styles={styles}
          />

          <LimitCard
            title="Monthly limit"
            limit={monthly}
            periodText="30 days"
            formatApt={formatApt}
            styles={styles}
          />
        </div>

        <div style={styles.modalButtons}>
          <button
            style={styles.secondaryButton}
            onClick={() => setShow(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

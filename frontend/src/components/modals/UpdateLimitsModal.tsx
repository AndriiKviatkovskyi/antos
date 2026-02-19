interface UpdateLimitsModalProps {
  show: boolean;

  dailyLimitInput: string;
  weeklyLimitInput: string;
  monthlyLimitInput: string;

  setDailyLimitInput: (value: string) => void;
  setWeeklyLimitInput: (value: string) => void;
  setMonthlyLimitInput: (value: string) => void;

  handleUpdateLimits: () => void;
  setShow: (value: boolean) => void;

  styles: any;
}

export default function UpdateLimitsModal({
  show,
  dailyLimitInput,
  weeklyLimitInput,
  monthlyLimitInput,
  setDailyLimitInput,
  setWeeklyLimitInput,
  setMonthlyLimitInput,
  handleUpdateLimits,
  setShow,
  styles,
}: UpdateLimitsModalProps) {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>Update Spending Limits</h3>

        <input
          style={styles.input}
          type="number"
          placeholder="Daily Limit (APT)"
          value={dailyLimitInput}
          onChange={(e) => setDailyLimitInput(e.target.value)}
        />

        <input
          style={styles.input}
          type="number"
          placeholder="Weekly Limit (APT)"
          value={weeklyLimitInput}
          onChange={(e) => setWeeklyLimitInput(e.target.value)}
        />

        <input
          style={styles.input}
          type="number"
          placeholder="Monthly Limit (APT)"
          value={monthlyLimitInput}
          onChange={(e) => setMonthlyLimitInput(e.target.value)}
        />

        <div style={styles.modalButtons}>
          <button
            style={styles.primaryButton}
            onClick={handleUpdateLimits}
          >
            Update
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => setShow(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

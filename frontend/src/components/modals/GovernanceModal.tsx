interface GovernanceModalProps {
  show: boolean;

  onlyAdminsInitiate: boolean;
  onlyAdminsVote: boolean;
  adminsCanVeto: boolean;

  votingMode: number;
  MODE_COMBINED: number;

  tierTwo: string;
  tierThree: string;

  setOnlyAdminsInitiate: (value: boolean) => void;
  setOnlyAdminsVote: (value: boolean) => void;
  setAdminsCanVeto: (value: boolean) => void;
  setVotingMode: (value: number) => void;
  setTierTwo: (value: string) => void;
  setTierThree: (value: string) => void;

  setShow: (value: boolean) => void;
  handleGovernanceUpdate: () => void;

  styles: any;
}

export default function GovernanceModal({
  show,
  onlyAdminsInitiate,
  onlyAdminsVote,
  adminsCanVeto,
  votingMode,
  MODE_COMBINED,
  tierTwo,
  tierThree,
  setOnlyAdminsInitiate,
  setOnlyAdminsVote,
  setAdminsCanVeto,
  setVotingMode,
  setTierTwo,
  setTierThree,
  setShow,
  handleGovernanceUpdate,
  styles,
}: GovernanceModalProps) {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>Governance Configuration</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={onlyAdminsInitiate}
              onChange={(e) => setOnlyAdminsInitiate(e.target.checked)}
            />{" "}
            Only Admins Can Initiate
          </label>

          <label>
            <input
              type="checkbox"
              checked={onlyAdminsVote}
              onChange={(e) => setOnlyAdminsVote(e.target.checked)}
            />{" "}
            Only Admins Can Vote
          </label>

          <label>
            <input
              type="checkbox"
              checked={adminsCanVeto}
              onChange={(e) => setAdminsCanVeto(e.target.checked)}
            />{" "}
            Admins Can Veto
          </label>
        </div>

        <select
          style={styles.select}
          value={votingMode}
          onChange={(e) => setVotingMode(Number(e.target.value))}
        >
          <option value={1}>Majority</option>
          <option value={2}>Two Thirds</option>
          <option value={3}>Unanimous</option>
          <option value={4}>Combined</option>
        </select>

        {votingMode === MODE_COMBINED && (
          <>
            <input
              style={styles.input}
              type="number"
              placeholder="Tier Two Threshold (APT)"
              value={tierTwo}
              onChange={(e) => setTierTwo(e.target.value)}
            />

            <input
              style={styles.input}
              type="number"
              placeholder="Tier Three Threshold (APT)"
              value={tierThree}
              onChange={(e) => setTierThree(e.target.value)}
            />
          </>
        )}

        <div style={styles.modalButtons}>
          <button
            style={styles.primaryButton}
            onClick={handleGovernanceUpdate}
          >
            Change
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

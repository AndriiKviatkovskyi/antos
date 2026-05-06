import { useEffect } from "react";

interface ProposeTransferModalProps {
  show: boolean;

  proposalRecipient: string;
  proposalAmount: string;
  proposalTimelock: string;
  proposalExecWindow: string;

  hardError?: string | null;
  softWarnings?: string[];

  walletMode: number;

  setProposalRecipient: (value: string) => void;
  setProposalAmount: (value: string) => void;
  setProposalTimelock: (value: string) => void;
  setProposalExecWindow: (value: string) => void;

  handleProposeTransfer: () => void;
  setShow: (value: boolean) => void;
  fetchData: () => Promise<void>;

  styles: any;
}

export default function ProposeTransferModal({
  show,
  proposalRecipient,
  proposalAmount,
  proposalTimelock,
  proposalExecWindow,
  hardError,
  softWarnings = [],
  walletMode,
  setProposalRecipient,
  setProposalAmount,
  setProposalTimelock,
  setProposalExecWindow,
  handleProposeTransfer,
  setShow,
  fetchData,
  styles,
}: ProposeTransferModalProps) {
  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  if (!show) return null;

  const isSafeMode = walletMode === 1;
  const isBlocked = !!hardError || (isSafeMode && softWarnings.length > 0);

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>Create Transfer Proposal</h3>

        <input
          style={styles.input}
          placeholder="Recipient address (0x...)"
          value={proposalRecipient}
          onChange={(e) => setProposalRecipient(e.target.value)}
        />

        <input
          style={styles.input}
          type="number"
          placeholder="Amount (APT)"
          value={proposalAmount}
          onChange={(e) => setProposalAmount(e.target.value)}
        />

        <label>Optional Timelock (Earliest execution time)</label>
        <input
          style={styles.input}
          type="datetime-local"
          value={proposalTimelock}
          onChange={(e) => setProposalTimelock(e.target.value)}
        />

        <label>Optional Execution Deadline</label>
        <input
          style={styles.input}
          type="datetime-local"
          value={proposalExecWindow}
          onChange={(e) => setProposalExecWindow(e.target.value)}
        />

        {hardError && (
          <p style={{ ...styles.errorText, color: "red", fontWeight: "bold" }}>
            ⛔ {hardError}
          </p>
        )}

        {softWarnings.length > 0 && (
          <div>
            {softWarnings.map((w, i) => (
              <p
                key={i}
                style={{
                  ...styles.errorText,
                  color: isSafeMode ? "red" : "orange",
                  fontWeight: isSafeMode ? "bold" : "normal",
                }}
              >
                {isSafeMode ? "⛔" : "⚠️"} {w}
                {!isSafeMode && (
                  <span style={{ display: "block", fontSize: 11, marginTop: 2 }}>
                    Proposal can still be created, but will not execute until wallet configuration is updated or state naturally changes.
                  </span>
                )}
              </p>
            ))}
          </div>
        )}

        <div style={styles.modalButtons}>
          <button
            style={{
              ...styles.primaryButton,
              opacity: isBlocked ? 0.5 : 1,
              cursor: isBlocked ? "not-allowed" : "pointer",
            }}
            disabled={isBlocked}
            onClick={handleProposeTransfer}
          >
            Propose
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
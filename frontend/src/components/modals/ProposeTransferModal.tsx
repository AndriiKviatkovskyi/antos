interface ProposeTransferModalProps {
  show: boolean;

  proposalRecipient: string;
  proposalAmount: string;
  proposalTimelock: string;
  proposalExecWindow: string;
  proposalError?: string | null;

  setProposalRecipient: (value: string) => void;
  setProposalAmount: (value: string) => void;
  setProposalTimelock: (value: string) => void;
  setProposalExecWindow: (value: string) => void;

  handleProposeTransfer: () => void;
  setShow: (value: boolean) => void;

  styles: any;
}

export default function ProposeTransferModal({
  show,
  proposalRecipient,
  proposalAmount,
  proposalTimelock,
  proposalExecWindow,
  proposalError,
  setProposalRecipient,
  setProposalAmount,
  setProposalTimelock,
  setProposalExecWindow,
  handleProposeTransfer,
  setShow,
  styles,
}: ProposeTransferModalProps) {
  if (!show) return null;

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

        {proposalError && <p style={styles.errorText}>{proposalError}</p>}

        <div style={styles.modalButtons}>
          <button
            style={styles.primaryButton}
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

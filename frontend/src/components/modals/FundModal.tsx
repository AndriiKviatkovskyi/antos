interface FundModalProps {
  show: boolean;
  fundAmount: string;

  setFundAmount: (value: string) => void;
  setShow: (value: boolean) => void;

  handleFundWallet: () => void;

  styles: any; // replace with proper type if available
}

export default function FundModal({
  show,
  fundAmount,
  setFundAmount,
  setShow,
  handleFundWallet,
  styles,
}: FundModalProps) {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>Fund Wallet</h3>

        <input
          style={styles.input}
          type="number"
          placeholder="Amount in APT"
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
        />

        <div style={styles.modalButtons}>
          <button
            style={styles.primaryButton}
            onClick={handleFundWallet}
          >
            Send
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

interface LeaveWalletModalProps {
  show: boolean;
  setShow: (value: boolean) => void;
  handleSelfRemove: () => void;
  styles: any;
}

export default function LeaveWalletModal({
  show,
  setShow,
  handleSelfRemove,
  styles,
}: LeaveWalletModalProps) {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3>Leave Wallet</h3>

        <p>Are you sure you want to leave this wallet?</p>

        <div style={styles.modalButtons}>
          <button
            style={{
              ...styles.primaryButton,
              backgroundColor: "#ed1b1b",
            }}
            onClick={handleSelfRemove}
          >
            Yes, Leave
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

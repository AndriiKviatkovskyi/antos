interface KickOwnerModalProps {
  show: boolean;
  ownerToKick: string | null;
  setShow: (value: boolean) => void;
  setOwnerToKick: (value: string | null) => void;
  handleKickOwner: () => void;
  styles: any;
}

export default function KickOwnerModal({
  show,
  ownerToKick,
  setShow,
  setOwnerToKick,
  handleKickOwner,
  styles,
}: KickOwnerModalProps) {
  if (!show || !ownerToKick) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.limitsModal}>
        <h3>Remove Owner</h3>

        <p>Are you sure you want to remove:</p>

        <p style={{ fontFamily: "monospace", fontSize: "13px" }}>
          {ownerToKick}
        </p>

        <div style={styles.modalButtons}>
          <button
            style={{
              ...styles.primaryButton,
              backgroundColor: "#ef4444",
            }}
            onClick={handleKickOwner}
          >
            Yes, Remove
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              setShow(false);
              setOwnerToKick(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface KickOwnerModalProps {
  show: boolean;
  ownerToKick: string | null;
  walletMode: number;
  setShow: (value: boolean) => void;
  setOwnerToKick: (value: string | null) => void;
  handleKickOwner: () => void;
  handleProposeKickOwner: () => void; 
  styles: any;
}

export default function KickOwnerModal({
  show,
  ownerToKick,
  walletMode,
  setShow,
  setOwnerToKick,
  handleKickOwner,
  handleProposeKickOwner,
  styles,
}: KickOwnerModalProps) {
  if (!show || !ownerToKick) return null;

  const isSafeMode = walletMode === 1;

  const title = isSafeMode ? "Propose Owner Removal" : "Remove Owner";

  const description = isSafeMode
    ? "This will create a proposal to remove the owner:"
    : "Are you sure you want to remove:";

  const confirmText = isSafeMode
    ? "Yes, Create Proposal"
    : "Yes, Remove";

  const confirmHandler = isSafeMode
    ? handleProposeKickOwner
    : handleKickOwner;

  const confirmColor = isSafeMode ? "#f59e0b" : "#ef4444";

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.limitsModal}>
        <h3>{title}</h3>

        <p>{description}</p>

        <p style={{ fontFamily: "monospace", fontSize: "13px" }}>
          {ownerToKick}
        </p>

        {isSafeMode && (
          <p style={{ fontSize: "12px", opacity: 0.7 }}>
            Other owners will need to approve this action.
          </p>
        )}

        <div style={styles.modalButtons}>
          <button
            style={{
              ...styles.primaryButton,
              backgroundColor: confirmColor,
            }}
            onClick={confirmHandler}
          >
            {confirmText}
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
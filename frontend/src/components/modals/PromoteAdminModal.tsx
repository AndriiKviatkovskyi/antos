interface PromoteAdminModalProps {
  show: boolean;
  ownerToPromote: string | null;
  setShow: (value: boolean) => void;
  setOwnerToPromote: (value: string | null) => void;
  handlePromote: () => void;
  styles: any;
}

export default function PromoteAdminModal({
  show,
  ownerToPromote,
  setShow,
  setOwnerToPromote,
  handlePromote,
  styles,
}: PromoteAdminModalProps) {
  if (!show || !ownerToPromote) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.limitsModal}>
        <h3>Promote to Admin</h3>

        <p>Are you sure you want to promote:</p>

        <p style={{ fontFamily: "monospace", fontSize: "13px" }}>
          {ownerToPromote}
        </p>

        <div style={styles.modalButtons}>
          <button
            style={{
              ...styles.primaryButton,
              backgroundColor: "#16a34a", // зелений
            }}
            onClick={handlePromote}
          >
            Yes, Promote
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => {
              setShow(false);
              setOwnerToPromote(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
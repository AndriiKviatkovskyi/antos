interface InviteModalProps {
  show: boolean;
  walletFull: boolean;
  inviteAddress: string;
  inviteRole: "owner" | "admin";
  isBlacklisted: boolean;

  setInviteAddress: (value: string) => void;
  setInviteRole: (value: "owner" | "admin") => void;
  setShow: (value: boolean) => void;

  handleInvite: () => void;

  styles: any; // or your exact type if you have one
}

export default function InviteModal({
  show,
  walletFull,
  inviteAddress,
  inviteRole,
  isBlacklisted,
  setInviteAddress,
  setInviteRole,
  setShow,
  handleInvite,
  styles,
}: InviteModalProps) {
  if (!show) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        {walletFull ? (
          <p>Wallet is full</p>
        ) : (
          <>
            <h3>Invite User</h3>

            <input
              style={styles.input}
              placeholder="0x..."
              value={inviteAddress}
              onChange={(e) => setInviteAddress(e.target.value)}
            />

            <select
              style={styles.select}
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "owner" | "admin")
              }
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>

            {isBlacklisted && (
              <p style={styles.errorText}>
                Alert! This user is blacklisted from joining the wallet
              </p>
            )}

            <div style={styles.modalButtons}>
              <button
                style={styles.primaryButton}
                disabled={isBlacklisted}
                onClick={handleInvite}
              >
                Invite
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

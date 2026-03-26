interface KickProposal {
  id: number;
  initiator: string;
  target: string;
  approvals: string[];
  created_at: number;
  active: boolean;
}

interface KickProposalsModalProps {
  show: boolean;
  walletData: any;
  currentUserHex?: string | null;
  handleVoteKick: (id: number) => void;
  setShow: (v: boolean) => void;
  styles: any;
}

export function KickProposalsModal({
  show,
  walletData,
  currentUserHex,
  handleVoteKick,
  setShow,
  styles,
}: KickProposalsModalProps) {
  if (!show || !walletData) return null;

  const proposals: KickProposal[] =
    walletData.kick_proposals?.filter((p: KickProposal) => p.active) || [];

  const totalOwners = walletData.owners.length;
  const threshold = Math.ceil((2 * totalOwners) / 3);

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.proposalsModal}>
        <h2>Kick Proposals</h2>

        {proposals.length === 0 && <p>No active proposals</p>}

        {proposals
          .slice()
          .reverse()
          .map((p: KickProposal) => {
            const approvalsCount = p.approvals.length;
            const alreadyVoted = p.approvals.includes(
              currentUserHex?.toLowerCase()! // TODO: TS for this line
            );

            return (
              <div key={p.id} style={styles.proposalCard}>
                <div style={{ flex: 1 }}>
                  <p><b>ID:</b> {p.id}</p>
                  <p><b>Initiator:</b> {p.initiator}</p>
                  <p><b>Target:</b> {p.target}</p>
                  <p>
                    <b>Created:</b>{" "}
                    {new Date(p.created_at * 1000).toLocaleString()}
                  </p>
                  <p>
                    <b>Threshold:</b> {approvalsCount}/{threshold}
                  </p>
                </div>

                <div style={{ width: 260 }}>
                  <button
                    style={styles.secondaryButton}
                    onClick={() =>
                      alert(p.approvals.join("\n"))
                    }
                  >
                    View Approvals
                  </button>

                  <button
                    style={{
                      ...styles.primaryButton,
                      marginTop: 8,
                      opacity: alreadyVoted ? 0.5 : 1,
                      cursor: alreadyVoted ? "not-allowed" : "pointer",
                    }}
                    disabled={alreadyVoted}
                    onClick={() => handleVoteKick(p.id)}
                  >
                    Vote
                  </button>
                </div>
              </div>
            );
          })}

        <div style={styles.modalButtons}>
          <button
            style={styles.secondaryButton}
            onClick={() => setShow(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
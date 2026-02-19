interface Proposal {
  id: number | string;
  creator: string;
  recipient: string;
  amount: number;
  earliest_execution_time: number;
  expiry_time: number;
  approvals: string[];
  is_executed: boolean;
}

interface WalletData {
  proposals: Proposal[];
  only_admins_can_vote: boolean;
  admins: string[];
  owners: string[];
  voting_mode: number;
  tier_two_threshold: number;
  tier_three_threshold: number;
}

interface ProposalsModalProps {
  show: boolean;
  walletData: WalletData | null;
  isAdmin: boolean;
  expandedApprovals: string | number | null;
  setExpandedApprovals: (value: string | number | null) => void;
  handleVote: (proposalId: string | number) => void;
  formatApt: (value: number) => string;
  setShow: (value: boolean) => void;
  MODE_COMBINED: number;
  MODE_MAJORITY: number;
  styles: any;
}

export default function ProposalsModal({
  show,
  walletData,
  isAdmin,
  expandedApprovals,
  setExpandedApprovals,
  handleVote,
  formatApt,
  setShow,
  MODE_COMBINED,
  MODE_MAJORITY,
  styles,
}: ProposalsModalProps) {
  if (!show || !walletData) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.proposalsModal}>
        <h2>All Proposals</h2>

        {walletData.proposals
          ?.slice()
          .reverse()
          .map((proposal: Proposal) => {
            const totalVoters = walletData.only_admins_can_vote
              ? walletData.admins.length
              : walletData.owners.length;

            let activeMode = walletData.voting_mode;

            if (activeMode === MODE_COMBINED) {
              if (proposal.amount < walletData.tier_two_threshold)
                activeMode = MODE_MAJORITY;
              else if (proposal.amount < walletData.tier_three_threshold)
                activeMode = 2;
              else activeMode = 3;
            }

            const approvalsCount = proposal.approvals.length;
            let requiredVotes = totalVoters;

            if (activeMode === MODE_MAJORITY)
              requiredVotes = Math.floor(totalVoters / 2) + 1;
            else if (activeMode === 2)
              requiredVotes = Math.ceil((2 * totalVoters) / 3);
            else if (activeMode === 3) requiredVotes = totalVoters;

            const now = Math.floor(Date.now() / 1000);
            const timelockPassed = now >= proposal.earliest_execution_time;
            const notExpired =
              proposal.expiry_time === 0 || now <= proposal.expiry_time;

            const voteDisabled =
              proposal.is_executed ||
              (walletData.only_admins_can_vote && !isAdmin) ||
              !timelockPassed ||
              !notExpired;

            return (
              <div key={proposal.id} style={styles.proposalCard}>
                <div style={{ flex: 1 }}>
                  <p>
                    <b>ID:</b> {proposal.id}
                  </p>
                  <p>
                    <b>Creator:</b> {proposal.creator}
                  </p>
                  <p>
                    <b>Recipient:</b> {proposal.recipient}
                  </p>
                  <p>
                    <b>Amount:</b> {formatApt(proposal.amount)} APT
                  </p>
                  <p>
                    <b>Earliest Execution:</b>{" "}
                    {new Date(
                      proposal.earliest_execution_time * 1000
                    ).toLocaleString()}
                  </p>
                  <p>
                    <b>Expiry:</b>{" "}
                    {proposal.expiry_time === 0
                      ? "No expiry"
                      : new Date(proposal.expiry_time * 1000).toLocaleString()}
                  </p>
                </div>

                <div style={{ width: 260 }}>
                  {proposal.is_executed ? (
                    <p style={{ fontWeight: 600 }}>
                      Executed with {approvalsCount} votes
                    </p>
                  ) : (
                    <p style={{ fontWeight: 600 }}>
                      Votes: {approvalsCount}/{requiredVotes}
                    </p>
                  )}

                  <button
                    style={styles.secondaryButton}
                    onClick={() =>
                      setExpandedApprovals(
                        expandedApprovals === proposal.id
                          ? null
                          : proposal.id
                      )
                    }
                  >
                    View Approvals
                  </button>

                  {expandedApprovals === proposal.id && (
                    <ul style={styles.ownersList}>
                      {proposal.approvals.map((addr: string) => (
                        <li key={addr} style={styles.ownerItem}>
                          {addr}
                        </li>
                      ))}
                    </ul>
                  )}

                  {!proposal.is_executed && (
                    <button
                      style={{
                        ...styles.primaryButton,
                        marginTop: 8,
                        opacity: voteDisabled ? 0.5 : 1,
                        cursor: voteDisabled ? "not-allowed" : "pointer",
                      }}
                      disabled={voteDisabled}
                      onClick={() => handleVote(proposal.id)}
                    >
                      Vote
                    </button>
                  )}
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

import React, { useState, useEffect } from "react";
import { fetchNicknameByAddress } from "../../utils/userHelpers";

const AddressLabel = ({ 
  addr, 
  nicknames 
}: { 
  addr: string, 
  nicknames: Record<string, string> 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const nick = nicknames[addr];

  const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const displayAddr = isExpanded ? addr : shortAddr;

  if (nick) {
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }} 
        style={{ cursor: "pointer", textDecoration: "underline" }}
        title="Click to toggle full address"
      >
        {nick} ({displayAddr})
      </span>
    );
  }

  return <span>{addr}</span>;
};

interface Proposal {
  id: number | string;
  creator: string;
  recipient: string;
  amount: number;
  approvals: string[];
  status: number;
  created_at: number;
  earliest_execution_time: number;
  expiry_time: number;
}

interface WalletData {
  proposals: Proposal[];
  admins: string[];
  owners: string[];
  voting_mode: number;
  tier_two_threshold: number;
  tier_three_threshold: number;
  wallet_mode: number;
  admins_can_veto: boolean;
}

interface ProposalsModalProps {
  show: boolean;
  walletData: WalletData | null;
  isAdmin: boolean;
  expandedApprovals: string | number | null;
  setExpandedApprovals: (value: string | number | null) => void;
  handleVote: (proposalId: string | number) => void;
  handleVeto: (proposalId: string | number) => void;
  handleCancel: (proposalId: string | number) => void;
  handleExecute: (proposalId: string | number) => void;
  walletMode: number;
  adminsCanVeto: boolean;
  formatApt: (value: number) => string;
  setShow: (value: boolean) => void;
  MODE_COMBINED: number;
  MODE_MAJORITY: number;
  currentUser: string | undefined;
  styles: any;
}

export default function ProposalsModal({
  show,
  walletData,
  isAdmin,
  expandedApprovals,
  setExpandedApprovals,
  handleVote,
  handleVeto,
  handleCancel,
  handleExecute,
  walletMode,
  adminsCanVeto,
  formatApt,
  setShow,
  MODE_COMBINED,
  MODE_MAJORITY,
  currentUser,
  styles,
}: ProposalsModalProps) {
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (show && walletData?.proposals) {
      const addressesToFetch = new Set<string>();
      walletData.proposals.forEach((p) => {
        addressesToFetch.add(p.creator);
        addressesToFetch.add(p.recipient);
        p.approvals.forEach((addr) => addressesToFetch.add(addr));
      });

      addressesToFetch.forEach(async (addr) => {
        if (!nicknames[addr]) {
          const nick = await fetchNicknameByAddress(addr);
          if (nick) {
            setNicknames((prev) => ({ ...prev, [addr]: nick }));
          }
        }
      });
    }
  }, [show, walletData]);

  if (!show || !walletData) return null;

  const now = Math.floor(Date.now() / 1000);

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return "Pending";
      case 1: return "Executed";
      case 2: return "Cancelled";
      case 3: return "Vetoed";
      case 4: return "Cancelled (Gov)";
      default: return "Unknown";
    }
  };

  const isFinalStatus = (status: number) => status !== 0;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.proposalsModal}>
        
        <button 
            style={styles.closeCross} 
            onClick={() => setShow(false)}
            aria-label="Close"
        >
          ×
        </button>

        <h2 style={{ marginTop: 0 }}>All Proposals</h2>

        {walletData.proposals?.slice().reverse().map((proposal: Proposal) => {
          const totalVoters = walletData.owners.length;
          const validApprovals = proposal.approvals.filter(addr =>
            walletData.owners.includes(addr)
          );
          const approvalsCount = validApprovals.length;

          let activeMode = walletData.voting_mode;
          if (activeMode === MODE_COMBINED) {
            if (proposal.amount < walletData.tier_two_threshold)
              activeMode = MODE_MAJORITY;
            else if (proposal.amount < walletData.tier_three_threshold)
              activeMode = 2;
            else activeMode = 3;
          }

          let requiredVotes = totalVoters;
          if (activeMode === MODE_MAJORITY)
            requiredVotes = Math.floor(totalVoters / 2) + 1;
          else if (activeMode === 2)
            requiredVotes = Math.ceil((2 * totalVoters) / 3);
          else if (activeMode === 3)
            requiredVotes = totalVoters;

          const thresholdMet = approvalsCount >= requiredVotes;
          const timelockPassed = now >= proposal.earliest_execution_time;
          const notExpired = proposal.expiry_time === 0 || now <= proposal.expiry_time;
          const isPending = proposal.status === 0;
          const hasAlreadyVoted = currentUser ? proposal.approvals.includes(currentUser) : false;

          const voteDisabled = !isPending || !timelockPassed || !notExpired || hasAlreadyVoted;
          const canVeto = isAdmin && adminsCanVeto && walletMode !== 1 && isPending;
          const canCancel = isPending && currentUser && proposal.creator === currentUser;
          const canExecute = isPending && thresholdMet && timelockPassed && notExpired && 
                             currentUser && proposal.creator === currentUser;

          return (
            <div key={proposal.id} style={styles.proposalCard}>
              <div style={{ flex: 1 }}>
                <p><b>ID:</b> {proposal.id}</p>
                <p><b>Creator:</b> <AddressLabel addr={proposal.creator} nicknames={nicknames} /></p>
                <p><b>Recipient:</b> <AddressLabel addr={proposal.recipient} nicknames={nicknames} /></p>
                <p><b>Amount:</b> {formatApt(proposal.amount)} APT</p>

                <p>
                  <b>Status:</b>{" "}
                  <span style={{ fontWeight: 600 }}>
                    {getStatusText(proposal.status)}
                  </span>
                </p>

                <p><b>Created:</b> {new Date(proposal.created_at * 1000).toLocaleString()}</p>
                <p><b>Earliest Execution:</b> {new Date(proposal.earliest_execution_time * 1000).toLocaleString()}</p>
                <p><b>Expiry:</b> {proposal.expiry_time === 0 ? "No expiry" : new Date(proposal.expiry_time * 1000).toLocaleString()}</p>
              </div>

              <div style={{ width: 260 }}>
                {isFinalStatus(proposal.status) ? (
                  <p style={{ fontWeight: 600 }}>
                    {getStatusText(proposal.status)} with {approvalsCount} votes
                  </p>
                ) : (
                  <p style={{ fontWeight: 600 }}>
                    Votes: {approvalsCount}/{requiredVotes}
                  </p>
                )}

                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    setExpandedApprovals(expandedApprovals === proposal.id ? null : proposal.id)
                  }
                >
                  {expandedApprovals === proposal.id ? "Hide Approvals" : "View Approvals"}
                </button>

                {expandedApprovals === proposal.id && (
                  <ul style={styles.ownersList}>
                    {validApprovals.map((addr: string) => (
                      <li key={addr} style={styles.ownerItem}>
                        <AddressLabel addr={addr} nicknames={nicknames} />
                      </li>
                    ))}
                  </ul>
                )}

                {/* --- Action Buttons --- */}
                {isPending && (
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

                {canExecute && (
                  <button
                    style={{
                      ...styles.primaryButton,
                      marginTop: 8,
                      backgroundColor: "#d1fae5",
                      border: "1px solid #10b981",
                      color: "#065f46",
                    }}
                    onClick={() => handleExecute(proposal.id)}
                  >
                    Execute
                  </button>
                )}

                {isPending && (
                  <button
                    style={{
                      ...styles.secondaryButton,
                      marginTop: 8,
                      backgroundColor: "#fef3c7",
                      border: "1px solid #f59e0b",
                      color: "#92400e",
                      opacity: canVeto ? 1 : 0.5,
                      cursor: canVeto ? "pointer" : "not-allowed",
                    }}
                    disabled={!canVeto}
                    onClick={() => handleVeto(proposal.id)}
                  >
                    Veto
                  </button>
                )}

                {canCancel && (
                  <button
                    style={{
                      ...styles.secondaryButton,
                      marginTop: 8,
                      backgroundColor: "#fee2e2",
                      border: "1px solid #dc2626",
                      color: "#7f1d1d",
                    }}
                    onClick={() => handleCancel(proposal.id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div style={styles.modalButtons}>
          <button style={styles.secondaryButton} onClick={() => setShow(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
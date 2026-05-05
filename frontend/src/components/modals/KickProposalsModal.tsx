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
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [expandedApprovalsId, setExpandedApprovalsId] = useState<number | null>(null);

  useEffect(() => {
    if (show && walletData?.kick_proposals) {
      const addressesToFetch = new Set<string>();
      walletData.kick_proposals.forEach((p: KickProposal) => {
        if (p.active) {
          addressesToFetch.add(p.initiator);
          addressesToFetch.add(p.target);
          p.approvals.forEach((addr) => addressesToFetch.add(addr));
        }
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

  const proposals: KickProposal[] =
    walletData.kick_proposals?.filter((p: KickProposal) => p.active) || [];

  const totalOwners = walletData.owners.length;
  const threshold = Math.ceil((2 * totalOwners) / 3);

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

        <h2>Kick Proposals</h2>

        {proposals.length === 0 && <p>No active proposals</p>}

        {proposals
          .slice()
          .reverse()
          .map((p: KickProposal) => {
            const approvalsCount = p.approvals.length;
            const alreadyVoted = p.approvals.some(
              (addr) => addr.toLowerCase() === currentUserHex?.toLowerCase()
            );

            return (
              <div key={p.id} style={styles.proposalCard}>
                <div style={{ flex: 1 }}>
                  <p><b>ID:</b> {p.id}</p>
                  <p>
                    <b>Initiator:</b> <AddressLabel addr={p.initiator} nicknames={nicknames} />
                  </p>
                  <p>
                    <b>Target:</b> <AddressLabel addr={p.target} nicknames={nicknames} />
                  </p>
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
                      setExpandedApprovalsId(expandedApprovalsId === p.id ? null : p.id)
                    }
                  >
                    {expandedApprovalsId === p.id ? "Hide Approvals" : "View Approvals"}
                  </button>

                  {expandedApprovalsId === p.id && (
                    <ul style={{ ...styles.ownersList, marginTop: 8, maxHeight: "150px", overflowY: "auto" }}>
                      {p.approvals.map((addr: string) => (
                        <li key={addr} style={styles.ownerItem}>
                          <AddressLabel addr={addr} nicknames={nicknames} />
                        </li>
                      ))}
                    </ul>
                  )}

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
                    {alreadyVoted ? "Already Voted" : "Vote Kick"}
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